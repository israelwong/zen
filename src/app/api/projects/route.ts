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

        // Obtener proyectos del studio con clientes
        const eventos = await prisma.evento.findMany({
            where: { studioId: studio.id },
            include: {
                Cliente: {
                    select: {
                        id: true,
                        nombre: true,
                        email: true,
                        telefono: true
                    }
                },
                Cotizacion: {
                    select: {
                        id: true,
                        precio: true,
                        status: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(eventos)
    } catch (error) {
        console.error('Error fetching projects:', error)
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
            fechaEvento,
            status = 'active',
            clienteId,
            // Datos del cliente si es nuevo
            clienteNombre,
            clienteEmail,
            clienteTelefono
        } = body

        // Si no hay clienteId, crear un nuevo cliente
        let finalClienteId = clienteId
        if (!finalClienteId && clienteNombre) {
            const newCliente = await prisma.cliente.create({
                data: {
                    nombre: clienteNombre,
                    email: clienteEmail,
                    telefono: clienteTelefono,
                    studioId: studio.id
                }
            })
            finalClienteId = newCliente.id
        }

        if (!finalClienteId) {
            return NextResponse.json(
                { error: 'Client information is required' },
                { status: 400 }
            )
        }

        // Crear el evento
        const evento = await prisma.evento.create({
            data: {
                nombre,
                fecha_evento: fechaEvento ? new Date(fechaEvento) : new Date(),
                status,
                clienteId: finalClienteId,
                studioId: studio.id
            },
            include: {
                Cliente: {
                    select: {
                        id: true,
                        nombre: true,
                        email: true,
                        telefono: true
                    }
                }
            }
        })

        return NextResponse.json(evento, { status: 201 })
    } catch (error) {
        console.error('Error creating evento:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
