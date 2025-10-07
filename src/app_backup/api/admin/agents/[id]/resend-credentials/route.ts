import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { prisma } from '@/lib/prisma';
import { isValidSupabaseAuthId } from '@/lib/uuid-utils';
import { sendAgentCredentialsEmail } from '@/lib/email/agent-email-service';

// POST /api/admin/agents/[id]/resend-credentials - Reenviar credenciales al agente
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Validar que el ID sea un UUID válido
        if (!isValidSupabaseAuthId(id)) {
            return NextResponse.json(
                { error: 'ID no es un UUID válido - usuario no existe en Supabase Auth' },
                { status: 400 }
            );
        }

        // Obtener datos del agente
        const agent = await prisma.platform_agents.findUnique({
            where: { id }
        });

        if (!agent) {
            return NextResponse.json(
                { error: 'Agente no encontrado' },
                { status: 404 }
            );
        }

        // Generar nueva contraseña temporal
        const newTempPassword = `Agente${Math.random().toString(36).slice(-8)}!`;

        // Actualizar contraseña en Supabase Auth
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(id, {
            password: newTempPassword
        });

        if (updateError) {
            console.error('Error updating password:', updateError);
            return NextResponse.json(
                { error: 'Error al actualizar la contraseña' },
                { status: 500 }
            );
        }

        // Enviar email con las nuevas credenciales
        const emailResult = await sendAgentCredentialsEmail({
            agentName: agent.nombre,
            email: agent.email,
            temporaryPassword: newTempPassword,
            isNewAgent: false
        });

        return NextResponse.json({
            message: 'Credenciales actualizadas exitosamente',
            agent: {
                email: agent.email,
                tempPassword: newTempPassword // En desarrollo, mostramos la contraseña
            },
            emailSent: emailResult.success,
            emailId: emailResult.success ? emailResult.emailId : null
        });
    } catch (error) {
        console.error('Error resending credentials:', error);
        return NextResponse.json(
            { error: 'Error al reenviar credenciales' },
            { status: 500 }
        );
    }
}
