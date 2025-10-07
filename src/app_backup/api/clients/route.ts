import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const studioSlug = request.headers.get('x-studio-slug')

        if (!studioSlug) {
            return NextResponse.json({ error: 'Studio not found' }, { status: 400 })
        }

        // Obtener el studio
        const studio = await prisma.studio.findUnique({
            where: { slug: studioSlug }
        })

        if (!studio) {
            return NextResponse.json({ error: 'Studio not found' }, { status: 404 })
        }

        // Obtener clientes del studio
        const clientes = await prisma.cliente.findMany({
            where: { studioId: studio.id },
            include: {
                Evento: {
                    select: {
                        id: true,
                        nombre: true,
                        status: true,
                        fecha_evento: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(clientes)
    } catch (error) {
        console.error('Error fetching clients:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const studioSlug = request.headers.get('x-studio-slug')

        if (!studioSlug) {
            return NextResponse.json({ error: 'Studio not found' }, { status: 400 })
        }

        // Obtener el studio
        const studio = await prisma.studio.findUnique({
            where: { slug: studioSlug }
        })

        if (!studio) {
            return NextResponse.json({ error: 'Studio not found' }, { status: 404 })
        }

        const body = await request.json()
        const {
            nombre,
            email,
            telefono,
            direccion
        } = body

        // Crear el cliente
        const cliente = await prisma.cliente.create({
            data: {
                nombre,
                email,
                telefono,
                direccion,
                studioId: studio.id
            }
        })

        return NextResponse.json(cliente, { status: 201 })
    } catch (error) {
        console.error('Error creating client:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
