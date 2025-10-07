import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-02-24.acacia",
});

export interface DiscountCodeData {
    codigo: string;
    nombre: string;
    descripcion?: string;
    tipo_descuento: "porcentaje" | "monto_fijo";
    valor_descuento: number;
    tipo_aplicacion: "plan_mensual" | "plan_anual" | "ambos";
    fecha_inicio: Date;
    fecha_fin: Date;
    uso_maximo?: number;
    activo: boolean;
}

export interface AgentDiscountCodeData {
    codigo_completo: string;
    tipo_descuento: "porcentaje" | "monto_fijo";
    valor_descuento: number;
    duracion_descuento: "1_mes" | "3_meses" | "permanente";
    fecha_expiracion: Date;
}

/**
 * Crear cupón en Stripe para código general
 */
export async function createStripeCoupon(data: DiscountCodeData): Promise<string> {
    try {
        const couponData: Stripe.CouponCreateParams = {
            id: data.codigo,
            name: data.nombre,
            metadata: {
                descripcion: data.descripcion || "",
                tipo_aplicacion: data.tipo_aplicacion,
                fecha_inicio: data.fecha_inicio.toISOString(),
                fecha_fin: data.fecha_fin.toISOString(),
                activo: data.activo.toString(),
            },
        };

        // Configurar tipo de descuento
        if (data.tipo_descuento === "porcentaje") {
            couponData.percent_off = data.valor_descuento;
        } else {
            couponData.amount_off = data.valor_descuento * 100; // Stripe usa centavos
            couponData.currency = "mxn";
        }

        // Configurar duración
        if (data.fecha_inicio && data.fecha_fin) {
            const now = new Date();
            if (data.fecha_inicio > now) {
                // El cupón se activará en el futuro
                couponData.redeem_by = Math.floor(data.fecha_fin.getTime() / 1000);
            } else {
                // El cupón está activo ahora
                couponData.duration = "forever";
                if (data.fecha_fin < new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)) {
                    // Si expira en menos de un año, usar duration "once"
                    couponData.duration = "once";
                }
            }
        } else {
            couponData.duration = "forever";
        }

        // Configurar límite de uso
        if (data.uso_maximo) {
            couponData.max_redemptions = data.uso_maximo;
        }

        const coupon = await stripe.coupons.create(couponData);
        return coupon.id;

    } catch (error) {
        console.error("Error creating Stripe coupon:", error);
        throw new Error(`Error al crear cupón en Stripe: ${error}`);
    }
}

/**
 * Crear cupón en Stripe para código de agente
 */
export async function createStripeAgentCoupon(data: AgentDiscountCodeData): Promise<string> {
    try {
        const couponData: Stripe.CouponCreateParams = {
            id: data.codigo_completo,
            name: `Código de Agente - ${data.codigo_completo}`,
            max_redemptions: 1, // Solo puede usarse una vez
            metadata: {
                tipo: "agente",
                duracion_descuento: data.duracion_descuento,
                fecha_expiracion: data.fecha_expiracion.toISOString(),
            },
        };

        // Configurar tipo de descuento
        if (data.tipo_descuento === "porcentaje") {
            couponData.percent_off = data.valor_descuento;
        } else {
            couponData.amount_off = data.valor_descuento * 100;
            couponData.currency = "mxn";
        }

        // Configurar duración según el tipo
        switch (data.duracion_descuento) {
            case "1_mes":
                couponData.duration = "repeating";
                couponData.duration_in_months = 1;
                break;
            case "3_meses":
                couponData.duration = "repeating";
                couponData.duration_in_months = 3;
                break;
            case "permanente":
                couponData.duration = "forever";
                break;
        }

        // Configurar fecha de expiración
        if (data.fecha_expiracion) {
            couponData.redeem_by = Math.floor(data.fecha_expiracion.getTime() / 1000);
        }

        const coupon = await stripe.coupons.create(couponData);
        return coupon.id;

    } catch (error) {
        console.error("Error creating Stripe agent coupon:", error);
        throw new Error(`Error al crear cupón de agente en Stripe: ${error}`);
    }
}

/**
 * Actualizar cupón en Stripe
 */
export async function updateStripeCoupon(
    couponId: string,
    updates: Partial<DiscountCodeData>
): Promise<void> {
    try {
        const updateData: Stripe.CouponUpdateParams = {};

        if (updates.nombre) {
            updateData.name = updates.nombre;
        }

        if (updates.descripcion !== undefined) {
            updateData.metadata = {
                descripcion: updates.descripcion,
                tipo_aplicacion: updates.tipo_aplicacion || "",
                fecha_inicio: updates.fecha_inicio?.toISOString() || "",
                fecha_fin: updates.fecha_fin?.toISOString() || "",
                activo: updates.activo?.toString() || "true",
            };
        }

        await stripe.coupons.update(couponId, updateData);

    } catch (error) {
        console.error("Error updating Stripe coupon:", error);
        throw new Error(`Error al actualizar cupón en Stripe: ${error}`);
    }
}

