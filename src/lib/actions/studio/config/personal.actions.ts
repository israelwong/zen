'use server';

import { prisma } from '@/lib/prisma';
import {
    createPersonalSchema,
    updatePersonalSchema,
    createCategoriaPersonalSchema,
    updateCategoriaPersonalSchema,
    updateOrdenCategoriasSchema,
    createPerfilPersonalSchema,
    updatePerfilPersonalSchema,
    updateOrdenPerfilesSchema,
    type PersonalListResponse,
    type CategoriaPersonalListResponse,
    type PersonalResponse,
    type CategoriaPersonalResponse
} from '@/lib/actions/schemas/personal-schemas';

// =============================================================================
// SERVER ACTIONS PARA PERSONAL
// =============================================================================

/**
 * Obtener todo el personal de un proyecto
 */
export async function obtenerPersonal(studioSlug: string): Promise<PersonalListResponse> {
    try {
        // Buscar el proyecto por slug
        const studio = await prisma.studios.findUnique({
            where: { slug: studioSlug },
            select: { id: true }
        });

        if (!studio) {
            return { success: false, error: 'Proyecto no encontrado' };
        }

        const personal = await prisma.studio_personal.findMany({
            where: { studio_id: studio.id },
            include: {
                categoria: {
                    select: {
                        id: true,
                        nombre: true,
                        tipo: true,
                        color: true,
                        icono: true
                    }
                },
                platformUser: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        avatarUrl: true
                    }
                }
            },
            orderBy: [
                { categoria: { orden: 'asc' } },
                { orden: 'asc' },
                { nombre: 'asc' }
            ]
        });

        return { success: true, data: personal };
    } catch (error) {
        console.error('Error al obtener personal:', error);
        return { success: false, error: 'Error interno del servidor' };
    }
}

/**
 * Crear nuevo personal
 */
export async function crearPersonal(
    studioSlug: string,
    data: Record<string, unknown>
): Promise<PersonalResponse> {
    try {
        // Validar datos
        const validatedData = createPersonalSchema.parse(data);

        // Buscar el proyecto por slug
        const studio = await prisma.studios.findUnique({
            where: { slug: studioSlug },
            select: { id: true }
        });

        if (!studio) {
            return { success: false, error: 'Proyecto no encontrado' };
        }

        // Verificar que la categoría existe y pertenece al proyecto
        const categoria = await prisma.studio_categorias_personal.findFirst({
            where: {
                id: validatedData.categoriaId,
                studio_id: studio.id
            }
        });

        if (!categoria) {
            return { success: false, error: 'Categoría no encontrada' };
        }

        // Extraer perfilesIds antes de crear el personal
        const { perfilesIds, ...personalDataWithoutProfiles } = validatedData;

        // Crear personal - mapear campos exactamente como están en Prisma
        const personal = await prisma.studio_personal.create({
            data: {
                // Campos requeridos
                nombre: personalDataWithoutProfiles.nombre,
                studio_id: studio.id,
                categoriaId: personalDataWithoutProfiles.categoriaId,
                tipo: personalDataWithoutProfiles.tipo || categoria.tipo,
                status: personalDataWithoutProfiles.status || 'activo',

                // Campos opcionales - solo incluir si tienen valor
                ...(personalDataWithoutProfiles.email && personalDataWithoutProfiles.email !== '' && { email: personalDataWithoutProfiles.email }),
                ...(personalDataWithoutProfiles.telefono && personalDataWithoutProfiles.telefono !== '' && { telefono: personalDataWithoutProfiles.telefono }),
                ...(personalDataWithoutProfiles.telefono_emergencia && personalDataWithoutProfiles.telefono_emergencia !== '' && { telefono_emergencia: personalDataWithoutProfiles.telefono_emergencia }),
                ...(personalDataWithoutProfiles.cuenta_clabe && personalDataWithoutProfiles.cuenta_clabe !== '' && { cuenta_clabe: personalDataWithoutProfiles.cuenta_clabe }),
                ...(personalDataWithoutProfiles.platformUserId && { platformUserId: personalDataWithoutProfiles.platformUserId }),
                ...(personalDataWithoutProfiles.honorarios_fijos !== undefined && { honorarios_fijos: personalDataWithoutProfiles.honorarios_fijos }),
                ...(personalDataWithoutProfiles.honorarios_variables !== undefined && { honorarios_variables: personalDataWithoutProfiles.honorarios_variables }),
                ...(personalDataWithoutProfiles.orden !== undefined && { orden: personalDataWithoutProfiles.orden })
            },
            include: {
                categoria: {
                    select: {
                        id: true,
                        nombre: true,
                        tipo: true,
                        color: true,
                        icono: true
                    }
                },
                platformUser: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        avatarUrl: true
                    }
                }
            }
        });

        // Si hay perfiles asociados, crearlos
        if (perfilesIds && perfilesIds.length > 0) {
            await prisma.studio_personal_profile_assignments.createMany({
                data: perfilesIds.map(perfilId => ({
                    personalId: personal.id,
                    perfilId: perfilId
                }))
            });
        }

        return { success: true, data: personal };
    } catch (error) {
        console.error('Error al crear personal:', error);
        if (error instanceof Error && error.name === 'ZodError') {
            return { success: false, error: 'Datos de entrada inválidos' };
        }
        return { success: false, error: 'Error interno del servidor' };
    }
}

