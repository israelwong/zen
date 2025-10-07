import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';

// Schema de validación para actualizar agente
const updateAgentSchema = z.object({
    nombre: z.string().min(1, 'El nombre es requerido').optional(),
    email: z.string().email('Email inválido').optional(),
    telefono: z.string().min(1, 'El teléfono es requerido').optional(),
    activo: z.boolean().optional(),
    metaMensualLeads: z.number().min(1, 'La meta debe ser mayor a 0').optional(),
    comisionConversion: z.number().min(0).max(1, 'La comisión debe estar entre 0 y 1').optional()
});

// GET /api/admin/agents/[id] - Obtener agente por ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const agent = await prisma.platform_agents.findUnique({
            where: { id },
            include: {
                platform_leads: {
                    select: {
                        id: true,
                        nombre: true,
                        email: true,
                        etapaId: true,
                        prioridad: true,
                        createdAt: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                _count: {
                    select: {
                        platform_leads: true
                    }
                }
            }
        });

        if (!agent) {
            return NextResponse.json(
                { error: 'Agente no encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json(agent);
    } catch (error) {
        console.error('Error fetching agent:', error);
        return NextResponse.json(
            { error: 'Error al obtener el agente' },
            { status: 500 }
        );
    }
}

// PUT /api/admin/agents/[id] - Actualizar agente
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Validar datos
        const validatedData = updateAgentSchema.parse(body);

        // Verificar si el agente existe
        const existingAgent = await prisma.platform_agents.findUnique({
            where: { id }
        });

        if (!existingAgent) {
            return NextResponse.json(
                { error: 'Agente no encontrado' },
                { status: 404 }
            );
        }

        // Si se está actualizando el email, verificar que no exista otro agente con ese email
        if (validatedData.email && validatedData.email !== existingAgent.email) {
            const emailExists = await prisma.platform_agents.findUnique({
                where: { email: validatedData.email }
            });

            if (emailExists) {
                return NextResponse.json(
                    { error: 'Ya existe un agente con este email' },
                    { status: 400 }
                );
            }
        }

        // Actualizar agente
        const agent = await prisma.platform_agents.update({
            where: { id },
            data: validatedData,
            include: {
                _count: {
                    select: {
                        platform_leads: true
                    }
                }
            }
        });

        // Si se está actualizando el estado activo, actualizar también en Supabase Auth
        if (validatedData.activo !== undefined) {
            try {
                if (validatedData.activo) {
                    // Reactivar usuario en Supabase Auth
                    await supabaseAdmin.auth.admin.updateUserById(id, {
                        ban_duration: 'none'
                    });
                } else {
                    // Desactivar usuario en Supabase Auth (ban temporal muy largo)
                    await supabaseAdmin.auth.admin.updateUserById(id, {
                        ban_duration: '876600h' // 100 años
                    });
                }

                // Actualizar también el perfil de usuario
                await prisma.project_user_profiles.update({
                    where: { id },
                    data: {
                        isActive: validatedData.activo,
                        ...(validatedData.nombre && { fullName: validatedData.nombre })
                    }
                });
            } catch (authError) {
                console.error('Error updating auth user status:', authError);
                // No fallar la operación completa si solo falla la actualización en Auth
            }
        }

        return NextResponse.json(agent);
    } catch (error) {
        console.error('Error updating agent:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Datos inválidos', details: error.issues },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Error al actualizar el agente' },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/agents/[id] - Eliminar agente
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        // Verificar si el agente existe
        const existingAgent = await prisma.platform_agents.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        platform_leads: true
                    }
                }
            }
        });

        if (!existingAgent) {
            return NextResponse.json(
                { error: 'Agente no encontrado' },
                { status: 404 }
            );
        }

        // Si tiene leads asignados, desasignarlos y crear entradas en bitácora
        let leadsReassigned = 0;
        if (existingAgent._count.platform_leads > 0) {
            // Obtener los leads asignados al agente
            const assignedLeads = await prisma.platform_leads.findMany({
                where: { agentId: id },
                select: { id: true, nombre: true }
            });

            // Desasignar leads y crear entradas en bitácora
            for (const lead of assignedLeads) {
                // Desasignar el lead
                await prisma.platform_leads.update({
                    where: { id: lead.id },
                    data: { agentId: null }
                });

                // Crear entrada en bitácora
                await prisma.platform_lead_bitacora.create({
                    data: {
                        id: `bitacora-${Date.now()}-${lead.id}`,
                        leadId: lead.id,
                        tipo: 'DESASIGNACION_AGENTE',
                        descripcion: `Lead anteriormente gestionado por ${existingAgent.nombre} y ahora está disponible para seguimiento`,
                        usuarioId: null, // TODO: Obtener ID del usuario que está eliminando
                        updatedAt: new Date()
                    }
                });
            }

            leadsReassigned = assignedLeads.length;
        }

        // Eliminar perfil de usuario
        try {
            await prisma.project_user_profiles.delete({
                where: { id }
            });
        } catch (error) {
            console.error('Error deleting user profile:', error);
            // No fallar si no existe el perfil
        }

        // Eliminar usuario de Supabase Auth
        try {
            await supabaseAdmin.auth.admin.deleteUser(id);
        } catch (authError) {
            console.error('Error deleting auth user:', authError);
            // No fallar si no existe el usuario en Auth
        }

        // Eliminar agente
        await prisma.platform_agents.delete({
            where: { id }
        });

        return NextResponse.json({
            message: 'Agente eliminado exitosamente',
            leadsReassigned
        });
    } catch (error) {
        console.error('Error deleting agent:', error);
        return NextResponse.json(
            { error: 'Error al eliminar el agente' },
            { status: 500 }
        );
    }
}
