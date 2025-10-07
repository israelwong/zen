import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
    try {
        // Obtener todos los planes activos ordenados por orden actual
        const activePlans = await prisma.platform_plans.findMany({
            where: { active: true },
            orderBy: [
                { orden: 'asc' },
                { createdAt: 'asc' } // Usar createdAt como criterio de desempate
            ]
        });

        // Normalizar el orden (1, 2, 3, 4, 5...)
        const updatePromises = activePlans.map((plan, index) =>
            prisma.platform_plans.update({
                where: { id: plan.id },
                data: { orden: index + 1 }
            })
        );

        await Promise.all(updatePromises);

        return NextResponse.json({
            success: true,
            message: `Orden normalizado para ${activePlans.length} planes activos`,
            normalizedCount: activePlans.length
        });
    } catch (error) {
        console.error("Error normalizing plan order:", error);
        return NextResponse.json(
            { error: "Error al normalizar el orden de los planes" },
            { status: 500 }
        );
    }
}
