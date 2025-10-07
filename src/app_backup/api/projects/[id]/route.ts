import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const studioSlug = request.headers.get('x-studio-slug')

        if (!studioSlug) {
            return NextResponse.json({ error: 'Studio not found' }, { status: 400 })
        }

        // Obtener el studio
        const studio = await prisma.studios.findUnique({
            where: { slug: studioSlug }
        })

        if (!studio) {
            return NextResponse.json({ error: 'Studio not found' }, { status: 404 })
        }

        // Obtener evento específico del studio
        const evento = await prisma.studio_eventos.findFirst({
            where: {
                id: id,
                studio_id: studio.id
            },
            include: {
                cotizaciones: true
            }
        })

        if (!evento) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 })
        }

        return NextResponse.json(evento)
    } catch (error) {
        console.error('Error fetching project:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const studioSlug = request.headers.get('x-studio-slug')

        if (!studioSlug) {
            return NextResponse.json({ error: 'Studio not found' }, { status: 400 })
        }

        // Obtener el studio
        const studio = await prisma.studios.findUnique({
            where: { slug: studioSlug }
        })

        if (!studio) {
            return NextResponse.json({ error: 'Studio not found' }, { status: 404 })
        }

        const body = await request.json()
        const {
            nombre,
            fechaEvento,
            status,
            sede,
            direccion
        } = body

        // Actualizar el evento
        const evento = await prisma.studio_eventos.update({
            where: {
                id: id,
                studio_id: studio.id
            },
            data: {
                nombre,
                fecha_evento: fechaEvento ? new Date(fechaEvento) : undefined,
                status,
                sede,
                direccion
            },
            include: {
                cotizaciones: true
            }
        })

        return NextResponse.json(evento)
    } catch (error) {
        console.error('Error updating project:', error)
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
        const studioSlug = request.headers.get('x-studio-slug')

        if (!studioSlug) {
            return NextResponse.json({ error: 'Studio not found' }, { status: 400 })
        }

        // Obtener el studio
        const studio = await prisma.studios.findUnique({
            where: { slug: studioSlug }
        })

        if (!studio) {
            return NextResponse.json({ error: 'Studio not found' }, { status: 404 })
        }

        // Soft delete - archivar el evento
        const evento = await prisma.studio_eventos.update({
            where: {
                id: id,
                studio_id: studio.id
            },
            data: {
                status: 'archived'
            }
        })

        return NextResponse.json({ message: 'Event archived successfully', evento })
    } catch (error) {
        console.error('Error deleting project:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
