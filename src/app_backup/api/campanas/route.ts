import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const isActive = searchParams.get('isActive');

        const where: Record<string, unknown> = {};

        if (status) {
            where.status = status;
        }

        if (isActive !== null) {
            where.isActive = isActive === 'true';
        }

        const campanas = await prisma.platform_campaigns.findMany({
            where,
            include: {
                platform_campaign_platforms: {
                    include: {
                        platform_advertising_platforms: true
                    }
                },
                _count: {
                    select: {
                        platform_leads: true
                    }
                }
            },
            orderBy: [
                { start_date: 'desc' },
                { created_at: 'desc' }
            ]
        });

        return NextResponse.json(campanas);
    } catch (error) {
        console.error('Error fetching campanas:', error);
        return NextResponse.json(
            { error: 'Error al cargar las campañas' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { plataformas, ...campañaData } = body;

        const campaña = await prisma.platform_campaigns.create({
            data: {
                name: campañaData.name,
                description: campañaData.descripcion,
                total_budget: campañaData.presupuestoTotal,
                start_date: new Date(campañaData.start_date),
                end_date: new Date(campañaData.end_date),
                is_active: campañaData.is_active,
                status: campañaData.status || 'planificada',
                leads_generated: campañaData.leadsGenerados || 0,
                leads_subscribed: campañaData.leadsSuscritos || 0,
                actual_spend: campañaData.gastoReal || 0,
                updated_at: new Date(),
                platform_campaign_platforms: {
                    create: plataformas?.map((p: { platform_id: string; budget: number; actual_spend?: number; leads?: number; conversions?: number }) => ({
                        platform_id: p.platform_id,
                        budget: p.budget,
                        actual_spend: p.actual_spend || 0,
                        leads: p.leads || 0,
                        conversions: p.conversions || 0
                    })) || []
                }
            },
            include: {
                platform_campaign_platforms: {
                    include: {
                        platform_advertising_platforms: true
                    }
                }
            }
        });

        return NextResponse.json(campaña, { status: 201 });
    } catch (error) {
        console.error('Error creating campaña:', error);
        return NextResponse.json(
            {
                error: 'Error al crear la campaña',
                details: error instanceof Error ? error.message : 'Error desconocido'
            },
            { status: 500 }
        );
    }
}
