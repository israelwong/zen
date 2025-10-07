"use server";

import { prisma } from "@/lib/prisma";
import { retryDatabaseOperation } from "@/lib/actions/utils/database-retry";
import { PlataformaSchema, type PlataformaForm } from "@/lib/actions/schemas/redes-sociales-schemas";

// Obtener todas las plataformas de redes sociales
export async function obtenerPlataformasRedesSociales() {
  return await retryDatabaseOperation(async () => {
    // Obtener plataformas
    const plataformas = await prisma.platform_social_networks.findMany({
      orderBy: { order: "asc" },
    });

    return plataformas;
  });
}

// Obtener plataforma por ID
export async function obtenerPlataformaPorId(plataformaId: string) {
  return await retryDatabaseOperation(async () => {
    // Obtener plataforma
    const plataforma = await prisma.platform_social_networks.findUnique({
      where: { id: plataformaId },
    });

    if (!plataforma) {
      throw new Error("Plataforma no encontrada");
    }

    return plataforma;
  });
}

// Crear plataforma (solo para super admin - por ahora sin validación de permisos)
export async function crearPlataformaRedSocial(data: PlataformaForm) {
  return await retryDatabaseOperation(async () => {
    // 1. Validar datos
    const validatedData = PlataformaSchema.parse(data);

    // 2. Verificar que el slug no existe
    const existingPlataforma = await prisma.platform_social_networks.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existingPlataforma) {
      throw new Error("El slug ya existe");
    }

    // 3. Crear plataforma
    const plataforma = await prisma.platform_social_networks.create({
      data: validatedData,
    });

    return plataforma;
  });
}

// Actualizar plataforma (solo para super admin - por ahora sin validación de permisos)
export async function actualizarPlataformaRedSocial(
  plataformaId: string,
  data: Partial<PlataformaForm>
) {
  return await retryDatabaseOperation(async () => {
    // 1. Verificar que la plataforma existe
    const existingPlataforma = await prisma.platform_social_networks.findUnique({
      where: { id: plataformaId },
    });

    if (!existingPlataforma) {
      throw new Error("Plataforma no encontrada");
    }

    // 2. Validar datos
    const validatedData = PlataformaSchema.partial().parse(data);

    // 3. Actualizar plataforma
    const plataforma = await prisma.platform_social_networks.update({
      where: { id: plataformaId },
      data: validatedData,
    });

    return plataforma;
  });
}

// Eliminar plataforma (solo para super admin - por ahora sin validación de permisos)
export async function eliminarPlataformaRedSocial(plataformaId: string) {
  return await retryDatabaseOperation(async () => {
    // 1. Verificar que la plataforma existe
    const existingPlataforma = await prisma.platform_social_networks.findUnique({
      where: { id: plataformaId },
      include: {
        _count: {
          select: {
            project_redes_sociales: true,
          },
        },
      },
    });

    if (!existingPlataforma) {
      throw new Error("Plataforma no encontrada");
    }

    // 2. Verificar que no hay redes sociales asociadas
    if (existingPlataforma._count.project_redes_sociales > 0) {
      throw new Error("No se puede eliminar una plataforma que tiene redes sociales asociadas");
    }

    // 3. Eliminar plataforma
    await prisma.platform_social_networks.delete({
      where: { id: plataformaId },
    });

    return { success: true };
  });
}