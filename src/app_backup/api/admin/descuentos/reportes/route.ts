import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/descuentos/reportes - Obtener datos para reportes
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const periodo = searchParams.get("periodo") || "30_dias";
        const tipoReporte = searchParams.get("tipo") || "general";

        // Calcular fechas según el período
        const now = new Date();
        const fechaInicio = new Date();

        switch (periodo) {
            case "7_dias":
                fechaInicio.setDate(now.getDate() - 7);
                break;
            case "30_dias":
                fechaInicio.setDate(now.getDate() - 30);
                break;
            case "90_dias":
                fechaInicio.setDate(now.getDate() - 90);
                break;
            case "1_ano":
                fechaInicio.setFullYear(now.getFullYear() - 1);
                break;
        }

        let reportData: unknown;

        switch (tipoReporte) {
            case "general":
                reportData = await getGeneralReport(fechaInicio, now);
                break;
            case "agentes":
                reportData = await getAgentesReport(fechaInicio, now);
                break;
            case "codigos":
                reportData = await getCodigosReport(fechaInicio, now);
                break;
            case "conversion":
                reportData = await getConversionReport(fechaInicio, now);
                break;
            default:
                reportData = await getGeneralReport(fechaInicio, now);
        }

        return NextResponse.json({
            success: true,
            data: reportData,
            periodo,
            tipoReporte,
        });

    } catch (error) {
        console.error("Error generating reports:", error);
        return NextResponse.json(
            { success: false, error: "Error al generar reportes" },
            { status: 500 }
        );
    }
}