/**
 * Actualizar personal existente
 */
export async function actualizarPersonal(
    studioSlug: string,
    personalId: string,
    data: Record<string, unknown>
): Promise<PersonalResponse> {
    try {
        // Validar datos
        const validatedData = updatePersonalSchema.parse({ ...data, id: personalId });

        // Buscar el proyecto por slug
        const studio = await prisma.studios.findUnique({
            where: { slug: studioSlug },
            select: { id: true }
        });

        if (!studio) {
            return { success: false, error: 'Proyecto no encontrado' };
        }

        // Verificar que el personal existe y pertenece al proyecto
        const existingPersonal = await prisma.studio_personal.findFirst({
            where: {
                id: personalId,
                studio_id: studio.id
            }
        });

        if (!existingPersonal) {
            return { success: false, error: 'Personal no encontrado' };
        }

        // Si se está cambiando la categoría, verificar que existe
        if (validatedData.categoriaId) {
            const categoria = await prisma.studio_categorias_personal.findFirst({
                where: {
                    id: validatedData.categoriaId,
                    studio_id: studio.id
                }
            });

            if (!categoria) {
                return { success: false, error: 'Categoría no encontrada' };
            }
        }

        // Extraer perfilesIds antes de actualizar el personal
        const { perfilesIds, ...personalDataWithoutProfiles } = validatedData;

        // Actualizar personal - mapear campos exactamente como están en Prisma
        const updateData: Record<string, unknown> = {};

        // Solo incluir campos que tienen valores definidos
        if (personalDataWithoutProfiles.nombre !== undefined) updateData.nombre = personalDataWithoutProfiles.nombre;
        if (personalDataWithoutProfiles.categoriaId !== undefined) updateData.categoriaId = personalDataWithoutProfiles.categoriaId;
        if (personalDataWithoutProfiles.tipo !== undefined) updateData.tipo = personalDataWithoutProfiles.tipo;
        if (personalDataWithoutProfiles.status !== undefined) updateData.status = personalDataWithoutProfiles.status;
        if (personalDataWithoutProfiles.email !== undefined) updateData.email = personalDataWithoutProfiles.email || null;
        if (personalDataWithoutProfiles.telefono !== undefined) updateData.telefono = personalDataWithoutProfiles.telefono || null;
        if (personalDataWithoutProfiles.telefono_emergencia !== undefined) updateData.telefono_emergencia = personalDataWithoutProfiles.telefono_emergencia || null;
        if (personalDataWithoutProfiles.cuenta_clabe !== undefined) updateData.cuenta_clabe = personalDataWithoutProfiles.cuenta_clabe || null;
        if (personalDataWithoutProfiles.platformUserId !== undefined) updateData.platformUserId = personalDataWithoutProfiles.platformUserId || null;
        if (personalDataWithoutProfiles.honorarios_fijos !== undefined) updateData.honorarios_fijos = personalDataWithoutProfiles.honorarios_fijos;
        if (personalDataWithoutProfiles.honorarios_variables !== undefined) updateData.honorarios_variables = personalDataWithoutProfiles.honorarios_variables;
        if (personalDataWithoutProfiles.orden !== undefined) updateData.orden = personalDataWithoutProfiles.orden;

        const personal = await prisma.studio_personal.update({
            where: { id: personalId },
            data: updateData,
            include: {
                categoria: {
                    select: {
                        id: true,
                        nombre: true,
                        tipo: true,
                        color: true,
                        icono: true
                    }
                },
                platformUser: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        avatarUrl: true
                    }
                }
            }
        });

        // Actualizar perfiles asociados si se proporcionaron
        if (perfilesIds !== undefined) {
            // Eliminar perfiles existentes
            await prisma.studio_personal_profile_assignments.deleteMany({
                where: { personalId: personalId }
            });

            // Crear nuevos perfiles si hay alguno
            if (perfilesIds.length > 0) {
                await prisma.studio_personal_profile_assignments.createMany({
                    data: perfilesIds.map(perfilId => ({
                        personalId: personalId,
                        perfilId: perfilId
                    }))
                });
            }
        }

        return { success: true, data: personal };
    } catch (error) {
        console.error('Error al actualizar personal:', error);
        if (error instanceof Error && error.name === 'ZodError') {
            return { success: false, error: 'Datos de entrada inválidos' };
        }
        return { success: false, error: 'Error interno del servidor' };
    }
}

