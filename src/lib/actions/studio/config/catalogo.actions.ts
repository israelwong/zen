'use server';

import { prisma } from '@/lib/prisma';
import {
    SeccionSchema,
    CategoriaSchema,
    ServicioSchema,
    ActualizarOrdenSeccionesSchema,
    ActualizarOrdenCategoriasSchema,
    type SeccionData,
    type CategoriaData,
    type ServicioData,
    type ActionResponse,
} from '@/lib/actions/schemas/catalogo-schemas';
import { revalidatePath } from 'next/cache';

// =====================================================
// UTILIDADES
// =====================================================

/**
 * Obtener studioId desde el slug
 */
async function getStudioIdFromSlug(slug: string): Promise<string | null> {
    const studio = await prisma.studios.findUnique({
        where: { slug },
        select: { id: true },
    });
    return studio?.id || null;
}

/**
 * Revalidar rutas del catálogo
 */
function revalidateCatalogo(slug: string) {
    revalidatePath(`/studio/${slug}/configuracion/catalogo`);
}

// =====================================================
// SECCIONES
// =====================================================

/**
 * Obtener todas las secciones con categorías y servicios
 */
export async function obtenerCatalogo(
    studioSlug: string
): Promise<ActionResponse<SeccionData[]>> {
    try {
        const studioId = await getStudioIdFromSlug(studioSlug);
        if (!studioId) {
            return { success: false, error: 'Estudio no encontrado' };
        }

        const secciones = await prisma.studio_servicio_secciones.findMany({
            include: {
                seccion_categorias: {
                    include: {
                        servicio_categorias: {
                            include: {
                                servicios: {
                                    where: {
                                        studio_id: studioId,
                                        status: 'active',
                                    },
                                    include: {
                                        servicio_gastos: true,
                                    },
                                    orderBy: { orden: 'asc' },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { orden: 'asc' },
        });

        // Transformar datos a estructura plana
        const catalogoData: SeccionData[] = secciones.map((seccion) => ({
            id: seccion.id,
            nombre: seccion.nombre,
            descripcion: seccion.descripcion,
            orden: seccion.orden,
            createdAt: seccion.created_at,
            updatedAt: seccion.updated_at,
            categorias: seccion.seccion_categorias.map((sc) => ({
                id: sc.servicio_categorias.id,
                nombre: sc.servicio_categorias.nombre,
                orden: sc.servicio_categorias.orden,
                createdAt: sc.servicio_categorias.created_at,
                updatedAt: sc.servicio_categorias.updated_at,
                seccionId: seccion.id,
                servicios: sc.servicio_categorias.servicios.map((s) => ({
                    id: s.id,
                    studioId: s.studio_id,
                    servicioCategoriaId: s.servicio_categoria_id,
                    nombre: s.nombre,
                    costo: s.costo,
                    gasto: s.gasto,
                    tipo_utilidad: s.tipo_utilidad,
                    orden: s.orden,
                    status: s.status,
                    createdAt: s.created_at,
                    updatedAt: s.updated_at,
                    gastos: s.servicio_gastos.map((g) => ({
                        id: g.id,
                        nombre: g.nombre,
                        costo: g.costo,
                    })),
                })),
            })),
        }));

        return { success: true, data: catalogoData };
    } catch (error) {
        console.error('Error obteniendo catálogo:', error);
        return {
            success: false,
            error: 'Error al obtener el catálogo',
        };
    }
}

/**
 * Obtener solo las secciones (sin categorías ni servicios)
 */
export async function obtenerSecciones(): Promise<ActionResponse<SeccionData[]>> {
    try {
        const secciones = await prisma.studio_servicio_secciones.findMany({
            orderBy: { orden: 'asc' },
        });

        const seccionesData: SeccionData[] = secciones.map((s) => ({
            id: s.id,
            nombre: s.nombre,
            descripcion: s.descripcion,
            orden: s.orden,
            createdAt: s.created_at,
            updatedAt: s.updated_at,
            categorias: [],
        }));

        return { success: true, data: seccionesData };
    } catch (error) {
        console.error('Error obteniendo secciones:', error);
        return {
            success: false,
            error: 'Error al obtener las secciones',
        };
    }
}

/**
 * Crear una nueva sección
 */
export async function crearSeccion(
    studioSlug: string,
    data: unknown
): Promise<ActionResponse<SeccionData>> {
    try {
        // Validar datos
        const validatedData = SeccionSchema.parse(data);

        // Obtener el siguiente número de orden
        const ultimaSeccion = await prisma.studio_servicio_secciones.findFirst({
            orderBy: { orden: 'desc' },
            select: { orden: true },
        });

        const nuevoOrden = ultimaSeccion ? ultimaSeccion.orden + 1 : 0;

        // Crear sección
        const seccion = await prisma.studio_servicio_secciones.create({
            data: {
                nombre: validatedData.nombre,
                descripcion: validatedData.descripcion,
                orden: nuevoOrden,
            },
        });

        revalidateCatalogo(studioSlug);

        return {
            success: true,
            data: {
                id: seccion.id,
                nombre: seccion.nombre,
                descripcion: seccion.descripcion,
                orden: seccion.orden,
                createdAt: seccion.created_at,
                updatedAt: seccion.updated_at,
                categorias: [],
            },
        };
    } catch (error) {
        console.error('Error creando sección:', error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : 'Error al crear la sección',
        };
    }
}

/**
 * Actualizar una sección existente
 */
export async function actualizarSeccion(
    studioSlug: string,
    seccionId: string,
    data: unknown
): Promise<ActionResponse<SeccionData>> {
    try {
        // Validar datos (parcial para permitir updates parciales)
        const validatedData = SeccionSchema.partial().parse(data);

        const seccion = await prisma.studio_servicio_secciones.update({
            where: { id: seccionId },
            data: validatedData,
        });

        revalidateCatalogo(studioSlug);

        return {
            success: true,
            data: {
                id: seccion.id,
                nombre: seccion.nombre,
                descripcion: seccion.descripcion,
                orden: seccion.orden,
                createdAt: seccion.created_at,
                updatedAt: seccion.updated_at,
                categorias: [],
            },
        };
    } catch (error) {
        console.error('Error actualizando sección:', error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : 'Error al actualizar la sección',
        };
    }
}

/**
 * Eliminar una sección (solo si no tiene categorías)
 */
export async function eliminarSeccion(
    studioSlug: string,
    seccionId: string
): Promise<ActionResponse<boolean>> {
    try {
        // Verificar si tiene categorías
        const seccion = await prisma.studio_servicio_secciones.findUnique({
            where: { id: seccionId },
            include: {
                seccion_categorias: true,
            },
        });

        if (!seccion) {
            return { success: false, error: 'Sección no encontrada' };
        }

        if (seccion.seccion_categorias.length > 0) {
            return {
                success: false,
                error: 'No se puede eliminar una sección con categorías',
            };
        }

        await prisma.studio_servicio_secciones.delete({
            where: { id: seccionId },
        });

        revalidateCatalogo(studioSlug);

        return { success: true, data: true };
    } catch (error) {
        console.error('Error eliminando sección:', error);
        return {
            success: false,
            error: 'Error al eliminar la sección',
        };
    }
}

/**
 * Actualizar orden de múltiples secciones
 */
export async function actualizarOrdenSecciones(
    studioSlug: string,
    data: unknown
): Promise<ActionResponse<boolean>> {
    try {
        const validatedData = ActualizarOrdenSeccionesSchema.parse(data);

        // Actualizar en batch
        await Promise.all(
            validatedData.secciones.map((seccion) =>
                prisma.studio_servicio_secciones.update({
                    where: { id: seccion.id },
                    data: { orden: seccion.orden },
                })
            )
        );

        revalidateCatalogo(studioSlug);

        return { success: true, data: true };
    } catch (error) {
        console.error('Error actualizando orden de secciones:', error);
        return {
            success: false,
            error: 'Error al actualizar el orden',
        };
    }
}

// =====================================================
// CATEGORÍAS
// =====================================================

/**
 * Obtener todas las categorías
 */
export async function obtenerCategorias(): Promise<ActionResponse<CategoriaData[]>> {
    try {
        const categorias = await prisma.studio_servicio_categorias.findMany({
            include: {
                seccion_categorias: {
                    select: {
                        seccion_id: true,
                    },
                },
            },
            orderBy: { orden: 'asc' },
        });

        const categoriasData: CategoriaData[] = categorias.map((c) => ({
            id: c.id,
            nombre: c.nombre,
            orden: c.orden,
            createdAt: c.created_at,
            updatedAt: c.updated_at,
            seccionId: c.seccion_categorias?.seccion_id,
            servicios: [],
        }));

        return { success: true, data: categoriasData };
    } catch (error) {
        console.error('Error obteniendo categorías:', error);
        return {
            success: false,
            error: 'Error al obtener las categorías',
        };
    }
}

/**
 * Crear una nueva categoría y asignarla a una sección
 */
export async function crearCategoria(
    studioSlug: string,
    data: unknown,
    seccionId: string
): Promise<ActionResponse<CategoriaData>> {
    try {
        const validatedData = CategoriaSchema.parse(data);

        // Obtener el siguiente número de orden
        const ultimaCategoria =
            await prisma.studio_servicio_categorias.findFirst({
                orderBy: { orden: 'desc' },
                select: { orden: true },
            });

        const nuevoOrden = ultimaCategoria ? ultimaCategoria.orden + 1 : 0;

        // Crear categoría con relación a sección
        const categoria = await prisma.studio_servicio_categorias.create({
            data: {
                nombre: validatedData.nombre,
                orden: nuevoOrden,
                seccion_categorias: {
                    create: {
                        seccion_id: seccionId,
                    },
                },
            },
        });

        revalidateCatalogo(studioSlug);

        return {
            success: true,
            data: {
                id: categoria.id,
                nombre: categoria.nombre,
                orden: categoria.orden,
                createdAt: categoria.created_at,
                updatedAt: categoria.updated_at,
                seccionId: seccionId,
                servicios: [],
            },
        };
    } catch (error) {
        console.error('Error creando categoría:', error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : 'Error al crear la categoría',
        };
    }
}

/**
 * Actualizar una categoría existente
 */
export async function actualizarCategoria(
    studioSlug: string,
    categoriaId: string,
    data: unknown
): Promise<ActionResponse<CategoriaData>> {
    try {
        const validatedData = CategoriaSchema.partial().parse(data);

        const categoria = await prisma.studio_servicio_categorias.update({
            where: { id: categoriaId },
            data: validatedData,
            include: {
                seccion_categorias: {
                    select: {
                        seccion_id: true,
                    },
                },
            },
        });

        revalidateCatalogo(studioSlug);

        return {
            success: true,
            data: {
                id: categoria.id,
                nombre: categoria.nombre,
                orden: categoria.orden,
                createdAt: categoria.created_at,
                updatedAt: categoria.updated_at,
                seccionId: categoria.seccion_categorias?.seccion_id,
                servicios: [],
            },
        };
    } catch (error) {
        console.error('Error actualizando categoría:', error);
        return {
            success: false,
            error: 'Error al actualizar la categoría',
        };
    }
}

/**
 * Eliminar una categoría (solo si no tiene servicios)
 */
export async function eliminarCategoria(
    studioSlug: string,
    categoriaId: string
): Promise<ActionResponse<boolean>> {
    try {
        // Verificar si tiene servicios
        const categoria = await prisma.studio_servicio_categorias.findUnique({
            where: { id: categoriaId },
            include: {
                servicios: true,
            },
        });

        if (!categoria) {
            return { success: false, error: 'Categoría no encontrada' };
        }

        if (categoria.servicios.length > 0) {
            return {
                success: false,
                error: 'No se puede eliminar una categoría con servicios',
            };
        }

        // Eliminar categoría (cascade eliminará la relación en project_seccion_categorias)
        await prisma.studio_servicio_categorias.delete({
            where: { id: categoriaId },
        });

        revalidateCatalogo(studioSlug);

        return { success: true, data: true };
    } catch (error) {
        console.error('Error eliminando categoría:', error);
        return {
            success: false,
            error: 'Error al eliminar la categoría',
        };
    }
}

/**
 * Actualizar orden de múltiples categorías
 */
export async function actualizarOrdenCategorias(
    studioSlug: string,
    data: unknown
): Promise<ActionResponse<boolean>> {
    try {
        const validatedData = ActualizarOrdenCategoriasSchema.parse(data);

        await Promise.all(
            validatedData.categorias.map((categoria) =>
                prisma.studio_servicio_categorias.update({
                    where: { id: categoria.id },
                    data: { orden: categoria.orden },
                })
            )
        );

        revalidateCatalogo(studioSlug);

        return { success: true, data: true };
    } catch (error) {
        console.error('Error actualizando orden de categorías:', error);
        return {
            success: false,
            error: 'Error al actualizar el orden',
        };
    }
}

// =====================================================
// SERVICIOS
// =====================================================

/**
 * Obtener servicios de un estudio
 */
export async function obtenerServicios(
    studioSlug: string
): Promise<ActionResponse<ServicioData[]>> {
    try {
        const studioId = await getStudioIdFromSlug(studioSlug);
        if (!studioId) {
            return { success: false, error: 'Estudio no encontrado' };
        }

        const servicios = await prisma.studio_servicios.findMany({
            where: { studio_id: studioId },
            include: {
                servicio_categorias: {
                    include: {
                        seccion_categorias: {
                            select: {
                                seccion_id: true,
                            },
                        },
                    },
                },
                servicio_gastos: true,
            },
            orderBy: { orden: 'asc' },
        });

        const serviciosData: ServicioData[] = servicios.map((s) => ({
            id: s.id,
            studioId: s.studio_id,
            servicioCategoriaId: s.servicio_categoria_id,
            nombre: s.nombre,
            costo: s.costo,
            gasto: s.gasto,
            tipo_utilidad: s.tipo_utilidad,
            orden: s.orden,
            status: s.status,
            createdAt: s.created_at,
            updatedAt: s.updated_at,
            gastos: s.servicio_gastos.map((g) => ({
                id: g.id,
                nombre: g.nombre,
                costo: g.costo,
            })),
            categoria: {
                id: s.servicio_categorias.id,
                nombre: s.servicio_categorias.nombre,
                orden: s.servicio_categorias.orden,
                createdAt: s.servicio_categorias.created_at,
                updatedAt: s.servicio_categorias.updated_at,
                seccionId: s.servicio_categorias.seccion_categorias?.seccion_id,
                servicios: [],
            },
        }));

        return { success: true, data: serviciosData };
    } catch (error) {
        console.error('Error obteniendo servicios:', error);
        return {
            success: false,
            error: 'Error al obtener los servicios',
        };
    }
}

/**
 * Crear un nuevo servicio
 */
export async function crearServicio(
    studioSlug: string,
    data: unknown
): Promise<ActionResponse<ServicioData>> {
    try {
        const studioId = await getStudioIdFromSlug(studioSlug);
        if (!studioId) {
            return { success: false, error: 'Estudio no encontrado' };
        }

        const validatedData = ServicioSchema.parse(data);

        // Obtener el siguiente número de orden para esta categoría
        const ultimoServicio = await prisma.studio_servicios.findFirst({
            where: {
                studio_id: studioId,
                servicio_categoria_id: validatedData.servicioCategoriaId,
            },
            orderBy: { orden: 'desc' },
            select: { orden: true },
        });

        const nuevoOrden = ultimoServicio ? ultimoServicio.orden + 1 : 0;

        const servicio = await prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: validatedData.servicioCategoriaId,
                nombre: validatedData.nombre,
                costo: validatedData.costo,
                gasto: validatedData.gasto,
                // utilidad: validatedData.utilidad,
                // precio_publico: validatedData.precio_publico,
                tipo_utilidad: validatedData.tipo_utilidad,
                orden: nuevoOrden,
                status: validatedData.status,
                servicio_gastos: {
                    create: validatedData.gastos?.map((gasto) => ({
                        nombre: gasto.nombre,
                        costo: gasto.costo,
                    })) || [],
                },
            },
            include: {
                servicio_categorias: true,
                servicio_gastos: true,
            },
        });

        revalidateCatalogo(studioSlug);

        return {
            success: true,
            data: {
                id: servicio.id,
                studioId: servicio.studio_id,
                servicioCategoriaId: servicio.servicio_categoria_id,
                nombre: servicio.nombre,
                costo: servicio.costo,
                gasto: servicio.gasto,
                tipo_utilidad: servicio.tipo_utilidad,
                orden: servicio.orden,
                status: servicio.status,
                createdAt: servicio.created_at,
                updatedAt: servicio.updated_at,
                gastos: servicio.servicio_gastos.map((g) => ({
                    id: g.id,
                    nombre: g.nombre,
                    costo: g.costo,
                })),
            },
        };
    } catch (error) {
        console.error('Error creando servicio:', error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : 'Error al crear el servicio',
        };
    }
}

/**
 * Actualizar un servicio existente
 */
export async function actualizarServicio(
    studioSlug: string,
    servicioId: string,
    data: unknown
): Promise<ActionResponse<ServicioData>> {
    try {
        const validatedData = ServicioSchema.partial().parse(data);
        const { gastos, ...servicioData } = validatedData;

        // Actualizar servicio y reemplazar gastos si se proporcionan
        const servicio = await prisma.studio_servicios.update({
            where: { id: servicioId },
            data: {
                ...servicioData,
                ...(gastos !== undefined && {
                    servicio_gastos: {
                        deleteMany: {}, // Eliminar todos los gastos existentes
                        create: gastos.map((gasto) => ({
                            nombre: gasto.nombre,
                            costo: gasto.costo,
                        })),
                    },
                }),
            },
            include: {
                servicio_gastos: true,
            },
        });

        revalidateCatalogo(studioSlug);

        return {
            success: true,
            data: {
                id: servicio.id,
                studioId: servicio.studio_id,
                servicioCategoriaId: servicio.servicio_categoria_id,
                nombre: servicio.nombre,
                costo: servicio.costo,
                gasto: servicio.gasto,
                tipo_utilidad: servicio.tipo_utilidad,
                orden: servicio.orden,
                status: servicio.status,
                createdAt: servicio.created_at,
                updatedAt: servicio.updated_at,
                gastos: servicio.servicio_gastos.map((g) => ({
                    id: g.id,
                    nombre: g.nombre,
                    costo: g.costo,
                })),
            },
        };
    } catch (error) {
        console.error('Error actualizando servicio:', error);
        return {
            success: false,
            error: 'Error al actualizar el servicio',
        };
    }
}

/**
 * Eliminar un servicio
 */
export async function eliminarServicio(
    studioSlug: string,
    servicioId: string
): Promise<ActionResponse<boolean>> {
    try {
        await prisma.studio_servicios.delete({
            where: { id: servicioId },
        });

        revalidateCatalogo(studioSlug);

        return { success: true, data: true };
    } catch (error) {
        console.error('Error eliminando servicio:', error);
        return {
            success: false,
            error: 'Error al eliminar el servicio',
        };
    }
}

/**
 * Duplicar un servicio
 */
export async function duplicarServicio(
    studioSlug: string,
    servicioId: string
): Promise<ActionResponse<ServicioData>> {
    try {
        const servicioOriginal = await prisma.studio_servicios.findUnique({
            where: { id: servicioId },
            include: {
                servicio_gastos: true,
            },
        });

        if (!servicioOriginal) {
            return { success: false, error: 'Servicio no encontrado' };
        }

        // Obtener el siguiente orden
        const ultimoServicio = await prisma.studio_servicios.findFirst({
            where: {
                studio_id: servicioOriginal.studio_id,
                servicio_categoria_id: servicioOriginal.servicio_categoria_id,
            },
            orderBy: { orden: 'desc' },
            select: { orden: true },
        });

        const nuevoOrden = ultimoServicio ? ultimoServicio.orden + 1 : 0;

        const servicioNuevo = await prisma.studio_servicios.create({
            data: {
                studio_id: servicioOriginal.studio_id,
                servicio_categoria_id: servicioOriginal.servicio_categoria_id,
                nombre: `${servicioOriginal.nombre} (Copia)`,
                costo: servicioOriginal.costo,
                gasto: servicioOriginal.gasto,
                // utilidad: servicioOriginal.utilidad,
                // precio_publico: servicioOriginal.precio_publico,
                tipo_utilidad: servicioOriginal.tipo_utilidad,
                orden: nuevoOrden,
                status: servicioOriginal.status,
                servicio_gastos: {
                    create: servicioOriginal.servicio_gastos.map((gasto) => ({
                        nombre: gasto.nombre,
                        costo: gasto.costo,
                    })),
                },
            },
            include: {
                servicio_gastos: true,
            },
        });

        revalidateCatalogo(studioSlug);

        return {
            success: true,
            data: {
                id: servicioNuevo.id,
                studioId: servicioNuevo.studio_id,
                servicioCategoriaId: servicioNuevo.servicio_categoria_id,
                nombre: servicioNuevo.nombre,
                costo: servicioNuevo.costo,
                gasto: servicioNuevo.gasto,
                //  utilidad: servicioNuevo.utilidad,
                // precio_publico: servicioNuevo.precio_publico,
                tipo_utilidad: servicioNuevo.tipo_utilidad,
                orden: servicioNuevo.orden,
                status: servicioNuevo.status,
                createdAt: servicioNuevo.created_at,
                updatedAt: servicioNuevo.updated_at,
                gastos: servicioNuevo.servicio_gastos.map((g) => ({
                    id: g.id,
                    nombre: g.nombre,
                    costo: g.costo,
                })),
            },
        };
    } catch (error) {
        console.error('Error duplicando servicio:', error);
        return {
            success: false,
            error: 'Error al duplicar el servicio',
        };
    }
}

// =====================================================
// DRAG & DROP
// =====================================================

/**
 * Actualizar posición de un elemento (drag & drop)
 */
export async function actualizarPosicionCatalogo(
    studioSlug: string,
    itemId: string,
    itemType: 'seccion' | 'categoria' | 'servicio',
    newIndex: number,
    parentId?: string | null
): Promise<ActionResponse<boolean>> {
    try {
        await getStudioIdFromSlug(studioSlug);

        if (itemType === 'seccion') {
            // Actualizar orden de sección
            await prisma.studio_servicio_secciones.update({
                where: { id: itemId },
                data: { orden: newIndex },
            });
        } else if (itemType === 'categoria') {
            // Actualizar orden de categoría y posiblemente cambiar de sección
            if (parentId) {
                // Cambiar de sección si parentId es diferente
                await prisma.$transaction(async (tx) => {
                    // Actualizar orden
                    await tx.studio_servicio_categorias.update({
                        where: { id: itemId },
                        data: { orden: newIndex },
                    });

                    // Actualizar relación de sección
                    await tx.studio_seccion_categorias.update({
                        where: { categoria_id: itemId },
                        data: { seccion_id: parentId },
                    });
                });
            } else {
                await prisma.studio_servicio_categorias.update({
                    where: { id: itemId },
                    data: { orden: newIndex },
                });
            }
        } else if (itemType === 'servicio') {
            // Actualizar orden de servicio y posiblemente cambiar de categoría
            if (parentId) {
                await prisma.studio_servicios.update({
                    where: { id: itemId },
                    data: {
                        orden: newIndex,
                        servicio_categoria_id: parentId,
                    },
                });
            } else {
                await prisma.studio_servicios.update({
                    where: { id: itemId },
                    data: { orden: newIndex },
                });
            }
        }

        revalidateCatalogo(studioSlug);

        return { success: true, data: true };
    } catch (error) {
        console.error('Error actualizando posición:', error);
        return {
            success: false,
            error: 'Error al actualizar la posición',
        };
    }
}
