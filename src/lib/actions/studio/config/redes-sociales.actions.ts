"use server";

import { prisma } from "@/lib/prisma";
import { retryDatabaseOperation } from "@/lib/actions/utils/database-retry";
import { revalidatePath } from "next/cache";
import {
  RedSocialCreateSchema,
  RedSocialUpdateSchema,
  RedSocialBulkUpdateSchema,
  RedSocialToggleSchema,
  RedSocialFiltersSchema,
  type RedSocialCreateForm,
  type RedSocialUpdateForm,
  type RedSocialBulkUpdateForm,
  type RedSocialToggleForm,
  type RedSocialFiltersForm,
} from "@/lib/actions/schemas/redes-sociales-schemas";

// Obtener redes sociales del studio
export async function obtenerRedesSocialesStudio(
  studioSlug: string,
  filters?: RedSocialFiltersForm
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
      plataformaId?: string;
    } = {
      studio_id: studio.id,
    };

    if (filters) {
      const validatedFilters = RedSocialFiltersSchema.parse(filters);

      if (validatedFilters.activo !== undefined) {
        whereClause.activo = validatedFilters.activo;
      }

      if (validatedFilters.plataformaId) {
        whereClause.plataformaId = validatedFilters.plataformaId;
      }
    }

    // 3. Obtener redes sociales
    const redesSociales = await prisma.studio_redes_sociales.findMany({
      where: whereClause,
      include: {
        plataforma: true,
      },
      orderBy: { order: "asc" },
    });

    return redesSociales;
  });
}

// Crear red social
export async function crearRedSocial(
  studioSlug: string,
  data: RedSocialCreateForm
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
    const validatedData = RedSocialCreateSchema.parse(data);

    // 3. Obtener información de la plataforma y verificar duplicados
    const plataforma = await prisma.platform_social_networks.findUnique({
      where: { id: validatedData.plataformaId },
      select: { id: true, name: true }
    });

    if (!plataforma) {
      throw new Error("Plataforma de red social no encontrada");
    }

    const existingRed = await prisma.studio_redes_sociales.findFirst({
      where: {
        studio_id: studio.id,
        plataforma_id: validatedData.plataformaId,
        activo: true,
      },
    });

    if (existingRed) {
      throw new Error(`Ya tienes una cuenta activa de ${plataforma.name}. Puedes editarla o desactivarla para crear una nueva.`);
    }

    // 4. Crear red social
    const nuevaRedSocial = await prisma.studio_redes_sociales.create({
      data: {
        studio_id: studio.id,
        plataforma_id: validatedData.plataformaId,
        url: validatedData.url,
        activo: validatedData.activo,
      },
      include: {
        plataforma: true,
      },
    });

    // 5. Revalidar cache
    revalidatePath(`/studio/${studioSlug}/configuracion/cuenta/redes-sociales`);

    return nuevaRedSocial;
  });
}

// Actualizar red social
export async function actualizarRedSocial(
  redSocialId: string,
  data: RedSocialUpdateForm
) {
  return await retryDatabaseOperation(async () => {
    // 1. Validar datos
    const validatedData = RedSocialUpdateSchema.parse(data);

    // 2. Obtener red social existente
    const existingRedSocial = await prisma.studio_redes_sociales.findUnique({
      where: { id: redSocialId },
      include: {
        studio: { select: { slug: true } },
        plataforma: true
      },
    });

    if (!existingRedSocial) {
      throw new Error("La red social que intentas actualizar no existe o no tienes permisos para modificarla");
    }

    // 3. Actualizar red social
    const redSocialActualizada = await prisma.studio_redes_sociales.update({
      where: { id: redSocialId },
      data: {
        ...(validatedData.url && { url: validatedData.url }),
        ...(validatedData.activo !== undefined && { activo: validatedData.activo }),
      },
      include: {
        plataforma: true,
      },
    });

    // 4. Revalidar cache
    revalidatePath(`/studio/${existingRedSocial.studio.slug}/configuracion/cuenta/redes-sociales`);

    return redSocialActualizada;
  });
}