/**
 * Eliminar personal
 */
export async function eliminarPersonal(
    studioSlug: string,
    personalId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Buscar el proyecto por slug
        const studio = await prisma.studios.findUnique({
            where: { slug: studioSlug },
            select: { id: true }
        });

        if (!studio) {
            return { success: false, error: 'Proyecto no encontrado' };
        }

        // Verificar que el personal existe y pertenece al proyecto
        const existingPersonal = await prisma.studio_personal.findFirst({
            where: {
                id: personalId,
                studio_id: studio.id
            }
        });

        if (!existingPersonal) {
            return { success: false, error: 'Personal no encontrado' };
        }

        // Eliminar personal
        await prisma.studio_personal.delete({
            where: { id: personalId }
        });

        return { success: true };
    } catch (error) {
        console.error('Error al eliminar personal:', error);
        return { success: false, error: 'Error interno del servidor' };
    }
}

// =============================================================================
// SERVER ACTIONS PARA CATEGORÍAS DE PERSONAL
// =============================================================================

/**
 * Obtener categorías de personal de un proyecto
 */
export async function obtenerCategoriasPersonal(studioSlug: string): Promise<CategoriaPersonalListResponse> {
    try {
        // Buscar el proyecto por slug
        const studio = await prisma.studios.findUnique({
            where: { slug: studioSlug },
            select: { id: true }
        });

        if (!studio) {
            return { success: false, error: 'Proyecto no encontrado' };
        }

        const categorias = await prisma.studio_categorias_personal.findMany({
            where: { studio_id: studio.id },
            include: {
                _count: {
                    select: {
                        personal: true
                    }
                }
            },
            orderBy: [
                { tipo: 'asc' },
                { orden: 'asc' },
                { nombre: 'asc' }
            ]
        });

        return { success: true, data: categorias };
    } catch (error) {
        console.error('Error al obtener categorías de personal:', error);
        return { success: false, error: 'Error interno del servidor' };
    }
}

/**
 * Crear nueva categoría de personal
 */
