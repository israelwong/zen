import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRetry, getFriendlyErrorMessage } from '@/lib/database/retry-helper';

export async function GET(request: NextRequest) {
    try {
        const services = await withRetry(async () => {
            return await prisma.platform_services.findMany({
                include: {
                    category: true
                },
                orderBy: [
                    { category: { posicion: 'asc' } },
                    { posicion: 'asc' },
                    { name: 'asc' }
                ]
            });
        });

        return NextResponse.json(services);
    } catch (error) {
        console.error('Error fetching services:', error);
        return NextResponse.json(
            { error: getFriendlyErrorMessage(error) || 'Error al obtener los servicios' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, slug, description, categoryId } = body;

        if (!name || !slug) {
            return NextResponse.json(
                { error: 'Nombre y slug son requeridos' },
                { status: 400 }
            );
        }

        // Verificar que la categoría existe si se proporciona
        if (categoryId && categoryId.trim() !== '') {
            const category = await prisma.service_categories.findUnique({
                where: { id: categoryId }
            });

            if (!category) {
                return NextResponse.json(
                    { error: 'La categoría especificada no existe' },
                    { status: 400 }
                );
            }
        }

        // Normalizar categoryId (null si está vacío)
        const normalizedCategoryId = categoryId && categoryId.trim() !== '' ? categoryId : null;

        // Obtener la siguiente posición disponible en la categoría
        const lastService = await prisma.platform_services.findFirst({
            where: normalizedCategoryId ? { categoryId: normalizedCategoryId } : { categoryId: null },
            orderBy: { posicion: 'desc' }
        });
        const nextPosition = (lastService?.posicion || 0) + 1;

        const service = await prisma.platform_services.create({
            data: {
                name,
                slug,
                description: description || null,
                categoryId: normalizedCategoryId,
                posicion: nextPosition,
                active: true
            },
            include: {
                category: true
            }
        });

        return NextResponse.json(service, { status: 201 });
    } catch (error) {
        console.error('Error creating service:', error);

        // Manejar errores específicos de Prisma
        if (error instanceof Error) {
            if (error.message.includes('Unique constraint')) {
                return NextResponse.json(
                    { error: 'Ya existe un servicio con ese nombre o slug' },
                    { status: 409 }
                );
            }

            if (error.message.includes('P1001') || error.message.includes('Can\'t reach database')) {
                return NextResponse.json(
                    { error: 'Error de conexión a la base de datos. Intenta nuevamente.' },
                    { status: 503 }
                );
            }
        }

        return NextResponse.json(
            { error: 'Error al crear el servicio' },
            { status: 500 }
        );
    }
}
