import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const campaña = await prisma.platform_campaigns.findUnique({
            where: { id },
            include: {
                platform_campaign_platforms: {
                    include: {
                        platform_advertising_platforms: true
                    }
                },
                platform_leads: {
                    include: {
                        platform_acquisition_channels: true
                    }
                },
                _count: {
                    select: {
                        platform_leads: true
                    }
                }
            }
        });

        if (!campaña) {
            return NextResponse.json(
                { error: 'Campaña no encontrada' },
                { status: 404 }
            );
        }

        return NextResponse.json(campaña);
    } catch (error) {
        console.error('Error fetching campaña:', error);
        return NextResponse.json(
            { error: 'Error al cargar la campaña' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const body = await request.json();
        const { id } = await params;

        const { plataformas, ...campañaData } = body;

        const campaña = await prisma.platform_campaigns.update({
            where: { id },
            data: {
                ...campañaData,
                platform_campana_plataformas: plataformas ? {
                    deleteMany: {},
                    create: plataformas.map((p: { plataformaId: string; presupuesto: number; gastoReal?: number; leads?: number; conversiones?: number }) => ({
                        plataformaId: p.plataformaId,
                        presupuesto: p.presupuesto,
                        gastoReal: p.gastoReal || 0,
                        leads: p.leads || 0,
                        conversiones: p.conversiones || 0
                    }))
                } : undefined
            },
            include: {
                platform_campaign_platforms: {
                    include: {
                        platform_advertising_platforms: true
                    }
                }
            }
        });

        return NextResponse.json(campaña);
    } catch (error) {
        console.error('Error updating campaña:', error);
        return NextResponse.json(
            { error: 'Error al actualizar la campaña' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await prisma.platform_campaigns.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting campaña:', error);
        return NextResponse.json(
            { error: 'Error al eliminar la campaña' },
            { status: 500 }
        );
    }
}
