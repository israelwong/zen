import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const agents = await prisma.platform_agents.findMany({
            where: {
                activo: true
            },
            select: {
                id: true,
                nombre: true,
                email: true,
                telefono: true,
                meta_mensual_leads: true,
                comision_conversion: true,
                created_at: true,
                updated_at: true
            },
            orderBy: {
                nombre: 'asc'
            }
        });

        // Convertir Decimal a number para el frontend
        const agentsFormatted = agents.map(agent => ({
            ...agent,
            comision_conversion: Number(agent.comision_conversion)
        }));

        return NextResponse.json(agentsFormatted);
    } catch (error) {
        console.error('Error fetching agents:', error);
        return NextResponse.json(
            { error: 'Error al cargar los agentes' },
            { status: 500 }
        );
    }
}