// Actualizar múltiples redes sociales
export async function actualizarRedesSocialesBulk(
  studioSlug: string,
  data: RedSocialBulkUpdateForm
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
    const validatedData = RedSocialBulkUpdateSchema.parse(data);

    // 3. Validar todas las URLs
    for (const red of validatedData.redesSociales) {
      if (red.url) {
        try {
          new URL(red.url);
        } catch {
          throw new Error(`La URL de tu red social no es válida. Por favor verifica que esté completa y correcta.`);
        }
      }
    }

    // 4. Actualizar todas las redes sociales en una transacción
    const resultados = await prisma.$transaction(
      validatedData.redesSociales.map((red) =>
        prisma.studio_redes_sociales.update({
          where: { id: red.id },
          data: {
            ...(red.url && { url: red.url }),
            ...(red.activo !== undefined && { activo: red.activo }),
          },
          include: {
            plataforma: true,
          },
        })
      )
    );

    // 5. Revalidar cache
    revalidatePath(`/studio/${studioSlug}/configuracion/cuenta/redes-sociales`);

    return resultados;
  });
}

// Eliminar red social
export async function eliminarRedSocial(redSocialId: string) {
  return await retryDatabaseOperation(async () => {
    // 1. Obtener red social existente
    const existingRedSocial = await prisma.studio_redes_sociales.findUnique({
      where: { id: redSocialId },
      include: {
        studio: { select: { slug: true } },
        plataforma: true
      },
    });

    if (!existingRedSocial) {
      throw new Error("La red social que intentas eliminar no existe o no tienes permisos para eliminarla");
    }

    // 2. Eliminar red social
    await prisma.studio_redes_sociales.delete({
      where: { id: redSocialId },
    });

    // 3. Revalidar cache
    revalidatePath(`/studio/${existingRedSocial.studio.slug}/configuracion/cuenta/redes-sociales`);

    return { success: true };
  });
}

// Toggle estado de red social
export async function toggleRedSocialEstado(
  redSocialId: string,
  data: RedSocialToggleForm
) {
  return await retryDatabaseOperation(async () => {
    // 1. Validar datos
    const validatedData = RedSocialToggleSchema.parse(data);

    // 2. Obtener red social existente
    const existingRedSocial = await prisma.studio_redes_sociales.findUnique({
      where: { id: redSocialId },
      include: {
        studio: { select: { slug: true } },
        plataforma: true
      },
    });

    if (!existingRedSocial) {
      throw new Error("Red social no encontrada");
    }

    // 3. Actualizar estado
    const redSocialActualizada = await prisma.studio_redes_sociales.update({
      where: { id: redSocialId },
      data: { activo: validatedData.activo },
      include: {
        plataforma: true,
      },
    });

    // 4. Revalidar cache
    revalidatePath(`/studio/${existingRedSocial.studio.slug}/configuracion/cuenta/redes-sociales`);

    return redSocialActualizada;
  });
}

// Obtener estadísticas de redes sociales
export async function obtenerEstadisticasRedesSociales(studioSlug: string) {
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
    const [total, activas, inactivas] = await Promise.all([
      prisma.studio_redes_sociales.count({
        where: { studio_id: studio.id },
      }),
      prisma.studio_redes_sociales.count({
        where: { studio_id: studio.id, activo: true },
      }),
      prisma.studio_redes_sociales.count({
        where: { studio_id: studio.id, activo: false },
      }),
    ]);

    return {
      total,
      activas,
      inactivas,
      porcentajeActivas: total > 0 ? Math.round((activas / total) * 100) : 0,
    };
  });
}

// Reordenar redes sociales
export async function reordenarRedesSociales(studioSlug: string, redes: Array<{ id: string; order: number }>) {
  return await retryDatabaseOperation(async () => {
    // 1. Verificar que el studio existe
    const studio = await prisma.studios.findUnique({
      where: { slug: studioSlug },
      select: { id: true },
    });

    if (!studio) {
      throw new Error("Studio no encontrado");
    }

    // 2. Actualizar el orden de cada red social
    const updatePromises = redes.map(({ id, order }) =>
      prisma.studio_redes_sociales.update({
        where: {
          id,
          studio_id: studio.id // Asegurar que pertenece al studio
        },
        data: { order },
      })
    );

    await Promise.all(updatePromises);

    // 3. Revalidar la página
    revalidatePath(`/studio/${studioSlug}/configuracion/estudio/redes-sociales`);

    return {
      success: true,
      message: "Orden de redes sociales actualizado exitosamente",
    };
  });
}