export async function crearCategoriaPersonal(
    studioSlug: string,
    data: Record<string, unknown>
): Promise<CategoriaPersonalResponse> {
    try {
        // Validar datos
        const validatedData = createCategoriaPersonalSchema.parse(data);

        // Buscar el proyecto por slug
        const studio = await prisma.studios.findUnique({
            where: { slug: studioSlug },
            select: { id: true }
        });

        if (!studio) {
            return { success: false, error: 'Proyecto no encontrado' };
        }

        // Verificar que no existe una categoría con el mismo nombre
        const existingCategoria = await prisma.studio_categorias_personal.findFirst({
            where: {
                studio_id: studio.id,
                nombre: validatedData.nombre
            }
        });

        if (existingCategoria) {
            return { success: false, error: 'Ya existe una categoría con este nombre' };
        }

        // Crear categoría
        const categoria = await prisma.studio_categorias_personal.create({
            data: {
                ...validatedData,
                studio_id: studio.id,
                descripcion: validatedData.descripcion || null,
                color: validatedData.color || null,
                icono: validatedData.icono || null
            },
            include: {
                _count: {
                    select: {
                        personal: true
                    }
                }
            }
        });

        return { success: true, data: categoria };
    } catch (error) {
        console.error('Error al crear categoría de personal:', error);
        if (error instanceof Error && error.name === 'ZodError') {
            return { success: false, error: 'Datos de entrada inválidos' };
        }
        return { success: false, error: 'Error interno del servidor' };
    }
}

/**
 * Actualizar categoría de personal
 */
export async function actualizarCategoriaPersonal(
    studioSlug: string,
    categoriaId: string,
    data: Record<string, unknown>
): Promise<CategoriaPersonalResponse> {
    try {
        // Validar datos
        const validatedData = updateCategoriaPersonalSchema.parse({ ...data, id: categoriaId });

        // Buscar el proyecto por slug
        const studio = await prisma.studios.findUnique({
            where: { slug: studioSlug },
            select: { id: true }
        });

        if (!studio) {
            return { success: false, error: 'Proyecto no encontrado' };
        }

        // Verificar que la categoría existe y pertenece al proyecto
        const existingCategoria = await prisma.studio_categorias_personal.findFirst({
            where: {
                id: categoriaId,
                studio_id: studio.id
            }
        });

        if (!existingCategoria) {
            return { success: false, error: 'Categoría no encontrada' };
        }

        // Si se está cambiando el nombre, verificar que no existe otra con el mismo nombre
        if (validatedData.nombre && validatedData.nombre !== existingCategoria.nombre) {
            const duplicateCategoria = await prisma.studio_categorias_personal.findFirst({
                where: {
                    studio_id: studio.id,
                    nombre: validatedData.nombre,
                    id: { not: categoriaId }
                }
            });

            if (duplicateCategoria) {
                return { success: false, error: 'Ya existe una categoría con este nombre' };
            }
        }

        // Actualizar categoría
        const categoria = await prisma.studio_categorias_personal.update({
            where: { id: categoriaId },
            data: {
                ...validatedData,
                descripcion: validatedData.descripcion || null,
                color: validatedData.color || null,
                icono: validatedData.icono || null
            },
            include: {
                _count: {
                    select: {
                        personal: true
                    }
                }
            }
        });

        return { success: true, data: categoria };
    } catch (error) {
        console.error('Error al actualizar categoría de personal:', error);
        if (error instanceof Error && error.name === 'ZodError') {
            return { success: false, error: 'Datos de entrada inválidos' };
        }
        return { success: false, error: 'Error interno del servidor' };
    }
}

/**
 * Eliminar categoría de personal
 */
export async function eliminarCategoriaPersonal(
    studioSlug: string,
    categoriaId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Buscar el proyecto por slug
        const studio = await prisma.studios.findUnique({
            where: { slug: studioSlug },
            select: { id: true }
        });

        if (!studio) {
            return { success: false, error: 'Proyecto no encontrado' };
        }

        // Verificar que la categoría existe y pertenece al proyecto
        const existingCategoria = await prisma.studio_categorias_personal.findFirst({
            where: {
                id: categoriaId,
                studio_id: studio.id
            },
            include: {
                _count: {
                    select: {
                        personal: true
                    }
                }
            }
        });

        if (!existingCategoria) {
            return { success: false, error: 'Categoría no encontrada' };
        }

        // Verificar que no hay personal asignado a esta categoría
        if (existingCategoria._count.personal > 0) {
            return { success: false, error: 'No se puede eliminar una categoría que tiene personal asignado' };
        }

        // No permitir eliminar categorías del sistema
        if (existingCategoria.esDefault) {
            return { success: false, error: 'No se puede eliminar una categoría del sistema' };
        }

        // Eliminar categoría
        await prisma.studio_categorias_personal.delete({
            where: { id: categoriaId }
        });

        return { success: true };
    } catch (error) {
        console.error('Error al eliminar categoría de personal:', error);
        return { success: false, error: 'Error interno del servidor' };
    }
}