// Función para reporte general
async function getGeneralReport(fechaInicio: Date, fechaFin: Date) {
    // Códigos generales
    const codigosGenerales = await prisma.platform_discount_codes.findMany({
        where: {
            created_at: {
                gte: fechaInicio,
                lte: fechaFin,
            },
        },
        include: {
            discount_usage: {
                include: {
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

    // Códigos de agentes
    const codigosAgentes = await prisma.platform_agent_discount_codes.findMany({
        where: {
            fecha_creacion: {
                gte: fechaInicio,
                lte: fechaFin,
            },
        },
        include: {
            lead: {
                select: {
                    name: true,
                    email: true,
                },
            },
            agente: {
                select: {
                    nombre: true,
                    email: true,
                },
            },
        },
    });

    // Calcular métricas
    const totalCodigos = codigosGenerales.length + codigosAgentes.length;
    const totalUsados = codigosGenerales.filter(c => c.discount_usage?.length > 0).length +
        codigosAgentes.filter(c => c.usado).length;
    const totalConversiones = codigosGenerales.reduce((sum, c) => sum + (c.discount_usage?.length || 0), 0) +
        codigosAgentes.filter(c => c.usado).length;

    const totalIngresos = codigosGenerales.reduce((sum, c) =>
        sum + (c.discount_usage?.reduce((usageSum, usage) => usageSum + Number(usage.monto_descuento), 0) || 0), 0
    );

    return {
        totalCodigos,
        totalUsados,
        totalConversiones,
        totalIngresos,
        tasaConversion: totalCodigos > 0 ? (totalUsados / totalCodigos) * 100 : 0,
        codigosGenerales: codigosGenerales.map(code => ({
            ...code,
            conversiones: code.discount_usage?.length || 0,
            ingresos: code.discount_usage?.reduce((sum, usage) => sum + Number(usage.monto_descuento), 0) || 0,
        })),
        codigosAgentes: codigosAgentes.map(code => ({
            ...code,
            conversiones: code.usado ? 1 : 0,
            ingresos: code.usado ? Number(code.valor_descuento) : 0,
        })),
    };
}

// Función para reporte de agentes
async function getAgentesReport(fechaInicio: Date, fechaFin: Date) {
    const agentes = await prisma.platform_agents.findMany({
        include: {
            agent_discount_codes: {
                where: {
                    fecha_creacion: {
                        gte: fechaInicio,
                        lte: fechaFin,
                    },
                },
            },
        },
    });

    return agentes.map(agente => {
        const codigos = agente.agent_discount_codes;
        const usados = codigos.filter(c => c.usado).length;
        const ingresos = codigos
            .filter(c => c.usado)
            .reduce((sum, c) => sum + Number(c.valor_descuento), 0);

        return {
            id: agente.id,
            nombre: agente.nombre,
            email: agente.email,
            codigosGenerados: codigos.length,
            codigosUsados: usados,
            tasaConversion: codigos.length > 0 ? (usados / codigos.length) * 100 : 0,
            ingresos,
        };
    });
}

// Función para reporte de códigos
async function getCodigosReport(fechaInicio: Date, fechaFin: Date) {
    // Códigos generales
    const codigosGenerales = await prisma.platform_discount_codes.findMany({
        where: {
            created_at: {
                gte: fechaInicio,
                lte: fechaFin,
            },
        },
        include: {
            discount_usage: true,
        },
    });

    // Códigos de agentes
    const codigosAgentes = await prisma.platform_agent_discount_codes.findMany({
        where: {
            fecha_creacion: {
                gte: fechaInicio,
                lte: fechaFin,
            },
        },
    });

    const todosLosCodigos = [
        ...codigosGenerales.map(code => ({
            id: code.id,
            codigo: code.codigo,
            nombre: code.nombre,
            tipo: "general",
            descuento: code.valor_descuento,
            tipo_descuento: code.tipo_descuento,
            uso: code.discount_usage?.length || 0,
            maximo: code.uso_maximo,
            conversiones: code.discount_usage?.length || 0,
            ingresos: code.discount_usage?.reduce((sum, usage) => sum + Number(usage.monto_descuento), 0) || 0,
            estado: code.activo ? "activo" : "inactivo",
            fecha_creacion: code.created_at,
        })),
        ...codigosAgentes.map(code => ({
            id: code.id,
            codigo: code.codigo_completo,
            nombre: `Código de ${code.agente_id}`,
            tipo: "agente",
            descuento: code.valor_descuento,
            tipo_descuento: code.tipo_descuento,
            uso: code.usado ? 1 : 0,
            maximo: 1,
            conversiones: code.usado ? 1 : 0,
            ingresos: code.usado ? Number(code.valor_descuento) : 0,
            estado: code.activo ? "activo" : "inactivo",
            fecha_creacion: code.fecha_creacion,
        })),
    ];

    return todosLosCodigos.sort((a, b) =>
        new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime()
    );
}

// Función para reporte de conversión
async function getConversionReport(fechaInicio: Date, fechaFin: Date) {
    // Conversiones por día
    const conversionesGenerales = await prisma.platform_discount_usage.findMany({
        where: {
            fecha_uso: {
                gte: fechaInicio,
                lte: fechaFin,
            },
        },
        select: {
            fecha_uso: true,
            monto_descuento: true,
            discount_code: {
                select: {
                    codigo: true,
                    nombre: true,
                },
            },
        },
    });

    // Conversiones de agentes
    const conversionesAgentes = await prisma.platform_agent_discount_codes.findMany({
        where: {
            usado: true,
            fecha_uso: {
                gte: fechaInicio,
                lte: fechaFin,
            },
        },
        select: {
            fecha_uso: true,
            valor_descuento: true,
            codigo_completo: true,
            agente: {
                select: {
                    nombre: true,
                },
            },
        },
    });

    // Agrupar por día
    const conversionesPorDia: Record<string, unknown> = {};

    conversionesGenerales.forEach(conversion => {
        const fecha = conversion.fecha_uso.toISOString().split('T')[0];
        if (!conversionesPorDia[fecha]) {
            conversionesPorDia[fecha] = {
                fecha,
                conversiones: 0,
                ingresos: 0,
                detalles: [],
            };
        }
        (conversionesPorDia[fecha] as { conversiones: number; ingresos: number; detalles: unknown[] }).conversiones++;
        (conversionesPorDia[fecha] as { conversiones: number; ingresos: number; detalles: unknown[] }).ingresos += Number(conversion.monto_descuento);
        (conversionesPorDia[fecha] as { conversiones: number; ingresos: number; detalles: unknown[] }).detalles.push({
            tipo: "general",
            codigo: conversion.discount_code.codigo,
            nombre: conversion.discount_code.nombre,
            monto: conversion.monto_descuento,
        });
    });

    conversionesAgentes.forEach(conversion => {
        const fecha = conversion.fecha_uso?.toISOString().split('T')[0];
        if (fecha) {
            if (!conversionesPorDia[fecha]) {
                conversionesPorDia[fecha] = {
                    fecha,
                    conversiones: 0,
                    ingresos: 0,
                    detalles: [],
                };
            }
            (conversionesPorDia[fecha] as { conversiones: number; ingresos: number; detalles: unknown[] }).conversiones++;
            (conversionesPorDia[fecha] as { conversiones: number; ingresos: number; detalles: unknown[] }).ingresos += Number(conversion.valor_descuento);
            (conversionesPorDia[fecha] as { conversiones: number; ingresos: number; detalles: unknown[] }).detalles.push({
                tipo: "agente",
                codigo: conversion.codigo_completo,
                nombre: `Código de ${conversion.agente.nombre}`,
                monto: conversion.valor_descuento,
            });
        }
    });

    return {
        conversionesPorDia: Object.values(conversionesPorDia).sort((a: unknown, b: unknown) =>
            new Date((a as { fecha: string }).fecha).getTime() - new Date((b as { fecha: string }).fecha).getTime()
        ),
        totalConversiones: conversionesGenerales.length + conversionesAgentes.length,
        totalIngresos: conversionesGenerales.reduce((sum, c) => sum + Number(c.monto_descuento), 0) +
            conversionesAgentes.reduce((sum, c) => sum + Number(c.valor_descuento), 0),
    };
}
