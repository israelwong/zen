"use server";

import { prisma } from "@/lib/prisma";
import { retryDatabaseOperation } from "@/lib/actions/utils/database-retry";
import { revalidatePath } from "next/cache";
import {
    HorarioCreateSchema,
    HorarioUpdateSchema,
    HorariosBulkUpdateSchema,
    HorarioToggleSchema,
    HorariosFiltersSchema,
    type HorarioCreateForm,
    type HorarioUpdateForm,
    type HorariosBulkUpdateForm,
    type HorarioToggleForm,
    type HorariosFiltersForm,
} from "@/lib/actions/schemas/horarios-schemas";

// Obtener horarios del studio
export async function obtenerHorariosStudio(
    studioSlug: string,
    filters?: HorariosFiltersForm
) {
    return await retryDatabaseOperation(async () => {
        // 1. Obtener studio
        const studio = await prisma.studios.findUnique({
            where: { slug: studioSlug },
            select: { id: true, studio_name: true },
        });

        if (!studio) {
            throw new Error("Studio no encontrado");
        }

        // 2. Construir filtros
        const whereClause: {
            studio_id: string;
            activo?: boolean;
            dia_semana?: string;
        } = {
            studio_id: studio.id,
        };

        if (filters) {
            const validatedFilters = HorariosFiltersSchema.parse(filters);

            if (validatedFilters.activo !== undefined) {
                whereClause.activo = validatedFilters.activo;
            }

            if (validatedFilters.dia_semana) {
                whereClause.dia_semana = validatedFilters.dia_semana;
            }
        }

        // 3. Obtener horarios
        const horarios = await prisma.studio_horarios_atencion.findMany({
            where: whereClause,
            orderBy: [
                { dia_semana: "asc" },
                { hora_inicio: "asc" }
            ],
        });

        return horarios;
    });
}

// Crear horario
export async function crearHorario(
    studioSlug: string,
    data: HorarioCreateForm
) {
    return await retryDatabaseOperation(async () => {
        // 1. Obtener studio
        const studio = await prisma.studios.findUnique({
            where: { slug: studioSlug },
            select: { id: true },
        });

        if (!studio) {
            throw new Error("Studio no encontrado");
        }

        // 2. Validar datos
        const validatedData = HorarioCreateSchema.parse(data);

        // 3. Verificar si ya existe un horario para ese día
        const existingHorario = await prisma.studio_horarios_atencion.findUnique({
            where: {
                studio_id_dia_semana: {
                    studio_id: studio.id,
                    dia_semana: validatedData.dia_semana,
                },
            },
        });

        if (existingHorario) {
            throw new Error(`Ya existe un horario configurado para ${validatedData.dia_semana}`);
        }

        // 4. Crear horario
        const nuevoHorario = await prisma.studio_horarios_atencion.create({
            data: {
                studio_id: studio.id,
                dia_semana: validatedData.dia_semana,
                hora_inicio: validatedData.hora_inicio,
                hora_fin: validatedData.hora_fin,
                activo: validatedData.activo,
            },
        });

        // 5. Revalidar cache
        revalidatePath(`/studio/${studioSlug}/configuracion/cuenta/horarios`);

        return nuevoHorario;
    });
}

// Actualizar horario
export async function actualizarHorario(
    horarioId: string,
    data: HorarioUpdateForm
) {
    return await retryDatabaseOperation(async () => {
        // 1. Validar datos
        const validatedData = HorarioUpdateSchema.parse(data);

        // 2. Obtener horario existente
        const existingHorario = await prisma.studio_horarios_atencion.findUnique({
            where: { id: horarioId },
            include: {
                studio: { select: { slug: true } }
            },
        });

        if (!existingHorario) {
            throw new Error("Horario no encontrado");
        }

        // 3. Actualizar horario
        const horarioActualizado = await prisma.studio_horarios_atencion.update({
            where: { id: horarioId },
            data: {
                ...(validatedData.dia_semana && { dia_semana: validatedData.dia_semana }),
                ...(validatedData.hora_inicio && { hora_inicio: validatedData.hora_inicio }),
                ...(validatedData.hora_fin && { hora_fin: validatedData.hora_fin }),
                ...(validatedData.activo !== undefined && { activo: validatedData.activo }),
            },
        });

        // 4. Revalidar cache
        revalidatePath(`/studio/${existingHorario.studio.slug}/configuracion/cuenta/horarios`);

        return horarioActualizado;
    });
}

// Actualizar múltiples horarios
export async function actualizarHorariosBulk(
    studioSlug: string,
    data: HorariosBulkUpdateForm
) {
    return await retryDatabaseOperation(async () => {
        // 1. Obtener studio
        const studio = await prisma.studios.findUnique({
            where: { slug: studioSlug },
            select: { id: true },
        });

        if (!studio) {
            throw new Error("Studio no encontrado");
        }

        // 2. Validar datos
        const validatedData = HorariosBulkUpdateSchema.parse(data);

        // 3. Actualizar todos los horarios en una transacción
        const resultados = await prisma.$transaction(
            validatedData.horarios.map((horario) =>
                prisma.studio_horarios_atencion.update({
                    where: { id: horario.id },
                    data: {
                        ...(horario.dia_semana && { dia_semana: horario.dia_semana }),
                        ...(horario.hora_inicio && { hora_inicio: horario.hora_inicio }),
                        ...(horario.hora_fin && { hora_fin: horario.hora_fin }),
                        ...(horario.activo !== undefined && { activo: horario.activo }),
                    },
                })
            )
        );

        // 4. Revalidar cache
        revalidatePath(`/studio/${studioSlug}/configuracion/cuenta/horarios`);

        return resultados;
    });
}

