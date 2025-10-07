import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

// GET /api/admin/descuentos - Obtener todos los códigos de descuento
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const search = searchParams.get("search");

        const whereClause: Record<string, unknown> = {};

        // Filtrar por estado
        if (status && status !== "todos") {
            whereClause.activo = status === "activos";
        }

        // Filtrar por búsqueda
        if (search) {
            whereClause.OR = [
                { codigo: { contains: search, mode: "insensitive" } },
                { nombre: { contains: search, mode: "insensitive" } },
                { descripcion: { contains: search, mode: "insensitive" } },
            ];
        }

        const discountCodes = await prisma.platform_discount_codes.findMany({
            where: whereClause,
            orderBy: { created_at: "desc" },
            include: {
                discount_usage: {
                    select: {
                        id: true,
                        fecha_uso: true,
                        monto_descuento: true,
                        lead: {
                            select: {
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        // Calcular métricas adicionales
        const codesWithMetrics = discountCodes.map(code => ({
            ...code,
            conversiones: code.discount_usage?.length || 0,
            ingresos: code.discount_usage?.reduce((sum: number, usage) => sum + Number(usage.monto_descuento), 0) || 0,
            tasa_conversion: code.uso_maximo ?
                ((code.discount_usage?.length || 0) / code.uso_maximo) * 100 :
                null,
        }));

        return NextResponse.json({
            success: true,
            data: codesWithMetrics,
            total: codesWithMetrics.length,
        });

    } catch (error) {
        console.error("Error fetching discount codes:", error);
        return NextResponse.json(
            { success: false, error: "Error al obtener códigos de descuento" },
            { status: 500 }
        );
    }
}

// POST /api/admin/descuentos - Crear nuevo código de descuento
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
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
            crear_en_stripe = true,
        } = body;

        // Validaciones
        if (!codigo || !nombre || !tipo_descuento || !valor_descuento || !fecha_inicio || !fecha_fin) {
            return NextResponse.json(
                { success: false, error: "Faltan campos requeridos" },
                { status: 400 }
            );
        }

        // Verificar que el código no exista
        const existingCode = await prisma.platform_discount_codes.findUnique({
            where: { codigo },
        });

        if (existingCode) {
            return NextResponse.json(
                { success: false, error: "El código ya existe" },
                { status: 400 }
            );
        }

        // Validar fechas
        const fechaInicio = new Date(fecha_inicio);
        const fechaFin = new Date(fecha_fin);

        if (fechaInicio >= fechaFin) {
            return NextResponse.json(
                { success: false, error: "La fecha de fin debe ser posterior a la fecha de inicio" },
                { status: 400 }
            );
        }

        // Validar valor del descuento
        if (tipo_descuento === "porcentaje" && valor_descuento > 100) {
            return NextResponse.json(
                { success: false, error: "El porcentaje no puede ser mayor a 100%" },
                { status: 400 }
            );
        }

        let stripe_coupon_id = null;

        // Crear cupón en Stripe si está habilitado
        if (crear_en_stripe) {
            try {
                const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

                const couponData: Stripe.CouponCreateParams = {
                    id: codigo,
                    duration: "forever", // Por defecto permanente
                };

                if (tipo_descuento === "porcentaje") {
                    couponData.percent_off = valor_descuento;
                } else {
                    couponData.amount_off = valor_descuento * 100; // Stripe usa centavos
                    couponData.currency = "mxn";
                }

                if (uso_maximo) {
                    couponData.max_redemptions = uso_maximo;
                }

                const coupon = await stripe.coupons.create(couponData);
                stripe_coupon_id = coupon.id;
            } catch (stripeError) {
                console.error("Error creating Stripe coupon:", stripeError);
                // Continuar sin Stripe si hay error
            }
        }

        // Crear el código de descuento en la base de datos
        const newDiscountCode = await prisma.platform_discount_codes.create({
            data: {
                codigo,
                nombre,
                descripcion,
                tipo_descuento,
                valor_descuento,
                tipo_aplicacion,
                fecha_inicio: fechaInicio,
                fecha_fin: fechaFin,
                uso_maximo,
                activo,
                stripe_coupon_id,
            },
        });

        return NextResponse.json({
            success: true,
            data: newDiscountCode,
            message: "Código de descuento creado exitosamente",
        });

    } catch (error) {
        console.error("Error creating discount code:", error);
        return NextResponse.json(
            { success: false, error: "Error al crear código de descuento" },
            { status: 500 }
        );
    }
}
