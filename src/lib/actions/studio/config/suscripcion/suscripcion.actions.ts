"use server";

import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { SuscripcionData } from './types';

/**
 * Obtener datos de suscripción del usuario
 */
export async function obtenerDatosSuscripcion(studioSlug: string) { // eslint-disable-line @typescript-eslint/no-unused-vars
    try {
        // Obtener usuario actual
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return {
                success: false,
                error: 'Usuario no autenticado'
            };
        }

        // Buscar el usuario en nuestra tabla usando supabase_id
        const dbUser = await prisma.users.findUnique({
            where: { supabase_id: user.id }
        });

        if (!dbUser) {
            return {
                success: false,
                error: 'Usuario no encontrado en la base de datos'
            };
        }

        // Buscar el studio del usuario
        const userStudioRole = await prisma.user_studio_roles.findFirst({
            where: {
                user_id: dbUser.id,
                role: 'OWNER'
            },
            include: { studio: true }
        });

        if (!userStudioRole) {
            return {
                success: false,
                error: 'Usuario no tiene rol OWNER en ningún studio'
            };
        }

        const studio = userStudioRole.studio;

        // Obtener suscripción actual
        const subscription = await prisma.subscriptions.findFirst({
            where: { studio_id: studio.id },
            include: {
                plans: true,
                items: {
                    where: { deactivated_at: null }, // Solo items activos
                    include: { plan: true }
                }
            }
        });

        if (!subscription) {
            return {
                success: false,
                error: 'No se encontró suscripción para este studio'
            };
        }

        // Obtener límites del plan
        const limits = await prisma.plan_limits.findMany({
            where: { plan_id: subscription.plan_id }
        });

        // Obtener historial de facturación (simulado por ahora)
        const billing_history = [
            {
                id: 'demo_bill_1',
                subscription_id: subscription.id,
                amount: subscription.plans.price_monthly?.toNumber() || 0,
                currency: 'MXN',
                status: 'paid' as const,
                description: `Factura ${subscription.plans.name} - ${new Date().toLocaleDateString('es-ES')}`,
                created_at: new Date()
            }
        ];

        // Mapear datos para que coincidan con los tipos
        const plan = {
            id: subscription.plans.id,
            name: subscription.plans.name,
            slug: subscription.plans.slug,
            description: subscription.plans.description || '',
            price_monthly: subscription.plans.price_monthly?.toNumber() || 0,
            price_yearly: subscription.plans.price_yearly?.toNumber() || 0,
            features: subscription.plans.features as { highlights: string[]; modules: string[] },
            popular: subscription.plans.popular,
            active: subscription.plans.active,
            orden: subscription.plans.orden
        };

        const mappedLimits = limits.map(limit => ({
            id: limit.id,
            plan_id: limit.plan_id,
            limit_type: limit.limit_type,
            limit_value: limit.limit_value,
            unit: limit.unit || ''
        }));

        const mappedItems = subscription.items.map(item => ({
            id: item.id,
            subscription_id: item.subscription_id,
            item_type: item.item_type as 'PLAN' | 'ADDON' | 'OVERAGE' | 'DISCOUNT',
            plan_id: item.plan_id || undefined,
            module_id: item.module_id || undefined,
            overage_type: item.overage_type || undefined,
            overage_quantity: item.overage_quantity || undefined,
            unit_price: item.unit_price.toNumber(),
            quantity: item.quantity,
            subtotal: item.subtotal.toNumber(),
            description: item.description || undefined,
            activated_at: item.activated_at,
            deactivated_at: item.deactivated_at || undefined
        }));

        const mappedBillingHistory = billing_history.map(bill => ({
            id: bill.id,
            subscription_id: bill.subscription_id,
            amount: bill.amount,
            currency: bill.currency,
            status: bill.status as 'paid' | 'pending' | 'failed',
            description: bill.description,
            created_at: bill.created_at
        }));

        const subscriptionData = {
            id: subscription.id,
            studio_id: subscription.studio_id,
            stripe_subscription_id: subscription.stripe_subscription_id,
            stripe_customer_id: subscription.stripe_customer_id,
            plan_id: subscription.plan_id,
            status: subscription.status as 'TRIAL' | 'ACTIVE' | 'CANCELLED' | 'PAUSED' | 'EXPIRED',
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
            billing_cycle_anchor: subscription.billing_cycle_anchor,
            created_at: subscription.created_at,
            updated_at: subscription.updated_at,
            plan: {
                id: plan.id,
                name: plan.name,
                slug: plan.slug,
                description: plan.description,
                price_monthly: plan.price_monthly as number,
                price_yearly: plan.price_yearly as number,
                features: plan.features,
                popular: plan.popular,
                active: plan.active,
                orden: plan.orden
            }
        };

        const data: SuscripcionData = {
            subscription: subscriptionData,
            plan,
            limits: mappedLimits,
            items: mappedItems,
            billing_history: mappedBillingHistory
        };

        return {
            success: true,
            data
        };

    } catch (error) {
        console.error('Error al obtener datos de suscripción:', error);
        return {
            success: false,
            error: 'Error interno del servidor'
        };
    }
}

/**
 * Obtener todos los planes disponibles
 */
export async function obtenerPlanesDisponibles() {
    try {
        const plans = await prisma.platform_plans.findMany({
            where: { active: true },
            orderBy: { orden: 'asc' as const }
        });

        return {
            success: true,
            data: plans
        };

    } catch (error) {
        console.error('Error al obtener planes:', error);
        return {
            success: false,
            error: 'Error interno del servidor'
        };
    }
}

