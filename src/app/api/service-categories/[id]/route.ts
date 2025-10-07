import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Obtener una categoría específica
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const category = await prisma.service_categories.findUnique({
            where: { id },
            include: {
                services: {
                    orderBy: { posicion: 'asc' }
                }
            }
        });

        if (!category) {
            return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
        }

        return NextResponse.json(category);
    } catch (error) {
        console.error('Error fetching service category:', error);
        return NextResponse.json({ error: 'Error al obtener categoría de servicio' }, { status: 500 });
    }
}

// PUT: Actualizar una categoría
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, description, icon, posicion, active } = body;

        console.log('Updating service category:', { id, body });

        // Verificar si la categoría existe
        const existingCategory = await prisma.service_categories.findUnique({
            where: { id }
        });

        if (!existingCategory) {
            return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
        }

        // Si se está cambiando el nombre, verificar que no exista otra categoría con ese nombre
        if (name && name !== existingCategory.name) {
            const duplicateCategory = await prisma.service_categories.findUnique({
                where: { name }
            });

            if (duplicateCategory) {
                return NextResponse.json({ error: 'Ya existe una categoría con ese nombre' }, { status: 409 });
            }
        }

        const category = await prisma.service_categories.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(description && { description }),
                ...(icon && { icon }),
                ...(posicion !== undefined && { posicion }),
                ...(active !== undefined && { active }),
                updatedAt: new Date()
            }
        });

        console.log('Service category updated successfully:', category.id);
        return NextResponse.json(category);
    } catch (error) {
        console.error('Error updating service category:', error);
        console.error('Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });

        // Manejar errores específicos de Prisma
        if (error instanceof Error) {
            if (error.message.includes('P1001') || error.message.includes('Can\'t reach database')) {
                return NextResponse.json(
                    { error: 'Error de conexión a la base de datos. Intenta nuevamente.' },
                    { status: 503 }
                );
            }
            
            if (error.message.includes('Unique constraint')) {
                return NextResponse.json(
                    { error: 'Ya existe una categoría con ese nombre' },
                    { status: 409 }
                );
            }
        }

        return NextResponse.json({ error: 'Error al actualizar categoría de servicio' }, { status: 500 });
    }
}

// DELETE: Eliminar una categoría
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        // Verificar si la categoría existe
        const existingCategory = await prisma.service_categories.findUnique({
            where: { id },
            include: {
                services: true
            }
        });

        if (!existingCategory) {
            return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
        }

        // Verificar si tiene servicios asociados
        if (existingCategory.services.length > 0) {
            return NextResponse.json({
                error: 'No se puede eliminar una categoría que tiene servicios asociados'
            }, { status: 409 });
        }

        await prisma.service_categories.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Categoría eliminada exitosamente' });
    } catch (error) {
        console.error('Error deleting service category:', error);
        return NextResponse.json({ error: 'Error al eliminar categoría de servicio' }, { status: 500 });
    }
}
