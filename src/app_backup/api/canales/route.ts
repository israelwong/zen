import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const canales = await prisma.platform_acquisition_channels.findMany({
            orderBy: [
                { order: 'asc' },
                { name: 'asc' }
            ]
        });

        return NextResponse.json(canales);
    } catch (error) {
        console.error('Error fetching canales:', error);
        return NextResponse.json(
            { error: 'Error al cargar los canales' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validar datos requeridos
        if (!body.nombre || !body.nombre.trim()) {
            return NextResponse.json(
                { error: 'El nombre del canal es requerido' },
                { status: 400 }
            );
        }

        // Obtener el último orden para asignar el siguiente
        const lastCanal = await prisma.platform_acquisition_channels.findFirst({
            orderBy: { order: 'desc' },
            select: { order: true }
        });

        const nextOrder = lastCanal ? lastCanal.order + 1 : 0;

        // Preparar datos para crear
        const canalData = {
            name: body.nombre.trim(),
            description: body.descripcion?.trim() || null,
            color: body.color || '#3B82F6',
            icon: body.icono || null,
            isActive: body.isActive ?? true,
            isVisible: body.isVisible ?? true,
            order: body.orden ?? nextOrder, // Usar el orden proporcionado o el siguiente disponible
            updatedAt: new Date()
        };

        const canal = await prisma.platform_acquisition_channels.create({
            data: canalData
        });

        return NextResponse.json(canal, { status: 201 });
    } catch (error) {
        console.error('Error creating canal:', error);

        // Manejar errores específicos de Prisma
        if (error instanceof Error) {
            console.error('Error details:', error.message);

            if (error.message.includes('Unique constraint') || error.message.includes('duplicate key')) {
                return NextResponse.json(
                    { error: 'Ya existe un canal con este nombre' },
                    { status: 409 }
                );
            }
            if (error.message.includes('Invalid value') || error.message.includes('Invalid input')) {
                return NextResponse.json(
                    { error: 'Los datos proporcionados no son válidos' },
                    { status: 400 }
                );
            }
            if (error.message.includes('Required field')) {
                return NextResponse.json(
                    { error: 'Faltan campos requeridos' },
                    { status: 400 }
                );
            }
        }

        return NextResponse.json(
            { error: 'Error al crear el canal. Por favor, verifica los datos e intenta nuevamente.' },
            { status: 500 }
        );
    }
}