/**
 * Cambiar plan de suscripción (simulado - sin Stripe)
 */
export async function cambiarPlan(
    studioSlug: string,
    planId: string,
    billingCycle: 'monthly' | 'yearly'
) {
    try {
        // Obtener usuario actual
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return {
                success: false,
                error: 'Usuario no autenticado'
            };
        }

        // Buscar el usuario en nuestra tabla usando supabase_id
        const dbUser = await prisma.users.findUnique({
            where: { supabase_id: user.id }
        });

        if (!dbUser) {
            return {
                success: false,
                error: 'Usuario no encontrado en la base de datos'
            };
        }

        // Buscar el studio del usuario
        const userStudioRole = await prisma.user_studio_roles.findFirst({
            where: {
                user_id: dbUser.id,
                role: 'OWNER'
            },
            include: { studio: true }
        });

        if (!userStudioRole) {
            return {
                success: false,
                error: 'Usuario no tiene rol OWNER en ningún studio'
            };
        }

        const studio = userStudioRole.studio;

        // Verificar que el plan existe
        const newPlan = await prisma.platform_plans.findUnique({
            where: { id: planId }
        });

        if (!newPlan) {
            return {
                success: false,
                error: 'Plan no encontrado'
            };
        }

        // Obtener suscripción actual
        const currentSubscription = await prisma.subscriptions.findFirst({
            where: { studio_id: studio.id }
        });

        if (!currentSubscription) {
            return {
                success: false,
                error: 'No se encontró suscripción actual'
            };
        }

        // Actualizar suscripción (simulado - sin Stripe)
        const updatedSubscription = await prisma.subscriptions.update({
            where: { id: currentSubscription.id },
            data: {
                plan_id: planId,
                updated_at: new Date()
            }
        });

        // Desactivar items anteriores
        await prisma.subscription_items.updateMany({
            where: {
                subscription_id: currentSubscription.id,
                deactivated_at: null
            },
            data: { deactivated_at: new Date() }
        });

        // Crear nuevo item para el plan
        const price = billingCycle === 'yearly' ? (newPlan.price_yearly || 0) : (newPlan.price_monthly || 0);

        await prisma.subscription_items.create({
            data: {
                subscription_id: currentSubscription.id,
                item_type: 'PLAN',
                plan_id: planId,
                unit_price: price,
                quantity: 1,
                subtotal: price,
                activated_at: new Date()
            }
        });

        // Log del cambio de plan
        await prisma.user_access_logs.create({
            data: {
                user_id: dbUser.id,
                action: 'plan_changed',
                ip_address: 'N/A',
                user_agent: 'N/A',
                success: true,
                details: {
                    old_plan: currentSubscription.plan_id,
                    new_plan: planId,
                    billing_cycle: billingCycle
                }
            }
        });

        revalidatePath(`/studio/${studioSlug}/configuracion/cuenta/suscripcion`);

        return {
            success: true,
            message: `Plan cambiado a ${newPlan.name} exitosamente`,
            data: updatedSubscription
        };

    } catch (error) {
        console.error('Error al cambiar plan:', error);
        return {
            success: false,
            error: 'Error interno del servidor'
        };
    }
}

/**
 * Cancelar suscripción (simulado - sin Stripe)
 */
export async function cancelarSuscripcion(studioSlug: string) {
    try {
        // Obtener usuario actual
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return {
                success: false,
                error: 'Usuario no autenticado'
            };
        }

        // Buscar el usuario en nuestra tabla usando supabase_id
        const dbUser = await prisma.users.findUnique({
            where: { supabase_id: user.id }
        });

        if (!dbUser) {
            return {
                success: false,
                error: 'Usuario no encontrado en la base de datos'
            };
        }

        // Buscar el studio del usuario
        const userStudioRole = await prisma.user_studio_roles.findFirst({
            where: {
                user_id: dbUser.id,
                role: 'OWNER'
            },
            include: { studio: true }
        });

        if (!userStudioRole) {
            return {
                success: false,
                error: 'Usuario no tiene rol OWNER en ningún studio'
            };
        }

        const studio = userStudioRole.studio;

        // Obtener suscripción actual
        const subscription = await prisma.subscriptions.findFirst({
            where: { studio_id: studio.id }
        });

        if (!subscription) {
            return {
                success: false,
                error: 'No se encontró suscripción actual'
            };
        }

        // Actualizar suscripción a CANCELLED
        await prisma.subscriptions.update({
            where: { id: subscription.id },
            data: {
                status: 'CANCELLED',
                updated_at: new Date()
            }
        });

        // Log de la cancelación
        await prisma.user_access_logs.create({
            data: {
                user_id: dbUser.id,
                action: 'subscription_cancelled',
                ip_address: 'N/A',
                user_agent: 'N/A',
                success: true,
                details: {
                    plan_id: subscription.plan_id,
                    cancelled_at: new Date()
                }
            }
        });

        revalidatePath(`/studio/${studioSlug}/configuracion/cuenta/suscripcion`);

        return {
            success: true,
            message: 'Suscripción cancelada exitosamente'
        };

    } catch (error) {
        console.error('Error al cancelar suscripción:', error);
        return {
            success: false,
            error: 'Error interno del servidor'
        };
    }
}
