import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

// GET /api/admin/descuentos/[id] - Obtener código de descuento específico
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const discountCode = await prisma.platform_discount_codes.findUnique({
            where: { id },
            include: {
                discount_usage: {
                    include: {
                        lead: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                phone: true,
                            },
                        },
                        subscription: {
                            select: {
                                id: true,
                                status: true,
                                current_period_start: true,
                                current_period_end: true,
                            },
                        },
                    },
                },
            },
        });

        if (!discountCode) {
            return NextResponse.json(
                { success: false, error: "Código de descuento no encontrado" },
                { status: 404 }
            );
        }

        // Calcular métricas
        const conversiones = discountCode.discount_usage?.length || 0;
        const ingresos = discountCode.discount_usage?.reduce(
            (sum, usage) => sum + Number(usage.monto_descuento),
            0
        ) || 0;
        const tasa_conversion = discountCode.uso_maximo ?
            (conversiones / discountCode.uso_maximo) * 100 :
            null;

        return NextResponse.json({
            success: true,
            data: {
                ...discountCode,
                conversiones,
                ingresos,
                tasa_conversion,
            },
        });

    } catch (error) {
        console.error("Error fetching discount code:", error);
        return NextResponse.json(
            { success: false, error: "Error al obtener código de descuento" },
            { status: 500 }
        );
    }
}

// PUT /api/admin/descuentos/[id] - Actualizar código de descuento
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const body = await request.json();
        const { id } = await params;
        const {
            codigo,
            nombre,
            descripcion,
            tipo_descuento,
            valor_descuento,
            tipo_aplicacion,
            fecha_inicio,
            fecha_fin,
            uso_maximo,
            activo,
        } = body;

        // Verificar que el código existe
        const existingCode = await prisma.platform_discount_codes.findUnique({
            where: { id },
        });

        if (!existingCode) {
            return NextResponse.json(
                { success: false, error: "Código de descuento no encontrado" },
                { status: 404 }
            );
        }

        // Verificar que el nuevo código no exista (si se cambió)
        if (codigo && codigo !== existingCode.codigo) {
            const codeExists = await prisma.platform_discount_codes.findUnique({
                where: { codigo },
            });

            if (codeExists) {
                return NextResponse.json(
                    { success: false, error: "El código ya existe" },
                    { status: 400 }
                );
            }
        }

        // Validar fechas
        if (fecha_inicio && fecha_fin) {
            const fechaInicio = new Date(fecha_inicio);
            const fechaFin = new Date(fecha_fin);

            if (fechaInicio >= fechaFin) {
                return NextResponse.json(
                    { success: false, error: "La fecha de fin debe ser posterior a la fecha de inicio" },
                    { status: 400 }
                );
            }
        }

        // Validar valor del descuento
        if (tipo_descuento === "porcentaje" && valor_descuento > 100) {
            return NextResponse.json(
                { success: false, error: "El porcentaje no puede ser mayor a 100%" },
                { status: 400 }
            );
        }

        // Actualizar en Stripe si existe
        if (existingCode.stripe_coupon_id) {
            try {
                const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

                // Actualizar cupón en Stripe
                await stripe.coupons.update(existingCode.stripe_coupon_id, {
                    metadata: {
                        nombre: nombre || existingCode.nombre,
                        descripcion: descripcion || existingCode.descripcion,
                        activo: activo !== undefined ? activo : existingCode.activo,
                    },
                });
            } catch (stripeError) {
                console.error("Error updating Stripe coupon:", stripeError);
                // Continuar sin Stripe si hay error
            }
        }

        // Actualizar en la base de datos
        const updatedCode = await prisma.platform_discount_codes.update({
            where: { id },
            data: {
                ...(codigo && { codigo }),
                ...(nombre && { nombre }),
                ...(descripcion !== undefined && { descripcion }),
                ...(tipo_descuento && { tipo_descuento }),
                ...(valor_descuento !== undefined && { valor_descuento }),
                ...(tipo_aplicacion && { tipo_aplicacion }),
                ...(fecha_inicio && { fecha_inicio: new Date(fecha_inicio) }),
                ...(fecha_fin && { fecha_fin: new Date(fecha_fin) }),
                ...(uso_maximo !== undefined && { uso_maximo }),
                ...(activo !== undefined && { activo }),
                updatedAt: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            data: updatedCode,
            message: "Código de descuento actualizado exitosamente",
        });

    } catch (error) {
        console.error("Error updating discount code:", error);
        return NextResponse.json(
            { success: false, error: "Error al actualizar código de descuento" },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/descuentos/[id] - Eliminar código de descuento
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        // Verificar que el código existe
        const existingCode = await prisma.platform_discount_codes.findUnique({
            where: { id },
            include: {
                discount_usage: true,
            },
        });

        if (!existingCode) {
            return NextResponse.json(
                { success: false, error: "Código de descuento no encontrado" },
                { status: 404 }
            );
        }

        // Verificar si tiene uso
        if (existingCode.discount_usage.length > 0) {
            return NextResponse.json(
                { success: false, error: "No se puede eliminar un código que ya ha sido usado" },
                { status: 400 }
            );
        }

        // Eliminar cupón de Stripe si existe
        if (existingCode.stripe_coupon_id) {
            try {
                const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
                await stripe.coupons.del(existingCode.stripe_coupon_id);
            } catch (stripeError) {
                console.error("Error deleting Stripe coupon:", stripeError);
                // Continuar sin Stripe si hay error
            }
        }

        // Eliminar de la base de datos
        await prisma.platform_discount_codes.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            message: "Código de descuento eliminado exitosamente",
        });

    } catch (error) {
        console.error("Error deleting discount code:", error);
        return NextResponse.json(
            { success: false, error: "Error al eliminar código de descuento" },
            { status: 500 }
        );
    }
}