/**
 * Actualizar orden de categorías
 */
export async function actualizarOrdenCategoriasPersonal(
    studioSlug: string,
    data: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
    try {
        // Validar datos
        const validatedData = updateOrdenCategoriasSchema.parse(data);

        // Buscar el proyecto por slug
        const studio = await prisma.studios.findUnique({
            where: { slug: studioSlug },
            select: { id: true }
        });

        if (!studio) {
            return { success: false, error: 'Proyecto no encontrado' };
        }

        // Actualizar orden de cada categoría
        await prisma.$transaction(
            validatedData.categorias.map(categoria =>
                prisma.studio_categorias_personal.updateMany({
                    where: {
                        id: categoria.id,
                        studio_id: studio.id
                    },
                    data: {
                        orden: categoria.orden
                    }
                })
            )
        );

        return { success: true };
    } catch (error) {
        console.error('Error al actualizar orden de categorías:', error);
        if (error instanceof Error && error.name === 'ZodError') {
            return { success: false, error: 'Datos de entrada inválidos' };
        }
        return { success: false, error: 'Error interno del servidor' };
    }
}

// =============================================================================
// SERVER ACTIONS PARA PERFILES DE PERSONAL
// =============================================================================

/**
 * Obtener todos los perfiles de personal de un proyecto
 */
export async function obtenerPerfilesPersonal(studioSlug: string) {
    try {
        // Buscar el proyecto por slug
        const studio = await prisma.studios.findUnique({
            where: { slug: studioSlug },
            select: { id: true }
        });

        if (!studio) {
            return { success: false, error: 'Proyecto no encontrado' };
        }

        const perfiles = await prisma.studio_personal_profiles.findMany({
            where: { studio_id: studio.id },
            orderBy: { orden: 'asc' },
            include: {
                _count: {
                    select: {
                        personal_assignments: true
                    }
                }
            }
        });

        return { success: true, data: perfiles };
    } catch (error) {
        console.error('Error al obtener perfiles:', error);
        return { success: false, error: 'Error interno del servidor' };
    }
}

/**
 * Crear un nuevo perfil de personal
 */
export async function crearPerfilPersonal(studioSlug: string, data: Record<string, unknown>) {
    try {
        // Validar datos
        const validatedData = createPerfilPersonalSchema.parse(data);

        // Buscar el proyecto por slug
        const studio = await prisma.studios.findUnique({
            where: { slug: studioSlug },
            select: { id: true }
        });

        if (!studio) {
            return { success: false, error: 'Proyecto no encontrado' };
        }

        const perfil = await prisma.studio_personal_profiles.create({
            data: {
                ...validatedData,
                studio_id: studio.id
            }
        });

        return { success: true, data: perfil };
    } catch (error) {
        console.error('Error al crear perfil:', error);
        if (error instanceof Error && error.name === 'ZodError') {
            return { success: false, error: 'Datos de entrada inválidos' };
        }
        return { success: false, error: 'Error interno del servidor' };
    }
}

/**
 * Actualizar un perfil de personal
 */
export async function actualizarPerfilPersonal(studioSlug: string, perfilId: string, data: Record<string, unknown>) {
    try {
        // Validar datos
        const validatedData = updatePerfilPersonalSchema.parse({ ...data, id: perfilId });

        // Buscar el proyecto por slug
        const studio = await prisma.studios.findUnique({
            where: { slug: studioSlug },
            select: { id: true }
        });

        if (!studio) {
            return { success: false, error: 'Proyecto no encontrado' };
        }

        const perfil = await prisma.studio_personal_profiles.update({
            where: {
                id: perfilId,
                studio_id: studio.id
            },
            data: validatedData
        });

        return { success: true, data: perfil };
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        if (error instanceof Error && error.name === 'ZodError') {
            return { success: false, error: 'Datos de entrada inválidos' };
        }
        return { success: false, error: 'Error interno del servidor' };
    }
}

