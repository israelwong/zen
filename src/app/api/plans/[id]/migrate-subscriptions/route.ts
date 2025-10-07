import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { newPlanId, notifyUsers = true } = body;

        // Obtener el plan actual
        const currentPlan = await prisma.platform_plans.findUnique({
            where: { id },
            include: {
                subscriptions: {
                    where: { status: 'active' },
                    include: {
                        projects: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                slug: true
                            }
                        }
                    }
                }
            }
        });

        if (!currentPlan) {
            return NextResponse.json(
                { error: "Plan actual no encontrado" },
                { status: 404 }
            );
        }

        // Obtener el nuevo plan
        const newPlan = await prisma.platform_plans.findUnique({
            where: { id: newPlanId }
        });

        if (!newPlan) {
            return NextResponse.json(
                { error: "Nuevo plan no encontrado" },
                { status: 404 }
            );
        }

        // Verificar que el nuevo plan tenga precios
        if (!newPlan.price_monthly && !newPlan.price_yearly) {
            return NextResponse.json(
                { error: "El nuevo plan debe tener al menos un precio configurado" },
                { status: 400 }
            );
        }

        const stripe = getStripe();
        const migrationResults = [];

        // Procesar cada suscripción activa
        for (const subscription of currentPlan.subscriptions) {
            try {
                // Obtener la suscripción de Stripe
                const stripeSubscription = await stripe.subscriptions.retrieve(
                    subscription.stripe_subscription_id
                );

                // Determinar el precio a usar (mensual o anual)
                const isYearly = stripeSubscription.items.data[0].price.recurring?.interval === 'year';
                const newPriceId = isYearly ? newPlan.stripe_price_id : newPlan.stripe_price_id;

                if (!newPriceId) {
                    migrationResults.push({
                        subscriptionId: subscription.id,
                        studioId: subscription.studio_id,
                        status: 'error',
                        message: 'No se encontró precio correspondiente en el nuevo plan'
                    });
                    continue;
                }

                // Actualizar la suscripción en Stripe
                const updatedStripeSubscription = await stripe.subscriptions.update(
                    subscription.stripe_subscription_id,
                    {
                        items: [{
                            id: stripeSubscription.items.data[0].id,
                            price: newPriceId,
                        }],
                        proration_behavior: 'create_prorations',
                        metadata: {
                            ...stripeSubscription.metadata,
                            migrated_from_plan: currentPlan.id,
                            migrated_to_plan: newPlan.id,
                            migration_date: new Date().toISOString()
                        }
                    }
                );

                // Actualizar la suscripción en la base de datos
                await prisma.subscriptions.update({
                    where: { id: subscription.id },
                    data: {
                        plan_id: newPlan.id,
                        updated_at: new Date()
                    }
                });

                migrationResults.push({
                    subscriptionId: subscription.id,
                    studioId: subscription.studio_id,
                    studioName: subscription.projects.name,
                    status: 'success',
                    message: 'Migración exitosa',
                    newPrice: isYearly ? newPlan.price_yearly : newPlan.price_monthly
                });

                // TODO: Enviar notificación por email al usuario
                if (notifyUsers) {
                    console.log(`📧 Notificación enviada a ${subscription.projects.email} sobre migración de plan`);
                    // Aquí se implementaría el envío de email
                }

            } catch (error) {
                console.error(`Error migrando suscripción ${subscription.id}:`, error);
                migrationResults.push({
                    subscriptionId: subscription.id,
                    studioId: subscription.studio_id,
                    status: 'error',
                    message: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        }

        // Archivar el plan anterior si todas las migraciones fueron exitosas
        const hasErrors = migrationResults.some(result => result.status === 'error');
        if (!hasErrors && migrationResults.length > 0) {
            await prisma.platform_plans.update({
                where: { id },
                data: { active: false }
            });
        }

        return NextResponse.json({
            success: true,
            message: `Migración completada. ${migrationResults.filter(r => r.status === 'success').length} exitosas, ${migrationResults.filter(r => r.status === 'error').length} con errores`,
            results: migrationResults,
            archivedOldPlan: !hasErrors && migrationResults.length > 0
        });

    } catch (error) {
        console.error("Error migrating subscriptions:", error);
        return NextResponse.json(
            { error: "Error al migrar suscripciones" },
            { status: 500 }
        );
    }
}

// Endpoint para obtener información sobre la migración
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const plan = await prisma.platform_plans.findUnique({
            where: { id },
            include: {
                subscriptions: {
                    where: { status: 'active' },
                    include: {
                        projects: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                slug: true
                            }
                        }
                    }
                }
            }
        });

        if (!plan) {
            return NextResponse.json(
                { error: "Plan no encontrado" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            plan: {
                id: plan.id,
                name: plan.name,
                active: plan.active,
                price_monthly: plan.price_monthly,
                price_yearly: plan.price_yearly
            },
            activeSubscriptions: plan.subscriptions.length,
            subscriptions: plan.subscriptions.map(sub => ({
                id: sub.id,
                studioId: sub.studio_id,
                studioName: sub.projects.name,
                studioEmail: sub.projects.email,
                currentPeriodEnd: sub.current_period_end
            }))
        });

    } catch (error) {
        console.error("Error getting migration info:", error);
        return NextResponse.json(
            { error: "Error al obtener información de migración" },
            { status: 500 }
        );
    }
}
