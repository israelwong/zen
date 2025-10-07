import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';
import { sendAgentCredentialsEmail, validateEmailConfig } from '@/lib/email/agent-email-service';

// Schema de validación para crear agente
const createAgentSchema = z.object({
    nombre: z.string().min(1, 'El nombre es requerido'),
    email: z.string().email('Email inválido'),
    telefono: z.string().min(1, 'El teléfono es requerido'),
    activo: z.boolean().default(true),
    metaMensualLeads: z.number().min(1, 'La meta debe ser mayor a 0'),
    comisionConversion: z.number().min(0).max(1, 'La comisión debe estar entre 0 y 1')
});

// GET /api/admin/agents - Listar todos los agentes
export async function GET() {
    try {
        const agents = await prisma.platform_agents.findMany({
            include: {
                _count: {
                    select: {
                        platform_leads: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(agents);
    } catch (error) {
        console.error('Error fetching agents:', error);
        return NextResponse.json(
            { error: 'Error al obtener los agentes' },
            { status: 500 }
        );
    }
}

// POST /api/admin/agents - Crear nuevo agente
export async function POST(request: NextRequest) {
    try {
        // Validar configuración de email
        const emailConfig = validateEmailConfig();
        if (!emailConfig.isValid) {
            console.warn('⚠️ Configuración de email incompleta:', emailConfig.errors);
        }

        const body = await request.json();
        console.log('Datos recibidos:', body);

        // Validar datos
        let validatedData;
        try {
            validatedData = createAgentSchema.parse(body);
            console.log('Datos validados:', validatedData);
        } catch (validationError) {
            console.error('Error de validación:', validationError);
            if (validationError instanceof z.ZodError) {
                return NextResponse.json(
                    { error: 'Datos inválidos', details: validationError.issues },
                    { status: 400 }
                );
            }
            throw validationError;
        }

        // Verificar si el email ya existe
        const existingAgent = await prisma.platform_agents.findUnique({
            where: { email: validatedData.email }
        });

        if (existingAgent) {
            return NextResponse.json(
                { error: 'Ya existe un agente con este email' },
                { status: 400 }
            );
        }

        // Generar contraseña temporal
        const tempPassword = `Agente${Math.random().toString(36).slice(-8)}!`;

        // 1. Crear usuario en Supabase Auth
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: validatedData.email,
            password: tempPassword,
            email_confirm: true, // Auto-confirmar email
            user_metadata: {
                full_name: validatedData.nombre,
                role: 'agente'
            }
        });

        if (authError) {
            console.error('Error creating auth user:', authError);
            return NextResponse.json(
                { error: 'Error al crear usuario en el sistema de autenticación' },
                { status: 500 }
            );
        }

        try {
            // 2. Crear agente en la base de datos
            const agent = await prisma.platform_agents.create({
                data: {
                    id: authUser.user.id, // Usar el mismo ID de Supabase Auth
                    nombre: validatedData.nombre,
                    email: validatedData.email,
                    telefono: validatedData.telefono,
                    activo: validatedData.activo,
                    metaMensualLeads: validatedData.metaMensualLeads,
                    comisionConversion: validatedData.comisionConversion,
                    updatedAt: new Date()
                },
                include: {
                    _count: {
                        select: {
                            platform_leads: true
                        }
                    }
                }
            });

            // 3. Crear perfil de usuario
            const userProfile = await prisma.project_user_profiles.create({
                data: {
                    id: authUser.user.id,
                    email: validatedData.email,
                    fullName: validatedData.nombre,
                    role: 'agente',
                    isActive: validatedData.activo,
                    updatedAt: new Date()
                }
            });

            console.log('🔍 Perfil de usuario creado:', userProfile);
            console.log('🔍 Rol guardado en BD:', userProfile.role);
            console.log('🔍 Tipo de rol:', typeof userProfile.role);

            // 4. Enviar email de invitación con credenciales
            // TODO: Implementar envío de email con credenciales temporales

            // Enviar email con credenciales
            const emailResult = await sendAgentCredentialsEmail({
                agentName: validatedData.nombre,
                email: validatedData.email,
                temporaryPassword: tempPassword,
                isNewAgent: true
            });

            return NextResponse.json({
                agent,
                authUser: {
                    id: authUser.user.id,
                    email: authUser.user.email,
                    tempPassword // En desarrollo, mostramos la contraseña
                },
                emailSent: emailResult.success,
                emailId: emailResult.success ? emailResult.emailId : null
            }, { status: 201 });

        } catch (dbError) {
            // Si falla la creación en BD, eliminar el usuario de Auth
            await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
            throw dbError;
        }
    } catch (error) {
        console.error('Error creating agent:', error);
        const errorMessage = error instanceof Error ? error.stack : 'No stack trace available';
        console.error('Error stack:', errorMessage);
        console.error('Error details:', JSON.stringify(error, null, 2));

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Datos inválidos', details: error.issues },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Error al crear el agente' },
            { status: 500 }
        );
    }
}