/**
 * Actualizar orden del personal dentro de una categoría
 */
export async function actualizarOrdenPersonal(
    studioSlug: string,
    personalIds: string[]
): Promise<{ success: boolean; error?: string }> {
    try {
        // Buscar el proyecto por slug
        const studio = await prisma.studios.findUnique({
            where: { slug: studioSlug },
            select: { id: true }
        });

        if (!studio) {
            return { success: false, error: 'Proyecto no encontrado' };
        }

        // Actualizar el orden de cada personal
        await Promise.all(
            personalIds.map((personalId, index) =>
                prisma.studio_personal.update({
                    where: {
                        id: personalId,
                        studio_id: studio.id // Verificar que pertenece al proyecto
                    },
                    data: { orden: index }
                })
            )
        );

        return { success: true };
    } catch (error) {
        console.error('Error al actualizar orden del personal:', error);
        return { success: false, error: 'Error interno del servidor' };
    }
}

/**
 * Actualizar posición de personal (similar a updateServicePosition)
 */
export async function actualizarPosicionPersonal(
    studioSlug: string,
    personalId: string,
    newPosition: number,
    newCategoryId?: string | null
): Promise<{ success: boolean; error?: string }> {
    try {
        const studio = await prisma.studios.findUnique({
            where: { slug: studioSlug },
            select: { id: true }
        });

        if (!studio) {
            return { success: false, error: 'Proyecto no encontrado' };
        }

        // Actualizar el personal con nueva posición y categoría
        const updateData: Record<string, unknown> = {
            orden: newPosition - 1 // Convertir de basado en 1 a basado en 0
        };

        if (newCategoryId !== undefined) {
            updateData.categoriaId = newCategoryId;
        }

        await prisma.studio_personal.update({
            where: {
                id: personalId,
                studio_id: studio.id
            },
            data: updateData
        });

        return { success: true };
    } catch (error) {
        console.error('Error al actualizar posición del personal:', error);
        return { success: false, error: 'Error interno del servidor' };
    }
}

/**
 * Eliminar un perfil de personal
 */
export async function eliminarPerfilPersonal(studioSlug: string, perfilId: string) {
    try {
        // Buscar el proyecto por slug
        const studio = await prisma.studios.findUnique({
            where: { slug: studioSlug },
            select: { id: true }
        });

        if (!studio) {
            return { success: false, error: 'Proyecto no encontrado' };
        }

        await prisma.studio_personal_profiles.delete({
            where: {
                id: perfilId,
                studio_id: studio.id
            }
        });

        return { success: true };
    } catch (error) {
        console.error('Error al eliminar perfil:', error);
        return { success: false, error: 'Error interno del servidor' };
    }
}

/**
 * Actualizar orden de perfiles
 */
export async function actualizarOrdenPerfilesPersonal(studioSlug: string, data: Record<string, unknown>) {
    try {
        // Validar datos
        const validatedData = updateOrdenPerfilesSchema.parse(data);

        // Buscar el proyecto por slug
        const studio = await prisma.studios.findUnique({
            where: { slug: studioSlug },
            select: { id: true }
        });

        if (!studio) {
            return { success: false, error: 'Proyecto no encontrado' };
        }

        // Actualizar orden de cada perfil
        await Promise.all(
            validatedData.perfiles.map((perfil) =>
                prisma.studio_personal_profiles.update({
                    where: {
                        id: perfil.id,
                        studio_id: studio.id
                    },
                    data: { orden: perfil.orden }
                })
            )
        );

        return { success: true };
    } catch (error) {
        console.error('Error al actualizar orden de perfiles:', error);
        if (error instanceof Error && error.name === 'ZodError') {
            return { success: false, error: 'Datos de entrada inválidos' };
        }
        return { success: false, error: 'Error interno del servidor' };
    }
}