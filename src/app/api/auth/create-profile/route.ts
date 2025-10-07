import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const { id, email, fullName, role } = await request.json()

        // Verificar que el usuario esté autenticado
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Usuario no autenticado' },
                { status: 401 }
            )
        }

        // Verificar que el ID del usuario coincida
        if (user.id !== id) {
            return NextResponse.json(
                { error: 'ID de usuario no coincide' },
                { status: 403 }
            )
        }

        // Crear el perfil usando Prisma (bypass RLS)
        const { prisma } = await import('@/lib/prisma')

        try {
            const profile = await prisma.userProfile.create({
                data: {
                    id,
                    email,
                    fullName,
                    role,
                    isActive: true,
                },
            })

            await prisma.$disconnect()

            return NextResponse.json({
                success: true,
                data: profile,
            })
        } catch (dbError: unknown) {
            const error = dbError as { code?: string; message?: string }
            await prisma.$disconnect()

            // Si el usuario ya existe, actualizar en lugar de crear
            if (error.code === 'P2002') {
                const updatedProfile = await prisma.userProfile.update({
                    where: { id },
                    data: {
                        fullName,
                        role,
                        isActive: true,
                    },
                })

                return NextResponse.json({
                    success: true,
                    data: updatedProfile,
                })
            }

            throw dbError
        }

    } catch (error: unknown) {
        console.error('Error creating user profile:', error)
        const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor'
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        )
    }
}
