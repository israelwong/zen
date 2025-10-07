import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRetry, getFriendlyErrorMessage } from "@/lib/database/retry-helper";

// GET: Obtener todas las categorías
export async function GET(request: NextRequest) {
    try {
        const categories = await withRetry(async () => {
            return await prisma.service_categories.findMany({
                orderBy: [
                    { posicion: 'asc' },
                    { name: 'asc' }
                ]
            });
        });

        return NextResponse.json(categories);
    } catch (error) {
        console.error('Error fetching service categories:', error);
        return NextResponse.json({
            error: getFriendlyErrorMessage(error) || 'Error al obtener categorías de servicios'
        }, { status: 500 });
    }
}

// POST: Crear nueva categoría
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, description, icon, posicion, active } = body;

        if (!name || !description || !icon) {
            return NextResponse.json({ error: "Nombre, descripción e icono son requeridos" }, { status: 400 });
        }

        // Verificar si ya existe una categoría con ese nombre
        const existingCategory = await prisma.service_categories.findUnique({
            where: { name }
        });

        if (existingCategory) {
            return NextResponse.json({ error: "Ya existe una categoría con ese nombre" }, { status: 409 });
        }

        // Si no se especifica posición, asignar la siguiente disponible
        let finalPosition = posicion;
        if (!finalPosition) {
            const lastCategory = await prisma.service_categories.findFirst({
                orderBy: { posicion: 'desc' }
            });
            finalPosition = (lastCategory?.posicion || 0) + 1;
        }

        const category = await prisma.service_categories.create({
            data: {
                name,
                description,
                icon,
                posicion: finalPosition,
                active: active !== undefined ? active : true
            }
        });

        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        console.error('Error creating service category:', error);
        return NextResponse.json({ error: 'Error al crear categoría de servicio' }, { status: 500 });
    }
}
