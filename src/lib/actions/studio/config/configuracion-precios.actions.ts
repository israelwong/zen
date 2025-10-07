'use server';

import { prisma } from '@/lib/prisma';
import { retryDatabaseOperation } from '@/lib/actions/utils/database-retry';
import { revalidatePath } from 'next/cache';
import {
    ConfiguracionPreciosSchema,
    ServiciosExistentesSchema,
    type ConfiguracionPreciosForm,
    type ServiciosExistentes
} from '@/lib/actions/schemas/configuracion-precios-schemas';

// Obtener configuración de precios del studio
export async function obtenerConfiguracionPrecios(studioSlug: string) {
    return await retryDatabaseOperation(async () => {
        const studio = await prisma.studios.findUnique({
            where: { slug: studioSlug },
            select: {
                id: true,
                studio_name: true,
                slug: true,
                configuraciones: {
                    where: { status: 'active' },
                    orderBy: { updated_at: 'desc' },
                    take: 1,
                },
            },
        });

        if (!studio) {
            throw new Error("Studio no encontrado");
        }

        // Obtener la configuración activa o crear una por defecto
        let configuracion = studio.configuraciones[0];

        if (!configuracion) {
            // Crear configuración por defecto
            configuracion = await prisma.studio_configuraciones.create({
                data: {
                    studio: { connect: { id: studio.id } },
                    nombre: 'Configuración de Precios',
                    utilidad_servicio: 0.30, // 30%
                    utilidad_producto: 0.40, // 40%
                    comision_venta: 0.10, // 10%
                    sobreprecio: 0.05, // 5%
                    status: 'active',
                    updated_at: new Date(),
                },
            });
        }

        return {
            id: studio.id,
            nombre: studio.studio_name,
            slug: studio.slug,
            utilidad_servicio: String((configuracion.utilidad_servicio ?? 0.30) * 100), // Convertir a porcentaje
            utilidad_producto: String((configuracion.utilidad_producto ?? 0.40) * 100),
            comision_venta: String((configuracion.comision_venta ?? 0.10) * 100),
            sobreprecio: String((configuracion.sobreprecio ?? 0.05) * 100),
        };
    });
}

// Verificar si hay servicios existentes que requieran actualización masiva
export async function verificarServiciosExistentes(studioSlug: string): Promise<ServiciosExistentes> {
    return await retryDatabaseOperation(async () => {
        const studio = await prisma.studios.findUnique({
            where: { slug: studioSlug },
            select: {
                id: true,
                configuraciones: {
                    where: { status: 'active' },
                    orderBy: { updated_at: 'desc' },
                    take: 1,
                    select: {
                        utilidad_servicio: true,
                        utilidad_producto: true,
                        comision_venta: true,
                        sobreprecio: true,
                    }
                }
            },
        });

        if (!studio) {
            throw new Error("Studio no encontrado");
        }

        // Contar servicios existentes
        const servicios = await prisma.studio_servicios.findMany({
            where: { studio: { id: studio.id } },
            select: {
                id: true,
                tipo_utilidad: true,
            },
        });

        const total_servicios = servicios.length;
        const servicios_por_tipo = {
            servicios: servicios.filter(s => s.tipo_utilidad === 'servicio').length,
            productos: servicios.filter(s => s.tipo_utilidad === 'producto').length,
            paquetes: servicios.filter(s => s.tipo_utilidad === 'paquete').length,
        };

        // Verificar si hay cambios en los porcentajes
        const configuracionActual = studio.configuraciones[0];
        const requiere_actualizacion_masiva = total_servicios > 0 && (
            !configuracionActual || // Si no hay configuración, se necesita actualizar
            configuracionActual.utilidad_servicio !== 0.30 || // Si los valores son diferentes a los por defecto
            configuracionActual.utilidad_producto !== 0.40 ||
            configuracionActual.comision_venta !== 0.10 ||
            configuracionActual.sobreprecio !== 0.05
        );

        return {
            total_servicios,
            servicios_por_tipo,
            requiere_actualizacion_masiva,
        };
    });
}

