import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-02-24.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const signature = request.headers.get("stripe-signature");

        if (!signature) {
            console.error("No Stripe signature found");
            return NextResponse.json(
                { error: "No signature found" },
                { status: 400 }
            );
        }

        let event: Stripe.Event;

        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } catch (err) {
            console.error("Webhook signature verification failed:", err);
            return NextResponse.json(
                { error: "Invalid signature" },
                { status: 400 }
            );
        }

        console.log("Received Stripe webhook:", event.type);

        // Manejar diferentes tipos de eventos
        switch (event.type) {
            case "coupon.created":
                await handleCouponCreated(event.data.object as Stripe.Coupon);
                break;

            case "coupon.updated":
                await handleCouponUpdated(event.data.object as Stripe.Coupon);
                break;

            case "coupon.deleted":
                await handleCouponDeleted(event.data.object as Stripe.Coupon);
                break;

            case "invoice.payment_succeeded":
                await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
                break;

            case "customer.subscription.updated":
                await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });

    } catch (error) {
        console.error("Webhook error:", error);
        return NextResponse.json(
            { error: "Webhook handler failed" },
            { status: 500 }
        );
    }
}

/**
 * Manejar creación de cupón
 */
async function handleCouponCreated(coupon: Stripe.Coupon) {
    try {
        console.log("Coupon created:", coupon.id);

        // Buscar si existe en nuestra base de datos
        const existingCode = await prisma.platform_discount_codes.findFirst({
            where: {
                OR: [
                    { codigo: coupon.id },
                    { stripe_coupon_id: coupon.id },
                ],
            },
        });

        if (existingCode) {
            // Actualizar el registro existente
            await prisma.platform_discount_codes.update({
                where: { id: existingCode.id },
                data: {
                    stripe_coupon_id: coupon.id,
                    activo: coupon.valid,
                },
            });
            console.log("Updated existing discount code with Stripe coupon ID");
        } else {
            // Crear nuevo registro si no existe
            const newCode = await prisma.platform_discount_codes.create({
                data: {
                    codigo: coupon.id,
                    nombre: coupon.name || `Cupón ${coupon.id}`,
                    descripcion: coupon.metadata?.descripcion || "",
                    tipo_descuento: coupon.percent_off ? "porcentaje" : "monto_fijo",
                    valor_descuento: coupon.percent_off || (coupon.amount_off ? coupon.amount_off / 100 : 0),
                    tipo_aplicacion: (coupon.metadata?.tipo_aplicacion as string) || "ambos",
                    fecha_inicio: new Date(coupon.created * 1000),
                    fecha_fin: coupon.redeem_by ? new Date(coupon.redeem_by * 1000) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                    uso_maximo: coupon.max_redemptions || null,
                    uso_actual: coupon.times_redeemed,
                    activo: coupon.valid,
                    stripe_coupon_id: coupon.id,
                },
            });
            console.log("Created new discount code from Stripe coupon");
        }

    } catch (error) {
        console.error("Error handling coupon created:", error);
    }
}

/**
 * Manejar actualización de cupón
 */
async function handleCouponUpdated(coupon: Stripe.Coupon) {
    try {
        console.log("Coupon updated:", coupon.id);

        // Buscar el código en nuestra base de datos
        const existingCode = await prisma.platform_discount_codes.findFirst({
            where: {
                OR: [
                    { codigo: coupon.id },
                    { stripe_coupon_id: coupon.id },
                ],
            },
        });

        if (existingCode) {
            // Actualizar el registro
            await prisma.platform_discount_codes.update({
                where: { id: existingCode.id },
                data: {
                    nombre: coupon.name || existingCode.nombre,
                    descripcion: coupon.metadata?.descripcion || existingCode.descripcion,
                    uso_actual: coupon.times_redeemed,
                    activo: coupon.valid,
                    updated_at: new Date(),
                },
            });
            console.log("Updated discount code from Stripe coupon update");
        }

    } catch (error) {
        console.error("Error handling coupon updated:", error);
    }
}

/**
 * Manejar eliminación de cupón
 */
async function handleCouponDeleted(coupon: Stripe.Coupon) {
    try {
        console.log("Coupon deleted:", coupon.id);

        // Buscar el código en nuestra base de datos
        const existingCode = await prisma.platform_discount_codes.findFirst({
            where: {
                OR: [
                    { codigo: coupon.id },
                    { stripe_coupon_id: coupon.id },
                ],
            },
        });

        if (existingCode) {
            // Marcar como inactivo en lugar de eliminar
            await prisma.platform_discount_codes.update({
                where: { id: existingCode.id },
                data: {
                    activo: false,
                    updated_at: new Date(),
                },
            });
            console.log("Deactivated discount code from Stripe coupon deletion");
        }

    } catch (error) {
        console.error("Error handling coupon deleted:", error);
    }
}

/**
 * Manejar pago exitoso (para trackear uso de cupones)
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
    try {
        console.log("Payment succeeded for invoice:", invoice.id);

        if (invoice.discount?.coupon) {
            const couponId = invoice.discount.coupon.id;

            // Buscar el código de descuento
            const discountCode = await prisma.platform_discount_codes.findFirst({
                where: {
                    OR: [
                        { codigo: couponId },
                        { stripe_coupon_id: couponId },
                    ],
                },
            });

            if (discountCode) {
                // Crear registro de uso
                await prisma.platform_discount_usage.create({
                    data: {
                        discount_code_id: discountCode.id,
                        subscription_id: invoice.subscription as string,
                        monto_descuento: (invoice.discount as { amount_off?: number }).amount_off || 0,
                        fecha_uso: new Date(),
                    },
                });

                // Actualizar contador de uso
                await prisma.platform_discount_codes.update({
                    where: { id: discountCode.id },
                    data: {
                        uso_actual: {
                            increment: 1,
                        },
                    },
                });

                console.log("Recorded discount usage for payment");
            }
        }

    } catch (error) {
        console.error("Error handling payment succeeded:", error);
    }
}

/**
 * Manejar actualización de suscripción (para trackear cambios de cupones)
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    try {
        console.log("Subscription updated:", subscription.id);

        // Si la suscripción tiene un cupón aplicado
        if (subscription.discount?.coupon) {
            const couponId = subscription.discount.coupon.id;

            // Buscar si ya existe un registro de uso para esta suscripción
            const existingUsage = await prisma.platform_discount_usage.findFirst({
                where: {
                    subscription_id: subscription.id,
                },
            });

            if (!existingUsage) {
                // Buscar el código de descuento
                const discountCode = await prisma.platform_discount_codes.findFirst({
                    where: {
                        OR: [
                            { codigo: couponId },
                            { stripe_coupon_id: couponId },
                        ],
                    },
                });

                if (discountCode) {
                    // Crear registro de uso
                    await prisma.platform_discount_usage.create({
                        data: {
                            discount_code_id: discountCode.id,
                            subscription_id: subscription.id,
                            monto_descuento: (subscription.discount as { amount_off?: number }).amount_off || 0,
                            fecha_uso: new Date(),
                        },
                    });

                    // Actualizar contador de uso
                    await prisma.platform_discount_codes.update({
                        where: { id: discountCode.id },
                        data: {
                            uso_actual: {
                                increment: 1,
                            },
                        },
                    });

                    console.log("Recorded discount usage for subscription update");
                }
            }
        }

    } catch (error) {
        console.error("Error handling subscription updated:", error);
    }
}
