import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const leads = await prisma.proSocialLead.findMany({
            include: {
                agent: {
                    select: {
                        id: true,
                        nombre: true,
                        email: true
                    }
                },
                etapa: {
                    select: {
                        id: true,
                        nombre: true,
                        descripcion: true
                    }
                },
                canalAdquisicion: {
                    select: {
                        id: true,
                        nombre: true,
                        categoria: true,
                        color: true,
                        icono: true
                    }
                },
                campaña: {
                    select: {
                        id: true,
                        nombre: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(leads);
    } catch (error) {
        console.error('Error fetching leads:', error);
        return NextResponse.json(
            { error: 'Error al cargar los leads' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        // Validar campos requeridos
        if (!body.nombre || !body.email || !body.telefono) {
            return NextResponse.json(
                { error: 'Nombre, email y teléfono son requeridos' },
                { status: 400 }
            );
        }

        // Verificar que el email no exista
        const existingLead = await prisma.proSocialLead.findUnique({
            where: { email: body.email }
        });

        if (existingLead) {
            return NextResponse.json(
                { error: 'Ya existe un lead con este email' },
                { status: 400 }
            );
        }

        const newLead = await prisma.proSocialLead.create({
            data: {
                nombre: body.nombre,
                email: body.email,
                telefono: body.telefono,
                nombreEstudio: body.nombreEstudio || null,
                slugEstudio: body.slugEstudio || null,
                planInteres: body.planInteres || null,
                presupuestoMensual: body.presupuestoMensual || null,
                fechaProbableInicio: body.fechaProbableInicio || null,
                agentId: body.agentId || null,
                etapaId: body.etapaId || null,
                canalAdquisicionId: body.canalAdquisicionId || null,
                puntaje: body.puntaje || null,
                prioridad: body.prioridad || 'media'
            },
            include: {
                agent: {
                    select: {
                        id: true,
                        nombre: true,
                        email: true
                    }
                },
                etapa: {
                    select: {
                        id: true,
                        nombre: true,
                        descripcion: true
                    }
                },
                canalAdquisicion: {
                    select: {
                        id: true,
                        nombre: true,
                        categoria: true,
                        color: true,
                        icono: true
                    }
                }
            }
        });

        return NextResponse.json(newLead, { status: 201 });
    } catch (error) {
        console.error('Error creating lead:', error);
        return NextResponse.json(
            { error: 'Error al crear el lead' },
            { status: 500 }
        );
    }
}
