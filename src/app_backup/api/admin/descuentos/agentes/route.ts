import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

// GET /api/admin/descuentos/agentes - Obtener códigos generados por agentes
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const search = searchParams.get("search");
        const agenteId = searchParams.get("agente_id");

        const whereClause: Record<string, unknown> = {};

        // Filtrar por estado
        if (status && status !== "todos") {
            switch (status) {
                case "usados":
                    whereClause.usado = true;
                    break;
                case "no_usados":
                    whereClause.usado = false;
                    break;
                case "expirados":
                    whereClause.fecha_expiracion = {
                        lt: new Date(),
                    };
                    break;
            }
        }

        // Filtrar por agente
        if (agenteId && agenteId !== "todos") {
            whereClause.agente_id = agenteId;
        }

        // Filtrar por búsqueda
        if (search) {
            whereClause.OR = [
                { codigo_completo: { contains: search, mode: "insensitive" } },
                { lead: { name: { contains: search, mode: "insensitive" } } },
                { lead: { email: { contains: search, mode: "insensitive" } } },
                { agente: { nombre: { contains: search, mode: "insensitive" } } },
            ];
        }

        const agentCodes = await prisma.platform_agent_discount_codes.findMany({
            where: whereClause,
            include: {
                lead: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                agente: {
                    select: {
                        id: true,
                        nombre: true,
                        email: true,
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
            orderBy: { fecha_creacion: "desc" },
        });

        // Calcular métricas por agente
        const agentStats = await prisma.platform_agent_discount_codes.groupBy({
            by: ["agente_id"],
            _count: {
                id: true,
            },
            _sum: {
                valor_descuento: true,
            },
            where: {
                usado: true,
            },
        });

        // Obtener información de agentes
        const agentes = await prisma.platform_agents.findMany({
            select: {
                id: true,
                nombre: true,
                email: true,
            },
        });

        const agentesConStats = agentes.map(agente => {
            const stats = agentStats.find(stat => stat.agente_id === agente.id);
            const totalCodes = agentCodes.filter(code => code.agente_id === agente.id).length;
            const usedCodes = agentCodes.filter(code => code.agente_id === agente.id && code.usado).length;

            return {
                ...agente,
                codigosGenerados: totalCodes,
                codigosUsados: usedCodes,
                tasaConversion: totalCodes > 0 ? (usedCodes / totalCodes) * 100 : 0,
                ingresos: stats?._sum.valor_descuento || 0,
            };
        });

        return NextResponse.json({
            success: true,
            data: {
                codes: agentCodes,
                agentes: agentesConStats,
                total: agentCodes.length,
                stats: {
                    total: agentCodes.length,
                    usados: agentCodes.filter(c => c.usado).length,
                    noUsados: agentCodes.filter(c => !c.usado).length,
                    expirados: agentCodes.filter(c => new Date(c.fecha_expiracion) < new Date()).length,
                    tasaConversion: agentCodes.length > 0 ?
                        (agentCodes.filter(c => c.usado).length / agentCodes.length) * 100 : 0,
                },
            },
        });

    } catch (error) {
        console.error("Error fetching agent discount codes:", error);
        return NextResponse.json(
            { success: false, error: "Error al obtener códigos de agentes" },
            { status: 500 }
        );
    }
}

// POST /api/admin/descuentos/agentes - Generar código para agente
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            lead_id,
            agente_id,
            codigo_base,
            tipo_descuento,
            valor_descuento,
            duracion_descuento,
        } = body;

        // Validaciones
        if (!lead_id || !agente_id || !codigo_base || !tipo_descuento || !valor_descuento) {
            return NextResponse.json(
                { success: false, error: "Faltan campos requeridos" },
                { status: 400 }
            );
        }

        // Verificar que el lead existe
        const lead = await prisma.platform_leads.findUnique({
            where: { id: lead_id },
        });

        if (!lead) {
            return NextResponse.json(
                { success: false, error: "Lead no encontrado" },
                { status: 404 }
            );
        }

        // Verificar que el agente existe
        const agente = await prisma.platform_agents.findUnique({
            where: { id: agente_id },
        });

        if (!agente) {
            return NextResponse.json(
                { success: false, error: "Agente no encontrado" },
                { status: 404 }
            );
        }

        // Generar código único
        const codigoCompleto = `${codigo_base}_${lead_id}`;

        // Verificar que el código no exista
        const existingCode = await prisma.platform_agent_discount_codes.findUnique({
            where: { codigo_completo: codigoCompleto },
        });

        if (existingCode) {
            return NextResponse.json(
                { success: false, error: "Ya existe un código para este lead" },
                { status: 400 }
            );
        }

        // Calcular fecha de expiración
        const fechaCreacion = new Date();
        const fechaExpiracion = new Date();

        switch (duracion_descuento) {
            case "1_mes":
                fechaExpiracion.setMonth(fechaExpiracion.getMonth() + 1);
                break;
            case "3_meses":
                fechaExpiracion.setMonth(fechaExpiracion.getMonth() + 3);
                break;
            case "permanente":
                fechaExpiracion.setFullYear(fechaExpiracion.getFullYear() + 10); // 10 años
                break;
        }

        let stripe_coupon_id = null;

        // Crear cupón en Stripe
        try {
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

            const couponData: Stripe.CouponCreateParams = {
                id: codigoCompleto,
                duration: "forever",
                max_redemptions: 1,
            };

            if (tipo_descuento === "porcentaje") {
                couponData.percent_off = valor_descuento;
            } else {
                couponData.amount_off = valor_descuento * 100;
                couponData.currency = "mxn";
            }

            const coupon = await stripe.coupons.create(couponData);
            stripe_coupon_id = coupon.id;
        } catch (stripeError) {
            console.error("Error creating Stripe coupon:", stripeError);
            // Continuar sin Stripe si hay error
        }

        // Crear el código de agente
        const newAgentCode = await prisma.platform_agent_discount_codes.create({
            data: {
                codigo_base: codigo_base,
                lead_id: lead_id,
                agente_id: agente_id,
                codigo_completo: codigoCompleto,
                tipo_descuento,
                valor_descuento,
                duracion_descuento,
                fecha_creacion: fechaCreacion,
                fecha_expiracion: fechaExpiracion,
                stripe_coupon_id,
                activo: true,
            },
            include: {
                lead: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                agente: {
                    select: {
                        id: true,
                        nombre: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            data: newAgentCode,
            message: "Código de agente generado exitosamente",
        });

    } catch (error) {
        console.error("Error creating agent discount code:", error);
        return NextResponse.json(
            { success: false, error: "Error al generar código de agente" },
            { status: 500 }
        );
    }
}
