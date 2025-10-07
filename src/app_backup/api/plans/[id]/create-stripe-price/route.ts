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

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Obtener el plan
        const plan = await prisma.platform_plans.findUnique({
            where: { id }
        });

        if (!plan) {
            return NextResponse.json(
                { error: "Plan no encontrado" },
                { status: 404 }
            );
        }

        // Verificar que tenga precios para crear
        if (!plan.price_monthly && !plan.price_yearly) {
            return NextResponse.json(
                { error: "El plan debe tener al menos un precio (mensual o anual) para crear en Stripe" },
                { status: 400 }
            );
        }

        // Crear precio en Stripe
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
        const updatedPlan = await prisma.platform_plans.update({
            where: { id },
            data: {
                stripe_product_id: stripeData.productId,
                stripe_price_id: stripeData.monthlyPriceId || stripeData.yearlyPriceId,
            }
        });

        return NextResponse.json({
            success: true,
            stripe_product_id: stripeData.productId,
            stripe_price_id: stripeData.monthlyPriceId || stripeData.yearlyPriceId,
            monthly_price_id: stripeData.monthlyPriceId,
            yearly_price_id: stripeData.yearlyPriceId,
        });

    } catch (error) {
        console.error("Error creating Stripe price:", error);

        if (error instanceof Error) {
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { error: "Error al crear precio en Stripe" },
            { status: 500 }
        );
    }
}
