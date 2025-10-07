import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        // TODO: Verificar que el usuario sea administrador de la plataforma

        const body = await request.json()
        const {
            name,
            slug,
            email,
            phone,
            address,
            planId
        } = body

        // Si se está cambiando el slug, verificar que no exista
        if (slug) {
            const existingStudio = await prisma.studios.findFirst({
                where: {
                    slug,
                    NOT: { id }
                }
            })

            if (existingStudio) {
                return NextResponse.json(
                    { error: 'Studio slug already exists' },
                    { status: 400 }
                )
            }
        }

        // Actualizar el studio
        const studio = await prisma.studios.update({
            where: { id },
            data: {
                name,
                slug,
                email,
                phone,
                address,
                ...(planId && { planId })
            },
            include: {
                plan: {
                    select: {
                        name: true,
                        plan_limits: {
                            where: {
                                limit_type: 'EVENTS_PER_MONTH'
                            },
                            select: {
                                limit_value: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        eventos: true,
                        clientes: true,
                        cotizaciones: true
                    }
                }
            }
        })

        const studioWithMetrics = {
            ...studio,
            monthlyRevenue: Math.floor(Math.random() * 10000), // TODO: Calcular revenue real
            lastActivity: new Date().toISOString()
        }

        return NextResponse.json(studioWithMetrics)
    } catch (error) {
        console.error('Error updating studio:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        // TODO: Verificar que el usuario sea administrador de la plataforma

        // Soft delete - cambiar estado a cancelado
        const studio = await prisma.studios.update({
            where: { id },
            data: {
                subscription_status: 'CANCELLED',
                is_active: false
            }
        })

        return NextResponse.json({ message: 'Studio cancelled successfully', studio })
    } catch (error) {
        console.error('Error deleting studio:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