// Actualizar configuración de precios
export async function actualizarConfiguracionPrecios(
    studioSlug: string,
    data: ConfiguracionPreciosForm
) {
    return await retryDatabaseOperation(async () => {
        // Validar datos
        const validationResult = ConfiguracionPreciosSchema.safeParse(data);

        if (!validationResult.success) {
            return {
                success: false,
                error: validationResult.error.flatten().fieldErrors,
            };
        }

        const { id, ...validatedData } = validationResult.data;

        // Convertir porcentajes a decimales para almacenamiento
        const dataToSave = {
            utilidad_servicio: parseFloat((parseFloat(validatedData.utilidad_servicio) / 100).toFixed(4)),
            utilidad_producto: parseFloat((parseFloat(validatedData.utilidad_producto) / 100).toFixed(4)),
            comision_venta: parseFloat((parseFloat(validatedData.comision_venta) / 100).toFixed(4)),
            sobreprecio: parseFloat((parseFloat(validatedData.sobreprecio) / 100).toFixed(4)),
        };

        // Obtener el studio
        const studio = await prisma.studios.findUnique({
            where: { slug: studioSlug },
            select: { id: true },
        });

        if (!studio) {
            throw new Error("Studio no encontrado");
        }

        // 1. Buscar configuración existente
        const configuracionExistente = await prisma.studio_configuraciones.findFirst({
            where: {
                studio_id: studio.id,
                status: 'active',
            },
        });

        // 2. Actualizar o crear la configuración del studio
        if (configuracionExistente) {
            await prisma.studio_configuraciones.update({
                where: {
                    id: configuracionExistente.id,
                },
                data: {
                    utilidad_servicio: dataToSave.utilidad_servicio,
                    utilidad_producto: dataToSave.utilidad_producto,
                    comision_venta: dataToSave.comision_venta,
                    sobreprecio: dataToSave.sobreprecio,
                    status: 'active',
                    updated_at: new Date(),
                },
            });
        } else {
            await prisma.studio_configuraciones.create({
                data: {
                    studio: { connect: { id: studio.id } },
                    nombre: 'Configuración de Precios',
                    utilidad_servicio: dataToSave.utilidad_servicio,
                    utilidad_producto: dataToSave.utilidad_producto,
                    comision_venta: dataToSave.comision_venta,
                    sobreprecio: dataToSave.sobreprecio,
                    status: 'active',
                    updated_at: new Date(),
                },
            });
        }

        // 3. Verificar si hay servicios existentes para actualización masiva
        const serviciosExistentes = await verificarServiciosExistentes(studioSlug);

        if (serviciosExistentes.requiere_actualizacion_masiva) {
            // 4. Obtener todos los servicios existentes para el recálculo masivo
            const todosLosServicios = await prisma.studio_servicios.findMany({
                where: { studio: { id: studio.id } },
                include: {
                    // Incluir gastos si existen
                    servicio_gastos: true,
                },
            });

            // NOTA: Ya no actualizamos precio_publico ni utilidad en studio_servicios
            // Estos campos se eliminaron del modelo y ahora se calculan al vuelo
            // usando studio_configuraciones. Solo actualizamos updatedAt para
            // indicar que hubo un cambio en la configuración.

            const updatePromises = todosLosServicios.map(servicio => {
                return prisma.studio_servicios.update({
                    where: { id: servicio.id },
                    data: {
                        updated_at: new Date(),
                    },
                });
            });

            // 5. Ejecutar todas las actualizaciones de timestamp
            await Promise.all(updatePromises);
        }

        // 6. Revalidar las rutas
        revalidatePath(`/studio/${studioSlug}/configuracion/negocio/configuracion-precios`);
        revalidatePath(`/studio/${studioSlug}/configuracion/catalogo/servicios`);
        revalidatePath(`/studio/${studioSlug}/configuracion/catalogo/paquetes`);

        return {
            success: true,
            servicios_actualizados: serviciosExistentes.total_servicios,
            requiere_actualizacion_masiva: serviciosExistentes.requiere_actualizacion_masiva,
        };

    });
}

// Obtener estadísticas de servicios para mostrar en la UI
export async function obtenerEstadisticasServicios(studioSlug: string) {
    return await retryDatabaseOperation(async () => {
        const studio = await prisma.studios.findUnique({
            where: { slug: studioSlug },
            select: { id: true },
        });

        if (!studio) {
            throw new Error("Studio no encontrado");
        }

        const servicios = await prisma.studio_servicios.findMany({
            where: { studio: { id: studio.id } },
            select: {
                id: true,
                nombre: true,
                tipo_utilidad: true,
                costo: true,
                gasto: true,
            },
        });

        // NOTA: precio_publico y utilidad ya no se almacenan, se calculan al vuelo
        const estadisticas = {
            total_servicios: servicios.length,
            servicios_por_tipo: {
                servicios: servicios.filter(s => s.tipo_utilidad === 'servicio').length,
                productos: servicios.filter(s => s.tipo_utilidad === 'producto').length,
                paquetes: servicios.filter(s => s.tipo_utilidad === 'paquete').length,
            },
            costo_promedio: servicios.length > 0
                ? servicios.reduce((acc, s) => acc + (s.costo || 0), 0) / servicios.length
                : 0,
            gasto_promedio: servicios.length > 0
                ? servicios.reduce((acc, s) => acc + (s.gasto || 0), 0) / servicios.length
                : 0,
        };

        return estadisticas;
    });
}
