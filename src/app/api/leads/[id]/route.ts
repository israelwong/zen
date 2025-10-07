import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: leadId } = await params;
        const body = await request.json();

        console.log('🔄 API: Actualizando lead', leadId, 'con datos:', body);

        const supabase = await createClient();

        // Verificar autenticación
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
        }

        // Obtener información del agente actual
        let agentData = null;
        const { data: agent, error: agentError } = await supabase
            .from('prosocial_agents')
            .select('id, nombre, email')
            .eq('email', user.email)
            .single();

        if (agentError) {
            console.warn('⚠️ API: Error buscando agente:', agentError);
        } else {
            agentData = agent;
        }

        // Preparar datos de actualización
        const updateData: Record<string, unknown> = {
            updatedAt: new Date().toISOString()
        };

        // Solo actualizar campos que se proporcionan
        if (body.etapaId !== undefined) {
            updateData.etapaId = body.etapaId;
        }

        if (agentData && body.assignAgent !== false) {
            updateData.agentId = agentData.id;
        }

        console.log('🔄 API: Datos de actualización:', updateData);

        // Actualizar el lead
        const { data: leadData, error: leadError } = await supabase
            .from('prosocial_leads')
            .update(updateData)
            .eq('id', leadId)
            .select();

        if (leadError) {
            console.error('❌ API: Error actualizando lead:', leadError);
            return NextResponse.json({ error: 'Error actualizando lead' }, { status: 500 });
        }

        // Crear entrada en la bitácora si hay agente y se cambió la etapa
        if (agentData && body.etapaId !== undefined && body.oldStageId) {
            // Obtener nombres de las etapas
            let oldStageName = 'Sin etapa';
            let newStageName = 'Sin etapa';

            if (body.oldStageId && body.oldStageId !== 'sin-etapa') {
                const { data: oldStage } = await supabase
                    .from('prosocial_pipeline_stages')
                    .select('nombre')
                    .eq('id', body.oldStageId)
                    .single();
                if (oldStage) oldStageName = oldStage.nombre;
            }

            if (body.etapaId && body.etapaId !== 'sin-etapa') {
                const { data: newStage } = await supabase
                    .from('prosocial_pipeline_stages')
                    .select('nombre')
                    .eq('id', body.etapaId)
                    .single();
                if (newStage) newStageName = newStage.nombre;
            }

            const { error: bitacoraError } = await supabase
                .from('prosocial_lead_bitacora')
                .insert({
                    leadId: leadId,
                    tipo: 'cambio_etapa',
                    titulo: 'Cambio de etapa',
                    descripcion: `Lead movido de "${oldStageName}" a "${newStageName}" por el agente ${agentData.nombre}`,
                    metadata: {
                        oldStageId: body.oldStageId,
                        newStageId: body.etapaId,
                        oldStageName,
                        newStageName,
                        agentId: agentData.id,
                        agentName: agentData.nombre
                    },
                    usuarioId: user.id
                });

            if (bitacoraError) {
                console.error('❌ API: Error creando entrada en bitácora:', bitacoraError);
                // No fallar la operación por esto
            }
        }

        console.log('✅ API: Lead actualizado exitosamente:', leadData);

        return NextResponse.json(leadData?.[0] || { success: true });

    } catch (error) {
        console.error('❌ API: Error inesperado:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}