// Toggle estado de horario
export async function toggleHorarioEstado(
    horarioId: string,
    data: HorarioToggleForm
) {
    return await retryDatabaseOperation(async () => {
        // 1. Validar datos
        const validatedData = HorarioToggleSchema.parse(data);

        // 2. Obtener horario existente
        const existingHorario = await prisma.studio_horarios_atencion.findUnique({
            where: { id: horarioId },
            include: {
                studio: { select: { slug: true } }
            },
        });

        if (!existingHorario) {
            throw new Error("Horario no encontrado");
        }

        // 3. Actualizar estado
        const horarioActualizado = await prisma.studio_horarios_atencion.update({
            where: { id: horarioId },
            data: { activo: validatedData.activo },
        });

        // 4. Revalidar cache
        revalidatePath(`/studio/${existingHorario.studio.slug}/configuracion/cuenta/horarios`);

        return horarioActualizado;
    });
}

// Eliminar horario
export async function eliminarHorario(horarioId: string) {
    return await retryDatabaseOperation(async () => {
        // 1. Obtener horario existente
        const existingHorario = await prisma.studio_horarios_atencion.findUnique({
            where: { id: horarioId },
            include: {
                studio: { select: { slug: true } }
            },
        });

        if (!existingHorario) {
            throw new Error("Horario no encontrado");
        }

        // 2. Eliminar horario
        await prisma.studio_horarios_atencion.delete({
            where: { id: horarioId },
        });

        // 3. Revalidar cache
        revalidatePath(`/studio/${existingHorario.studio.slug}/configuracion/cuenta/horarios`);

        return { success: true };
    });
}

// Obtener estadísticas de horarios
export async function obtenerEstadisticasHorarios(studioSlug: string) {
    return await retryDatabaseOperation(async () => {
        // 1. Obtener studio
        const studio = await prisma.studios.findUnique({
            where: { slug: studioSlug },
            select: { id: true },
        });

        if (!studio) {
            throw new Error("Studio no encontrado");
        }

        // 2. Obtener estadísticas
        const [total, activos, inactivos] = await Promise.all([
            prisma.studio_horarios_atencion.count({
                where: { studio_id: studio.id },
            }),
            prisma.studio_horarios_atencion.count({
                where: { studio_id: studio.id, activo: true },
            }),
            prisma.studio_horarios_atencion.count({
                where: { studio_id: studio.id, activo: false },
            }),
        ]);

        // 3. Obtener horarios por día
        const horariosPorDia = await prisma.studio_horarios_atencion.findMany({
            where: { studio_id: studio.id },
            select: { dia_semana: true, activo: true },
        });

        const diasConfigurados = horariosPorDia.length;
        const diasActivos = horariosPorDia.filter(h => h.activo).length;

        return {
            total,
            activos,
            inactivos,
            diasConfigurados,
            diasActivos,
            porcentajeActivos: total > 0 ? Math.round((activos / total) * 100) : 0,
            porcentajeDiasActivos: diasConfigurados > 0 ? Math.round((diasActivos / diasConfigurados) * 100) : 0,
        };
    });
}

// Inicializar horarios por defecto
export async function inicializarHorariosPorDefecto(studioSlug: string) {
    return await retryDatabaseOperation(async () => {
        // 1. Obtener studio
        const studio = await prisma.studios.findUnique({
            where: { slug: studioSlug },
            select: { id: true },
        });

        if (!studio) {
            throw new Error("Studio no encontrado");
        }

        // 2. Verificar si ya tiene horarios configurados
        const existingHorarios = await prisma.studio_horarios_atencion.count({
            where: { studio_id: studio.id },
        });

        if (existingHorarios > 0) {
            // Si ya tiene horarios, retornar éxito sin crear nuevos
            return {
                success: true,
                message: "El studio ya tiene horarios configurados",
                data: { horariosExistentes: existingHorarios }
            };
        }

        // 3. Crear horarios por defecto
        const horariosPorDefecto = [
            { dia_semana: "lunes", hora_inicio: "09:00", hora_fin: "18:00", activo: true },
            { dia_semana: "martes", hora_inicio: "09:00", hora_fin: "18:00", activo: true },
            { dia_semana: "miercoles", hora_inicio: "09:00", hora_fin: "18:00", activo: true },
            { dia_semana: "jueves", hora_inicio: "09:00", hora_fin: "18:00", activo: true },
            { dia_semana: "viernes", hora_inicio: "09:00", hora_fin: "18:00", activo: true },
            { dia_semana: "sabado", hora_inicio: "10:00", hora_fin: "16:00", activo: true },
            { dia_semana: "domingo", hora_inicio: "10:00", hora_fin: "14:00", activo: false },
        ];

        const horariosCreados = await prisma.$transaction(
            horariosPorDefecto.map((horario) =>
                prisma.studio_horarios_atencion.create({
                    data: {
                        studio_id: studio.id,
                        ...horario,
                    },
                })
            )
        );

        // 4. Revalidar cache
        revalidatePath(`/studio/${studioSlug}/configuracion/cuenta/horarios`);

        return {
            success: true,
            message: "Horarios inicializados exitosamente",
            data: horariosCreados
        };
    });
}

// Nota: La zona horaria se maneja a nivel de plataforma, no por proyecto individual
// Si necesitas esta funcionalidad, deberías actualizar platform_config en lugar de projects