/**
 * Eliminar cupón de Stripe
 */
export async function deleteStripeCoupon(couponId: string): Promise<void> {
    try {
        await stripe.coupons.del(couponId);
    } catch (error) {
        console.error("Error deleting Stripe coupon:", error);
        throw new Error(`Error al eliminar cupón de Stripe: ${error}`);
    }
}

/**
 * Obtener información de cupón de Stripe
 */
export async function getStripeCoupon(couponId: string): Promise<Stripe.Coupon | null> {
    try {
        const coupon = await stripe.coupons.retrieve(couponId);
        return coupon;
    } catch (error) {
        console.error("Error retrieving Stripe coupon:", error);
        return null;
    }
}

/**
 * Aplicar cupón a una suscripción
 */
export async function applyCouponToSubscription(
    subscriptionId: string,
    couponId: string
): Promise<Stripe.Subscription> {
    try {
        const subscription = await stripe.subscriptions.update(subscriptionId, {
            coupon: couponId,
        });
        return subscription;
    } catch (error) {
        console.error("Error applying coupon to subscription:", error);
        throw new Error(`Error al aplicar cupón a la suscripción: ${error}`);
    }
}

/**
 * Remover cupón de una suscripción
 */
export async function removeCouponFromSubscription(
    subscriptionId: string
): Promise<Stripe.Subscription> {
    try {
        const subscription = await stripe.subscriptions.update(subscriptionId, {
            coupon: undefined,
        });
        return subscription;
    } catch (error) {
        console.error("Error removing coupon from subscription:", error);
        throw new Error(`Error al remover cupón de la suscripción: ${error}`);
    }
}

/**
 * Validar si un cupón es válido
 */
export async function validateCoupon(couponId: string): Promise<{
    valid: boolean;
    reason?: string;
    coupon?: Stripe.Coupon;
}> {
    try {
        const coupon = await stripe.coupons.retrieve(couponId);

        // Verificar si el cupón existe
        if (!coupon) {
            return { valid: false, reason: "Cupón no encontrado" };
        }

        // Verificar si está activo
        if (coupon.valid === false) {
            return { valid: false, reason: "Cupón no válido", coupon };
        }

        // Verificar límite de uso
        if (coupon.max_redemptions && coupon.times_redeemed >= coupon.max_redemptions) {
            return { valid: false, reason: "Cupón agotado", coupon };
        }

        // Verificar fecha de expiración
        if (coupon.redeem_by && coupon.redeem_by < Math.floor(Date.now() / 1000)) {
            return { valid: false, reason: "Cupón expirado", coupon };
        }

        return { valid: true, coupon };

    } catch (error) {
        console.error("Error validating coupon:", error);
        return { valid: false, reason: "Error al validar cupón" };
    }
}

/**
 * Obtener estadísticas de uso de cupón
 */
export async function getCouponStats(couponId: string): Promise<{
    times_redeemed: number;
    max_redemptions?: number;
    valid: boolean;
    created: number;
    redeem_by?: number;
}> {
    try {
        const coupon = await stripe.coupons.retrieve(couponId);

        return {
            times_redeemed: coupon.times_redeemed,
            max_redemptions: coupon.max_redemptions || undefined,
            valid: coupon.valid,
            created: coupon.created,
            redeem_by: coupon.redeem_by || undefined,
        };

    } catch (error) {
        console.error("Error getting coupon stats:", error);
        throw new Error(`Error al obtener estadísticas del cupón: ${error}`);
    }
}

/**
 * Listar todos los cupones
 */
export async function listStripeCoupons(limit: number = 100): Promise<Stripe.Coupon[]> {
    try {
        const coupons = await stripe.coupons.list({ limit });
        return coupons.data;
    } catch (error) {
        console.error("Error listing Stripe coupons:", error);
        throw new Error(`Error al listar cupones de Stripe: ${error}`);
    }
}

/**
 * Sincronizar cupones con la base de datos
 */
export async function syncCouponsWithDatabase(): Promise<{
    synced: number;
    errors: string[];
}> {
    try {
        const coupons = await listStripeCoupons(1000);
        const errors: string[] = [];
        let synced = 0;

        // Aquí implementarías la lógica para sincronizar con tu base de datos
        // Por ejemplo, actualizar el campo stripe_coupon_id en platform_discount_codes

        for (const coupon of coupons) {
            try {
                // Buscar en la base de datos y actualizar
                // await prisma.platform_discount_codes.updateMany({
                //   where: { codigo: coupon.id },
                //   data: { stripe_coupon_id: coupon.id }
                // });
                synced++;
            } catch (error) {
                errors.push(`Error syncing coupon ${coupon.id}: ${error}`);
            }
        }

        return { synced, errors };

    } catch (error) {
        console.error("Error syncing coupons:", error);
        throw new Error(`Error al sincronizar cupones: ${error}`);
    }
}
