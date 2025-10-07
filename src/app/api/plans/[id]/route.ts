import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

// Función para crear precio en Stripe automáticamente
async function createStripePrice(plan: { id: string; name: string; description?: string | null; slug: string; price_monthly?: number | null; price_yearly?: number | null; stripe_product_id?: string | null }) {
    try {
        const stripe = getStripe();

        // Crear producto si no existe
        let product;
        if (plan.stripe_product_id) {
            try {
                product = await stripe.products.retrieve(plan.stripe_product_id);
            } catch {
                console.log("Producto no encontrado, creando uno nuevo");
                product = null;
            }
        }

        if (!product) {
            product = await stripe.products.create({
                name: plan.name,
                description: plan.description || `Plan ${plan.name}`,
                metadata: {
                    plan_id: plan.id,
                    plan_slug: plan.slug,
                },
            });
        }

        // Crear precio mensual si existe
        let monthlyPriceId = null;
        if (plan.price_monthly && plan.price_monthly > 0) {
            const monthlyPrice = await stripe.prices.create({
                product: product.id,
                unit_amount: Math.round(plan.price_monthly * 100), // Convertir a centavos
                currency: "mxn", // Cambiar a MXN
                recurring: { interval: "month" },
                metadata: {
                    plan_id: plan.id,
                    plan_slug: plan.slug,
                    billing_interval: "month",
                },
            });
            monthlyPriceId = monthlyPrice.id;
        }

        // Crear precio anual si existe
        let yearlyPriceId = null;
        if (plan.price_yearly && plan.price_yearly > 0) {
            const yearlyPrice = await stripe.prices.create({
                product: product.id,
                unit_amount: Math.round(plan.price_yearly * 100), // Convertir a centavos
                currency: "mxn", // Cambiar a MXN
                recurring: { interval: "year" },
                metadata: {
                    plan_id: plan.id,
                    plan_slug: plan.slug,
                    billing_interval: "year",
                },
            });
            yearlyPriceId = yearlyPrice.id;
        }

        return {
            productId: product.id,
            monthlyPriceId,
            yearlyPriceId,
        };
    } catch (error) {
        console.error("Error creando precio en Stripe:", error);
        throw new Error("Error al crear precio en Stripe");
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const plan = await prisma.platform_plans.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        projects: true,
                        subscriptions: true
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

        // Convertir Decimal a number para el frontend
        const planFormatted = {
            ...plan,
            price_monthly: plan.price_monthly ? Number(plan.price_monthly) : null,
            price_yearly: plan.price_yearly ? Number(plan.price_yearly) : null
        };

        return NextResponse.json(planFormatted);
    } catch (error) {
        console.error("Error fetching plan:", error);
        return NextResponse.json(
            { error: "Error al cargar el plan" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const body = await request.json();
        const { id } = await params;

        // Verificar que el plan existe
        const existingPlan = await prisma.platform_plans.findUnique({
            where: { id }
        });

        if (!existingPlan) {
            return NextResponse.json(
                { error: "Plan no encontrado" },
                { status: 404 }
            );
        }

        // Parsear JSON fields si vienen como strings y filtrar campos no actualizables
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _count, createdAt, ...updateableFields } = body;

        const planData: Record<string, unknown> = { ...updateableFields };

        // Solo procesar features si está presente en el body
        if ('features' in body) {
            planData.features = typeof body.features === 'string' ?
                JSON.parse(body.features || '[]') : body.features;
        }

        // Solo procesar limits si está presente en el body
        if ('limits' in body) {
            planData.limits = typeof body.limits === 'string' ?
                JSON.parse(body.limits || '{}') : body.limits;
        }

        // Validar stripe_price_id
        const stripePriceId = planData.stripe_price_id as string | null | undefined;
        if (stripePriceId && typeof stripePriceId === 'string' && stripePriceId.trim() !== '') {
            // Verificar que no esté duplicado
            const existingPlanWithStripeId = await prisma.platform_plans.findFirst({
                where: {
                    stripe_price_id: stripePriceId,
                    id: { not: id } // Excluir el plan actual
                }
            });

            if (existingPlanWithStripeId) {
                return NextResponse.json(
                    { error: "Ya existe un plan con ese Stripe Price ID. Deja el campo vacío para generar uno automáticamente." },
                    { status: 409 }
                );
            }
        } else if (stripePriceId === '' || stripePriceId === null) {
            // Si está vacío, establecer como null para que se genere automáticamente
            planData.stripe_price_id = null;
        }

        // Validar que slug no esté duplicado (si se está actualizando)
        if (planData.slug) {
            const existingPlanWithSlug = await prisma.platform_plans.findFirst({
                where: {
                    slug: planData.slug,
                    id: { not: id } // Excluir el plan actual
                }
            });

            if (existingPlanWithSlug) {
                return NextResponse.json(
                    { error: "Ya existe un plan con ese slug" },
                    { status: 409 }
                );
            }
        }

        const plan = await prisma.platform_plans.update({
            where: { id },
            data: planData,
            include: {
                _count: {
                    select: {
                        projects: true,
                        subscriptions: true
                    }
                }
            }
        });

        // Si no hay stripe_price_id pero hay precios, crear automáticamente en Stripe
        if (!plan.stripe_price_id && (plan.price_monthly || plan.price_yearly)) {
            try {
                const stripeData = await createStripePrice({
                    id: plan.id,
                    name: plan.name,
                    description: plan.description,
                    slug: plan.slug,
                    price_monthly: plan.price_monthly ? Number(plan.price_monthly) : null,
                    price_yearly: plan.price_yearly ? Number(plan.price_yearly) : null,
                    stripe_product_id: plan.stripe_product_id
                });

                // Actualizar el plan con los IDs de Stripe
                await prisma.platform_plans.update({
                    where: { id },
                    data: {
                        stripe_product_id: stripeData.productId,
                        stripe_price_id: stripeData.monthlyPriceId || stripeData.yearlyPriceId,
                    }
                });

                // Actualizar el objeto plan para la respuesta
                plan.stripe_product_id = stripeData.productId;
                plan.stripe_price_id = stripeData.monthlyPriceId || stripeData.yearlyPriceId;

                console.log(`✅ Precio creado automáticamente en Stripe para plan: ${plan.name}`);
            } catch (error) {
                console.error("Error creando precio automáticamente:", error);

                // Manejar error específico de configuración de Stripe
                if (error instanceof Error && error.message.includes("STRIPE_SECRET_KEY is not set")) {
                    return NextResponse.json(
                        { error: "Stripe no está configurado. Por favor, configura las claves de Stripe en el archivo .env.local. Ver docs/STRIPE_SETUP.md para instrucciones." },
                        { status: 500 }
                    );
                }

                // Si falla la creación en Stripe, devolver error específico
                return NextResponse.json(
                    { error: "Error al crear precio en Stripe. Verifica la configuración de Stripe o intenta nuevamente." },
                    { status: 500 }
                );
            }
        } else if (!plan.stripe_price_id && !plan.price_monthly && !plan.price_yearly) {
            // Si no hay precios ni stripe_price_id, es un plan gratuito
            console.log(`ℹ️ Plan gratuito sin precios: ${plan.name}`);
        }

        // Si se actualizó el orden, normalizar todos los planes activos
        if ('orden' in planData) {
            const activePlans = await prisma.platform_plans.findMany({
                where: { active: true },
                orderBy: [
                    { orden: 'asc' },
                    { createdAt: 'asc' }
                ]
            });

            // Normalizar el orden
            const normalizePromises = activePlans.map((p, index) =>
                prisma.platform_plans.update({
                    where: { id: p.id },
                    data: { orden: index + 1 }
                })
            );

            await Promise.all(normalizePromises);
        }

        // Convertir Decimal a number para el frontend
        const planFormatted = {
            ...plan,
            price_monthly: plan.price_monthly ? Number(plan.price_monthly) : null,
            price_yearly: plan.price_yearly ? Number(plan.price_yearly) : null
        };

        return NextResponse.json(planFormatted);
    } catch (error) {
        console.error("Error updating plan:", error);

        // Manejo de errores específicos
        if (error instanceof Error) {
            if (error.message.includes('Unique constraint')) {
                if (error.message.includes('stripe_price_id')) {
                    return NextResponse.json(
                        { error: "Ya existe un plan con ese Stripe Price ID" },
                        { status: 409 }
                    );
                } else if (error.message.includes('slug')) {
                    return NextResponse.json(
                        { error: "Ya existe un plan con ese slug" },
                        { status: 409 }
                    );
                } else {
                    return NextResponse.json(
                        { error: "Ya existe un plan con esos datos únicos" },
                        { status: 409 }
                    );
                }
            }
        }

        return NextResponse.json(
            { error: "Error al actualizar el plan" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Verificar que el plan existe
        const existingPlan = await prisma.platform_plans.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        projects: true,
                        subscriptions: true
                    }
                }
            }
        });

        if (!existingPlan) {
            return NextResponse.json(
                { error: "Plan no encontrado" },
                { status: 404 }
            );
        }

        // Verificar si el plan tiene estudios o suscripciones activas
        if (existingPlan._count.projects > 0 || existingPlan._count.subscriptions > 0) {
            return NextResponse.json(
                { error: "No se puede eliminar un plan que tiene estudios o suscripciones activas. Desactívalo en su lugar." },
                { status: 409 }
            );
        }

        await prisma.platform_plans.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting plan:", error);
        return NextResponse.json(
            { error: "Error al eliminar el plan" },
            { status: 500 }
        );
    }
}
