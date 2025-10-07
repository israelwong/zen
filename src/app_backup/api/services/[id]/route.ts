import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const service = await prisma.platform_services.findUnique({
            where: { id },
            include: {
                category: true
            }
        });

        if (!service) {
            return NextResponse.json(
                { error: 'Servicio no encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json(service);
    } catch (error) {
        console.error('Error fetching service:', error);
        return NextResponse.json(
            { error: 'Error al obtener el servicio' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, slug, description, categoryId, posicion, active } = body;

        console.log('Updating service:', { id, body });

        // Si se está cambiando la categoría, verificar que existe
        if (categoryId !== undefined && categoryId !== null) {
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

        // Si se está cambiando la posición, necesitamos reordenar otros servicios en la misma categoría
        if (posicion !== undefined) {
            const currentService = await prisma.platform_services.findUnique({
                where: { id },
                select: { categoryId: true, posicion: true }
            });

            if (currentService) {
                const targetCategoryId = categoryId !== undefined ? categoryId : currentService.categoryId;

                // Obtener todos los servicios en la misma categoría
                const servicesInCategory = await prisma.platform_services.findMany({
                    where: targetCategoryId ? { categoryId: targetCategoryId } : { categoryId: null },
                    orderBy: { posicion: 'asc' }
                });

                // Reordenar posiciones
                const servicesToUpdate = servicesInCategory.filter(s => s.id !== id);
                servicesToUpdate.splice(posicion - 1, 0, { id, posicion: posicion } as { id: string; posicion: number });

                // Actualizar posiciones de todos los servicios afectados
                for (let i = 0; i < servicesToUpdate.length; i++) {
                    const serviceToUpdate = servicesToUpdate[i];
                    if (serviceToUpdate.id !== id) {
                        await prisma.platform_services.update({
                            where: { id: serviceToUpdate.id },
                            data: { posicion: i + 1 }
                        });
                    }
                }
            }
        }

        const service = await prisma.platform_services.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(slug && { slug }),
                ...(description !== undefined && { description }),
                ...(categoryId !== undefined && { categoryId }),
                ...(posicion !== undefined && { posicion }),
                ...(active !== undefined && { active }),
                updatedAt: new Date()
            },
            include: {
                category: true
            }
        });

        console.log('Service updated successfully:', service.id);
        return NextResponse.json(service);
    } catch (error) {
        console.error('Error updating service:', error);
        console.error('Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });

        if (error instanceof Error && error.message.includes('Unique constraint')) {
            return NextResponse.json(
                { error: 'Ya existe un servicio con ese nombre o slug' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: 'Error al actualizar el servicio' },
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

        await prisma.platform_services.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Servicio eliminado exitosamente' });
    } catch (error) {
        console.error('Error deleting service:', error);
        return NextResponse.json(
            { error: 'Error al eliminar el servicio' },
            { status: 500 }
        );
    }
}
