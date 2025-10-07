// prisma/seeds/studio-catalog-seed.ts
// Script para sembrar secciones, categorías y servicios COMPLETO con estructura anidada

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface StudioConfig {
    utilidad_servicio: number; // 50% por defecto
    utilidad_producto: number; // 35% por defecto
}

// Configuración del studio (para cálculo de precios)
const STUDIO_CONFIG: StudioConfig = {
    utilidad_servicio: 0.50, // 50%
    utilidad_producto: 0.35  // 35%
};

// Helper para calcular precio público
function calcularPrecioPublico(
    costo: number,
    gasto: number,
    tipo: 'servicio' | 'producto'
): number {
    const costoTotal = costo + gasto;
    const margen = tipo === 'servicio'
        ? STUDIO_CONFIG.utilidad_servicio
        : STUDIO_CONFIG.utilidad_producto;

    return costoTotal / (1 - margen);
}

export async function seedStudioCatalog(studioId: string) {
    console.log('🌱 Sembrando catálogo COMPLETO con estructura anidada...');

    // ============================================
    // 1. LIMPIAR TABLAS EXISTENTES
    // ============================================

    console.log('🧹 Limpiando tablas existentes...');

    // Eliminar en orden correcto para respetar foreign keys
    await prisma.studio_servicios.deleteMany({
        where: { studio_id: studioId }
    });

    await prisma.studio_seccion_categorias.deleteMany({});

    await prisma.studio_servicio_categorias.deleteMany({});

    await prisma.studio_servicio_secciones.deleteMany({});

    console.log('✅ Tablas limpiadas exitosamente');

    // ============================================
    // 2. CREAR SECCIONES DE SERVICIO
    // ============================================

    console.log('📂 Creando secciones de servicio...');

    const secciones = await Promise.all([
        prisma.studio_servicio_secciones.create({
            data: {
                nombre: 'Experiencias previas al evento',
                descripcion: 'Todo lo relacionado con las sesiones fotográficas y cinematográficas que suceden antes del día principal',
                orden: 0
            }
        }),
        prisma.studio_servicio_secciones.create({
            data: {
                nombre: 'Cobertura del Día del Evento',
                descripcion: 'El personal, equipo y tiempo dedicados a capturar cada momento del evento principal',
                orden: 1
            }
        }),
        prisma.studio_servicio_secciones.create({
            data: {
                nombre: 'Arte Impreso de evento',
                descripcion: 'Productos físicos de alta calidad que convierten tus recuerdos en tesoros tangibles',
                orden: 2
            }
        }),
        prisma.studio_servicio_secciones.create({
            data: {
                nombre: 'Complementos y Servicios Adicionales',
                descripcion: 'Extras que añaden un toque único y especial a la experiencia completa',
                orden: 3
            }
        })
    ]);

    console.log(`✅ ${secciones.length} secciones creadas`);

    // ============================================
    // 3. CREAR CATEGORÍAS Y RELACIONAR CON SECCIONES
    // ============================================

    console.log('📁 Creando categorías y relacionando con secciones...');

    // SECCIÓN 1: Experiencias previas al evento
    const categoriasSeccion1 = await Promise.all([
        prisma.studio_servicio_categorias.create({
            data: { nombre: 'Fotografía de sesión previa', orden: 0 }
        }),
        prisma.studio_servicio_categorias.create({
            data: { nombre: 'Revelado y retoque digital de fotos de sesión', orden: 1 }
        }),
        prisma.studio_servicio_categorias.create({
            data: { nombre: 'Cinematografía de sesión', orden: 2 }
        }),
        prisma.studio_servicio_categorias.create({
            data: { nombre: 'Otros servicios previos al evento', orden: 3 }
        }),
        prisma.studio_servicio_categorias.create({
            data: { nombre: 'Arte impreso de sesión', orden: 4 }
        })
    ]);

    // Relacionar categorías con sección 1
    await Promise.all(
        categoriasSeccion1.map(categoria =>
            prisma.studio_seccion_categorias.create({
                data: {
                    seccion_id: secciones[0].id,
                    categoria_id: categoria.id
                }
            })
        )
    );

    // SECCIÓN 2: Cobertura del Día del Evento
    const categoriasSeccion2 = await Promise.all([
        prisma.studio_servicio_categorias.create({
            data: { nombre: 'Arreglo en domicilio', orden: 5 }
        }),
        prisma.studio_servicio_categorias.create({
            data: { nombre: 'Tour limusina', orden: 6 }
        }),
        prisma.studio_servicio_categorias.create({
            data: { nombre: 'Fotografía de evento', orden: 7 }
        }),
        prisma.studio_servicio_categorias.create({
            data: { nombre: 'Cinematografía de evento', orden: 8 }
        })
    ]);

    // Relacionar categorías con sección 2
    await Promise.all(
        categoriasSeccion2.map(categoria =>
            prisma.studio_seccion_categorias.create({
                data: {
                    seccion_id: secciones[1].id,
                    categoria_id: categoria.id
                }
            })
        )
    );

    // SECCIÓN 3: Arte Impreso de evento
    const categoriasSeccion3 = await Promise.all([
        prisma.studio_servicio_categorias.create({
            data: { nombre: 'Cuadro de evento', orden: 9 }
        }),
        prisma.studio_servicio_categorias.create({
            data: { nombre: 'Libro de evento de lujo 12x12"', orden: 10 }
        }),
        prisma.studio_servicio_categorias.create({
            data: { nombre: 'Libro de evento clásico 12x12"', orden: 11 }
        }),
        prisma.studio_servicio_categorias.create({
            data: { nombre: 'Libro de evento clásico 10x10"', orden: 12 }
        })
    ]);

    // Relacionar categorías con sección 3
    await Promise.all(
        categoriasSeccion3.map(categoria =>
            prisma.studio_seccion_categorias.create({
                data: {
                    seccion_id: secciones[2].id,
                    categoria_id: categoria.id
                }
            })
        )
    );

    // SECCIÓN 4: Complementos y Servicios Adicionales
    const categoriasSeccion4 = await Promise.all([
        prisma.studio_servicio_categorias.create({
            data: { nombre: 'Otros entregables', orden: 13 }
        })
    ]);

    // Relacionar categorías con sección 4
    await Promise.all(
        categoriasSeccion4.map(categoria =>
            prisma.studio_seccion_categorias.create({
                data: {
                    seccion_id: secciones[3].id,
                    categoria_id: categoria.id
                }
            })
        )
    );

    // Combinar todas las categorías para facilitar el acceso
    const todasLasCategorias = [
        ...categoriasSeccion1,
        ...categoriasSeccion2,
        ...categoriasSeccion3,
        ...categoriasSeccion4
    ];

    console.log(`✅ ${todasLasCategorias.length} categorías creadas y relacionadas con secciones`);

    // ============================================
    // 4. CREAR SERVICIOS Y RELACIONAR CON CATEGORÍAS
    // ============================================

    console.log('🛠️ Creando servicios y relacionando con categorías...');

    const servicios = await Promise.all([
        // FOTOGRAFÍA DE SESIÓN PREVIA (5 servicios)
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion1[0].id,
                nombre: 'Shooting en estudio fotográfico hasta por 45min',
                costo: 1000, gasto: 0, orden: 0, status: 'active'
            }
        }),
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion1[0].id,
                nombre: 'Sesión de vestido hasta 3 horas de servicio',
                costo: 2500, gasto: 0, orden: 1, status: 'active'
            }
        }),
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion1[0].id,
                nombre: 'Shooting para cambios casuales hasta por 2 horas de servicio',
                costo: 1500, gasto: 0, orden: 2, status: 'active'
            }
        }),
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion1[0].id,
                nombre: 'Shooting Trash the Dress hasta por 3 horas de servicio',
                costo: 2000, gasto: 0, orden: 3, status: 'active'
            }
        }),
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion1[0].id,
                nombre: 'Asistencia en iluminación para sesión',
                costo: 600, gasto: 0, orden: 4, status: 'active'
            }
        }),

        // REVELADO Y RETOQUE DIGITAL DE FOTOS DE SESIÓN (2 servicios)
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion1[1].id,
                nombre: 'Revelado digital de todas las fotografías de sesión',
                costo: 300, gasto: 0, orden: 0, status: 'active'
            }
        }),
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion1[1].id,
                nombre: 'Retoque avanzado de fotografía digital',
                costo: 120, gasto: 0, orden: 1, status: 'active'
            }
        }),

        // CINEMATOGRAFÍA DE SESIÓN (3 servicios)
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion1[2].id,
                nombre: 'Servicio de grabación profesional sesión en 4k con estabilizador de imagen',
                costo: 2000, gasto: 0, orden: 0, status: 'active'
            }
        }),
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion1[2].id,
                nombre: 'Grabación con dron 4k para sesión',
                costo: 1000, gasto: 0, orden: 1, status: 'active'
            }
        }),
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion1[2].id,
                nombre: 'Edición de video cinemático de sesión musicalizado de hasta 3min',
                costo: 1000, gasto: 0, orden: 2, status: 'active'
            }
        }),

        // OTROS SERVICIOS PREVIOS AL EVENTO (2 servicios)
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion1[3].id,
                nombre: 'Edición de video slide musicalizado con las fotos de retoque fino de la sesión',
                costo: 300, gasto: 0, orden: 0, status: 'active'
            }
        }),
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion1[3].id,
                nombre: 'Edición de video remembranza con hasta 100 fotografías de momentos especiales',
                costo: 300, gasto: 0, orden: 1, status: 'active'
            }
        }),

        // ARTE IMPRESO DE SESIÓN (2 categorías)
        // Cuadros de sesión
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion1[4].id,
                nombre: 'Cuadro en acrílico 24x36" en papel perla sobre macocel y bastidor',
                costo: 2040, gasto: 0, orden: 0, status: 'active'
            }
        }),

        // Libro de sesión de lujo 12x12"
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion1[4].id,
                nombre: 'Diseño de libro de sesión',
                costo: 500, gasto: 0, orden: 1, status: 'active'
            }
        }),
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion1[4].id,
                nombre: 'Libro de lujo de sesión 12x12" con portada en acrílico impresa en papel aperlado con interiores impresos el papel velvet o perla con hasta 12 paginas en interior',
                costo: 2400, gasto: 0, orden: 2, status: 'active'
            }
        }),
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion1[4].id,
                nombre: 'Caja de lujo 12x12" para libro de sesión con tapa de acrílico y fotografía impresa en papel aperlado o velvet',
                costo: 3300, gasto: 0, orden: 3, status: 'active'
            }
        }),

        // Libros de sesión
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion1[4].id,
                nombre: 'Libro clásico de sesión 12x12" con foto portada en textura con interiores impresos el papel lustre, mate o brillante con hasta 12 paginas en interior',
                costo: 1237, gasto: 0, orden: 4, status: 'active'
            }
        }),
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion1[4].id,
                nombre: 'Caja clásica 12x12" para libro de sesión con foto envolvente y foto en tapa interior',
                costo: 1275, gasto: 0, orden: 5, status: 'active'
            }
        }),

        // ARREGLO EN DOMICILIO (6 servicios)
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion2[0].id,
                nombre: 'Fotógrafo A por servicio de 2 hrs',
                costo: 1000, gasto: 0, orden: 0, status: 'active'
            }
        }),
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion2[0].id,
                nombre: 'Asistente de iluminación A por servicio de 2 hrs',
                costo: 250, gasto: 0, orden: 1, status: 'active'
            }
        }),
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion2[0].id,
                nombre: 'Fotógrafo B por servicio de 2 hrs',
                costo: 1000, gasto: 0, orden: 2, status: 'active'
            }
        }),
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion2[0].id,
                nombre: 'Asistente de iluminación B por servicio de 2 hrs',
                costo: 250, gasto: 0, orden: 3, status: 'active'
            }
        }),
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion2[0].id,
                nombre: 'Camarógrafo A por servicio de 2 hrs',
                costo: 1000, gasto: 0, orden: 4, status: 'active'
            }
        }),
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion2[0].id,
                nombre: 'Camarógrafo B por servicio de 2 hrs',
                costo: 1000, gasto: 0, orden: 5, status: 'active'
            }
        }),

        // TOUR LIMUSINA (3 servicios)
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion2[1].id,
                nombre: 'Fotógrafo A por servicio',
                costo: 500, gasto: 0, orden: 0, status: 'active'
            }
        }),
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion2[1].id,
                nombre: 'Asistente de iluminación A por servicio',
                costo: 200, gasto: 0, orden: 1, status: 'active'
            }
        }),
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion2[1].id,
                nombre: 'Camarógrafo A por servicio',
                costo: 500, gasto: 0, orden: 2, status: 'active'
            }
        }),

        // FOTOGRAFÍA DE EVENTO (5 servicios)
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion2[2].id,
                nombre: 'Fotógrafo A por hora (Cobertura general)',
                costo: 300, gasto: 0, orden: 0, status: 'active'
            }
        }),
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion2[2].id,
                nombre: 'Asistente de iluminación A por hora',
                costo: 100, gasto: 0, orden: 1, status: 'active'
            }
        }),
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion2[2].id,
                nombre: 'Fotógrafo B por hora (Fotografía de detalle)',
                costo: 200, gasto: 0, orden: 2, status: 'active'
            }
        }),
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion2[2].id,
                nombre: 'Asistente de iluminación B por hora',
                costo: 100, gasto: 0, orden: 3, status: 'active'
            }
        }),
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion2[2].id,
                nombre: 'Revelado ligero de todas las fotografías del evento',
                costo: 2500, gasto: 0, orden: 4, status: 'active'
            }
        }),

        // CINEMATOGRAFÍA DE EVENTO (8 servicios)
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion2[3].id,
                nombre: 'Camarógrafo A por hora',
                costo: 300, gasto: 0, orden: 0, status: 'active'
            }
        }),
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion2[3].id,
                nombre: 'Camarógrafo B por hora',
                costo: 200, gasto: 0, orden: 1, status: 'active'
            }
        }),
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion2[3].id,
                nombre: 'Camarógrafo C por hora',
                costo: 200, gasto: 0, orden: 2, status: 'active'
            }
        }),
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion2[3].id,
                nombre: 'Grúa con cabezal robótico de 8mts y operador',
                costo: 5000, gasto: 0, orden: 3, status: 'active'
            }
        }),
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion2[3].id,
                nombre: 'Grabación con dron 4k para evento en momentos clave',
                costo: 1500, gasto: 0, orden: 4, status: 'active'
            }
        }),
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion2[3].id,
                nombre: 'Asistente de producción por hora',
                costo: 100, gasto: 0, orden: 5, status: 'active'
            }
        }),
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion2[3].id,
                nombre: 'Edición de video extendido de 90 min',
                costo: 2500, gasto: 0, orden: 6, status: 'active'
            }
        }),
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion2[3].id,
                nombre: 'Edición de video de hasta 40min',
                costo: 1500, gasto: 0, orden: 7, status: 'active'
            }
        }),
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion2[3].id,
                nombre: 'Edición de video resumen de hasta 3min',
                costo: 1000, gasto: 0, orden: 8, status: 'active'
            }
        }),

        // CUADRO DE EVENTO (1 servicio)
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion3[0].id,
                nombre: 'Cuadro en acrílico 24x36" en papel perla sobre macocel y bastidor',
                costo: 2040, gasto: 0, orden: 0, status: 'active'
            }
        }),

        // LIBRO DE EVENTO DE LUJO 12X12" (4 servicios)
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion3[1].id,
                nombre: 'Diseño de libro de evento',
                costo: 500, gasto: 0, orden: 0, status: 'active'
            }
        }),
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion3[1].id,
                nombre: 'Kit de revelado y retoque avanzado de hasta 55 fotografías de evento para libro',
                costo: 3000, gasto: 0, orden: 1, status: 'active'
            }
        }),
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion3[1].id,
                nombre: 'Libro de lujo 12x12" de evento con portada en acrílico impresa en papel aperlado, interiores impresos el papel mate velvet con hasta 50 paginas en interior (80 fotos)',
                costo: 4905, gasto: 0, orden: 2, status: 'active'
            }
        }),
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion3[1].id,
                nombre: 'Caja de lujo 12x12" para libro de evento con foto envolvente y foto en tapa interior',
                costo: 3500, gasto: 0, orden: 3, status: 'active'
            }
        }),

        // LIBRO DE EVENTO CLÁSICO 12X12" (3 servicios)
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion3[2].id,
                nombre: 'Libro clásico de evento 12x12" con foto portada con textura a elegir, interiores impresos el papel lustre, mate o brillante con hasta 50 paginas en interior (80 fotos)',
                costo: 2989, gasto: 0, orden: 0, status: 'active'
            }
        }),
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion3[2].id,
                nombre: 'Caja estándar 12x12" para libro de sesión con foto envolvente y foto en tapa interior',
                costo: 1600, gasto: 0, orden: 1, status: 'active'
            }
        }),

        // LIBRO DE EVENTO CLÁSICO 10X10" (3 servicios)
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion3[3].id,
                nombre: 'Libro clásico de evento 10x10" con foto portada con textura a elegir, interiores impresos el papel lustre, mate o brillante con hasta 50 paginas en interior (80 fotos)',
                costo: 2250, gasto: 0, orden: 0, status: 'active'
            }
        }),
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion3[3].id,
                nombre: 'Caja estándar 10x10" para libro de sesión con foto envolvente y foto en tapa interior',
                costo: 1500, gasto: 0, orden: 1, status: 'active'
            }
        }),

        // OTROS ENTREGABLES (4 servicios)
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion4[0].id,
                nombre: 'USB de 64GB 3.0',
                costo: 300, gasto: 0, orden: 0, status: 'active'
            }
        }),
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion4[0].id,
                nombre: 'Bolsa tipo shopping para caja de USB',
                costo: 500, gasto: 0, orden: 1, status: 'active'
            }
        }),
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion4[0].id,
                nombre: 'Caja para USB',
                costo: 1500, gasto: 0, orden: 2, status: 'active'
            }
        }),
        prisma.studio_servicios.create({
            data: {
                studio_id: studioId,
                servicio_categoria_id: categoriasSeccion4[0].id,
                nombre: 'Link permanente de Google Drive',
                costo: 0, gasto: 0, orden: 3, status: 'active'
            }
        })
    ]);

    console.log(`✅ ${servicios.length} servicios creados y relacionados con categorías`);

    // ============================================
    // 5. CALCULAR PRECIOS DE TODOS LOS SERVICIOS
    // ============================================

    console.log('💰 Calculando precios de todos los servicios...');

    for (const servicio of servicios) {
        const precioPublico = calcularPrecioPublico(servicio.costo, servicio.gasto, 'servicio');

        console.log(`  ✅ ${servicio.nombre}:`);
        console.log(`     Costo: $${servicio.costo.toFixed(2)}`);
        console.log(`     Gasto: $${servicio.gasto.toFixed(2)}`);
        console.log(`     Precio Calculado: $${precioPublico.toFixed(2)}`);
    }

    console.log('✅ Catálogo COMPLETO con estructura anidada sembrado exitosamente');
    console.log('🎯 RESULTADOS OBTENIDOS:');
    console.log(`   ✅ ${secciones.length} Secciones de servicios`);
    console.log(`   ✅ ${todasLasCategorias.length} Categorías organizadas por sección`);
    console.log(`   ✅ ${servicios.length} Servicios con costos reales`);
    console.log('   ✅ Estructura anidada: Sección → Categoría → Servicio');
    console.log('   ✅ Relaciones correctas creadas en base de datos');
}

async function main() {
    try {
        // Obtener el primer studio disponible o usar un ID específico
        const studio = await prisma.studios.findFirst({
            select: { id: true, studio_name: true }
        });

        if (!studio) {
            console.error('❌ No se encontró ningún studio en la base de datos');
            process.exit(1);
        }

        console.log(`🎯 Sembrando catálogo COMPLETO con estructura anidada para studio: ${studio.studio_name} (${studio.id})`);

        await seedStudioCatalog(studio.id);

        console.log('🎉 Seed COMPLETO con estructura anidada finalizado exitosamente!');
    } catch (error) {
        console.error('❌ Error durante el seed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
    main();
}