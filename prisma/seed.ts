// prisma/seed.ts
/**
 * SEED MAESTRO V2.1
 * 
 * Inicializa TODA la base de datos con datos funcionales de prueba:
 * - Platform core (módulos, planes, canales)
 * - Demo Studio completo
 * - Usuarios multi-contexto
 * - Pipelines V2.0
 * - Catálogo de servicios
 * 
 * Uso: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// CONSTANTES
// ============================================

const DEMO_STUDIO_ID = 'demo-studio-id';
const DEMO_STUDIO_SLUG = 'demo-studio';

// ============================================
// MAIN SEED
// ============================================

async function main() {
    console.log('🌱 Iniciando SEED MAESTRO V2.1...\n');

    // 1. Platform Core
    await seedPlatformModules();
    await seedSocialNetworks();
    await seedAcquisitionChannels();

    // 2. Billing
    await seedPlans();

    // 3. Demo Studio
    await seedDemoStudio();

    // 4. Usuarios Multi-Contexto
    await seedUsers();

    // 5. Pipelines V2.0
    await seedPipelines();

    // 6. Catálogo
    await seedCatalogo();

    // 7. Tipos de Evento
    await seedTiposEvento();

    // 8. Demo Lead
    await seedDemoLead();

    console.log('\n✅ SEED MAESTRO COMPLETADO\n');
    console.log('📊 Resumen:');
    console.log('  ✅ Módulos de plataforma');
    console.log('  ✅ Planes con límites');
    console.log('  ✅ Demo Studio configurado');
    console.log('  ✅ Usuarios multi-contexto');
    console.log('  ✅ Pipelines Marketing + Manager');
    console.log('  ✅ Catálogo de servicios');
    console.log('  ✅ Tipos de evento');
    console.log('  ✅ Demo Lead asociado\n');
    console.log('🔗 Acceso:');
    console.log('  Super Admin: admin@prosocial.mx');
    console.log('  Studio Owner: owner@demo-studio.com');
    console.log('  Studio URL: /demo-studio\n');
}

// ============================================
// 1. PLATFORM MODULES
// ============================================

async function seedPlatformModules() {
    console.log('🧩 Seeding platform modules...');

    const modules = [
        // CORE MODULES (incluidos en planes)
        {
            slug: 'manager',
            name: 'ZEN Manager',
            description: 'Sistema de gestión operacional - Kanban, Gantt, equipo',
            category: 'CORE' as const,
            base_price: null,
            billing_type: 'MONTHLY',
            is_active: true,
        },
        {
            slug: 'magic',
            name: 'ZEN Magic',
            description: 'Asistente inteligente con IA - Claude integration',
            category: 'CORE' as const,
            base_price: null,
            billing_type: 'MONTHLY',
            is_active: true,
        },
        {
            slug: 'marketing',
            name: 'ZEN Marketing',
            description: 'CRM y pipeline de ventas - Leads, cotizaciones',
            category: 'CORE' as const,
            base_price: null,
            billing_type: 'MONTHLY',
            is_active: true,
        },
        {
            slug: 'pages',
            name: 'ZEN Pages',
            description: 'Landing page pública - Portfolios, lead forms',
            category: 'CORE' as const,
            base_price: null,
            billing_type: 'MONTHLY',
            is_active: true,
        },

        // ADDON MODULES (pago adicional)
        {
            slug: 'payment',
            name: 'ZEN Payment',
            description: 'Procesamiento de pagos - Stripe Connect',
            category: 'ADDON' as const,
            base_price: 199, // MXN/mes
            billing_type: 'MONTHLY',
            is_active: true,
        },
        {
            slug: 'cloud',
            name: 'ZEN Cloud',
            description: 'Almacenamiento extra - CDN, galerías',
            category: 'ADDON' as const,
            base_price: 299, // MXN/mes
            billing_type: 'MONTHLY',
            is_active: true,
        },
        {
            slug: 'conversations',
            name: 'ZEN Conversations',
            description: 'Chat en tiempo real - WhatsApp, SMS',
            category: 'ADDON' as const,
            base_price: 249, // MXN/mes
            billing_type: 'MONTHLY',
            is_active: true,
        },
        {
            slug: 'invitation',
            name: 'ZEN Invitation',
            description: 'Invitaciones digitales - RSVP, QR codes',
            category: 'ADDON' as const,
            base_price: 149, // MXN/mes
            billing_type: 'MONTHLY',
            is_active: true,
        },
    ];

    for (const moduleData of modules) {
        await prisma.platform_modules.upsert({
            where: { slug: moduleData.slug },
            update: { updated_at: new Date() },
            create: {
                ...moduleData,
                created_at: new Date(),
                updated_at: new Date(),
            },
        });
        console.log(`  ✅ ${moduleData.name} (${moduleData.category})`);
    }
}

// ============================================
// 2. SOCIAL NETWORKS
// ============================================

async function seedSocialNetworks() {
    console.log('📱 Seeding social networks...');

    const networks = [
        {
            name: 'Facebook',
            slug: 'facebook',
            color: '#1877F2',
            icon: 'facebook',
            base_url: 'https://facebook.com/',
            order: 1,
        },
        {
            name: 'Instagram',
            slug: 'instagram',
            color: '#E4405F',
            icon: 'instagram',
            base_url: 'https://instagram.com/',
            order: 2,
        },
        {
            name: 'TikTok',
            slug: 'tiktok',
            color: '#000000',
            icon: 'tiktok',
            base_url: 'https://tiktok.com/@',
            order: 3,
        },
        {
            name: 'YouTube',
            slug: 'youtube',
            color: '#FF0000',
            icon: 'youtube',
            base_url: 'https://youtube.com/@',
            order: 4,
        },
    ];

    for (const network of networks) {
        await prisma.platform_social_networks.upsert({
            where: { slug: network.slug },
            update: { updated_at: new Date() },
            create: {
                ...network,
                is_active: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
        });
        console.log(`  ✅ ${network.name}`);
    }
}

// ============================================
// 3. ACQUISITION CHANNELS
// ============================================

async function seedAcquisitionChannels() {
    console.log('📊 Seeding acquisition channels...');

    const channels = [
        {
            name: 'Referidos',
            description: 'Clientes referidos por otros clientes',
            color: '#10B981',
            icon: 'users',
            order: 1,
        },
        {
            name: 'Redes Sociales',
            description: 'Leads de Instagram, Facebook, TikTok',
            color: '#3B82F6',
            icon: 'share-2',
            order: 2,
        },
        {
            name: 'Google Ads',
            description: 'Publicidad en Google',
            color: '#F59E0B',
            icon: 'search',
            order: 3,
        },
        {
            name: 'Web Orgánico',
            description: 'Tráfico orgánico del sitio web',
            color: '#8B5CF6',
            icon: 'globe',
            order: 4,
        },
    ];

    for (const channel of channels) {
        await prisma.platform_acquisition_channels.upsert({
            where: { name: channel.name },
            update: { updated_at: new Date() },
            create: {
                ...channel,
                is_active: true,
                is_visible: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
        });
        console.log(`  ✅ ${channel.name}`);
    }
}

// ============================================
// 4. PLANS (con límites normalizados)
// ============================================

async function seedPlans() {
    console.log('💳 Seeding plans with limits...');

    // PLAN BASIC
    const planBasic = await prisma.platform_plans.upsert({
        where: { slug: 'basic' },
        update: {},
        create: {
            name: 'Basic',
            slug: 'basic',
            description: 'Para estudios pequeños que están comenzando',
            price_monthly: 399, // MXN
            price_yearly: 3990, // MXN (ahorro 17%)
            stripe_product_id: 'prod_basic_demo',
            stripe_price_id: 'price_basic_demo',
            features: {
                modules: ['manager'],
                support: 'email',
                analytics: 'basic',
            },
            popular: false,
            active: true,
            orden: 1,
        },
    });

    // Límites del plan Basic
    await prisma.plan_limits.createMany({
        data: [
            { plan_id: planBasic.id, limit_type: 'EVENTS_PER_MONTH', limit_value: 10, unit: 'eventos' },
            { plan_id: planBasic.id, limit_type: 'STORAGE_GB', limit_value: 5, unit: 'GB' },
            { plan_id: planBasic.id, limit_type: 'TEAM_MEMBERS', limit_value: 3, unit: 'usuarios' },
            { plan_id: planBasic.id, limit_type: 'PORTFOLIOS', limit_value: 2, unit: 'portfolios' },
        ],
        skipDuplicates: true,
    });
    console.log(`  ✅ ${planBasic.name} (10 eventos/mes, 5GB)`);

    // PLAN PRO
    const planPro = await prisma.platform_plans.upsert({
        where: { slug: 'pro' },
        update: {},
        create: {
            name: 'Pro',
            slug: 'pro',
            description: 'Para estudios en crecimiento',
            price_monthly: 699, // MXN
            price_yearly: 6990, // MXN (ahorro 17%)
            stripe_product_id: 'prod_pro_demo',
            stripe_price_id: 'price_pro_demo',
            features: {
                modules: ['manager', 'marketing', 'magic', 'pages'],
                support: 'email_chat',
                analytics: 'advanced',
            },
            popular: true,
            active: true,
            orden: 2,
        },
    });

    await prisma.plan_limits.createMany({
        data: [
            { plan_id: planPro.id, limit_type: 'EVENTS_PER_MONTH', limit_value: 30, unit: 'eventos' },
            { plan_id: planPro.id, limit_type: 'STORAGE_GB', limit_value: 25, unit: 'GB' },
            { plan_id: planPro.id, limit_type: 'TEAM_MEMBERS', limit_value: 10, unit: 'usuarios' },
            { plan_id: planPro.id, limit_type: 'PORTFOLIOS', limit_value: 10, unit: 'portfolios' },
            { plan_id: planPro.id, limit_type: 'GANTT_TEMPLATES', limit_value: 5, unit: 'templates' },
        ],
        skipDuplicates: true,
    });
    console.log(`  ✅ ${planPro.name} (30 eventos/mes, 25GB) ⭐`);

    // PLAN ENTERPRISE
    const planEnterprise = await prisma.platform_plans.upsert({
        where: { slug: 'enterprise' },
        update: {},
        create: {
            name: 'Enterprise',
            slug: 'enterprise',
            description: 'Para estudios grandes con alto volumen',
            price_monthly: 999, // MXN
            price_yearly: 9990, // MXN (ahorro 17%)
            stripe_product_id: 'prod_enterprise_demo',
            stripe_price_id: 'price_enterprise_demo',
            features: {
                modules: ['manager', 'marketing', 'magic', 'pages'],
                support: 'priority',
                analytics: 'enterprise',
                custom_domain: true,
            },
            popular: false,
            active: true,
            orden: 3,
        },
    });

    await prisma.plan_limits.createMany({
        data: [
            { plan_id: planEnterprise.id, limit_type: 'EVENTS_PER_MONTH', limit_value: -1, unit: 'eventos' }, // ilimitado
            { plan_id: planEnterprise.id, limit_type: 'STORAGE_GB', limit_value: 100, unit: 'GB' },
            { plan_id: planEnterprise.id, limit_type: 'TEAM_MEMBERS', limit_value: -1, unit: 'usuarios' },
            { plan_id: planEnterprise.id, limit_type: 'PORTFOLIOS', limit_value: -1, unit: 'portfolios' },
            { plan_id: planEnterprise.id, limit_type: 'GANTT_TEMPLATES', limit_value: -1, unit: 'templates' },
        ],
        skipDuplicates: true,
    });
    console.log(`  ✅ ${planEnterprise.name} (ilimitado)`);
}

// ============================================
// 5. DEMO STUDIO
// ============================================

async function seedDemoStudio() {
    console.log('🏢 Seeding demo studio...');

    const demoStudio = await prisma.studios.upsert({
        where: { slug: DEMO_STUDIO_SLUG },
        update: { updated_at: new Date() },
        create: {
            id: DEMO_STUDIO_ID,
            studio_name: 'Demo Studio',
            slug: DEMO_STUDIO_SLUG,
            email: 'contacto@demo-studio.com',
            phone: '+52 33 1234 5678',
            address: 'Av. Revolución 1234, Guadalajara, JAL',
            slogan: 'Capturamos tus momentos inolvidables',
            descripcion: 'Estudio fotográfico profesional especializado en bodas, XV años y eventos sociales',
            palabras_clave: 'fotografía, bodas, eventos, Guadalajara',
            subscription_status: 'TRIAL',
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
        },
    });
    console.log(`  ✅ ${demoStudio.studio_name}`);

    // Configuración del studio
    await prisma.studio_configuraciones.create({
        data: {
            studio_id: demoStudio.id,
            nombre: 'Configuración Principal',
            utilidad_servicio: 35, // 35% de utilidad en servicios
            utilidad_producto: 40, // 40% de utilidad en productos
            comision_venta: 5, // 5% de comisión por venta
            sobreprecio: 0,
            status: 'active',
        },
    });
    console.log(`  ✅ Configuración creada`);

    // Activar módulos CORE
    const modulesToActivate = ['manager', 'marketing', 'magic', 'pages'];

    for (const moduleSlug of modulesToActivate) {
        const moduleData = await prisma.platform_modules.findUnique({
            where: { slug: moduleSlug },
        });

        if (moduleData) {
            await prisma.studio_modules.upsert({
                where: {
                    studio_id_module_id: {
                        studio_id: demoStudio.id,
                        module_id: moduleData.id,
                    },
                },
                update: { is_active: true, updated_at: new Date() },
                create: {
                    studio_id: demoStudio.id,
                    module_id: moduleData.id,
                    is_active: true,
                    activated_at: new Date(),
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });
            console.log(`  ✅ Módulo activado: ${moduleData.name}`);
        }
    }
}

// ============================================
// 6. USERS (Multi-Contexto)
// ============================================

async function seedUsers() {
    console.log('👥 Seeding users...');

    // 1. Super Admin
    const superAdmin = await prisma.users.upsert({
        where: { email: 'admin@prosocial.mx' },
        update: {},
        create: {
            supabase_id: 'superadmin-supabase-uuid',
            email: 'admin@prosocial.mx',
            full_name: 'Super Administrador',
            is_active: true,
        },
    });

    await prisma.user_platform_roles.upsert({
        where: {
            user_id_role: {
                user_id: superAdmin.id,
                role: 'SUPER_ADMIN',
            },
        },
        update: {},
        create: {
            user_id: superAdmin.id,
            role: 'SUPER_ADMIN',
            is_active: true,
            granted_at: new Date(),
        },
    });
    console.log(`  ✅ Super Admin: ${superAdmin.email}`);

    // 2. Studio Owner
    const owner = await prisma.users.upsert({
        where: { email: 'owner@demo-studio.com' },
        update: {},
        create: {
            supabase_id: 'owner-supabase-uuid',
            email: 'owner@demo-studio.com',
            full_name: 'Carlos Méndez',
            phone: '+52 33 1234 5678',
            is_active: true,
        },
    });

    // Rol de plataforma: SUSCRIPTOR
    await prisma.user_platform_roles.upsert({
        where: {
            user_id_role: {
                user_id: owner.id,
                role: 'SUSCRIPTOR',
            },
        },
        update: {},
        create: {
            user_id: owner.id,
            role: 'SUSCRIPTOR',
            is_active: true,
            granted_at: new Date(),
        },
    });

    // Rol en studio: OWNER
    await prisma.user_studio_roles.upsert({
        where: {
            user_id_studio_id_role: {
                user_id: owner.id,
                studio_id: DEMO_STUDIO_ID,
                role: 'OWNER',
            },
        },
        update: {},
        create: {
            user_id: owner.id,
            studio_id: DEMO_STUDIO_ID,
            role: 'OWNER',
            is_active: true,
            invited_at: new Date(),
            accepted_at: new Date(),
        },
    });
    console.log(`  ✅ Studio Owner: ${owner.email}`);

    // 3. Fotógrafo (personal operativo)
    const photographer = await prisma.users.upsert({
        where: { email: 'fotografo@demo-studio.com' },
        update: {},
        create: {
            supabase_id: 'photographer-supabase-uuid',
            email: 'fotografo@demo-studio.com',
            full_name: 'Juan Pérez',
            phone: '+52 33 8765 4321',
            is_active: true,
        },
    });

    await prisma.user_studio_roles.upsert({
        where: {
            user_id_studio_id_role: {
                user_id: photographer.id,
                studio_id: DEMO_STUDIO_ID,
                role: 'PHOTOGRAPHER',
            },
        },
        update: {},
        create: {
            user_id: photographer.id,
            studio_id: DEMO_STUDIO_ID,
            role: 'PHOTOGRAPHER',
            is_active: true,
            invited_at: new Date(),
            accepted_at: new Date(),
        },
    });
    console.log(`  ✅ Photographer: ${photographer.email}`);
}

// ============================================
// 7. PIPELINES V2.0
// ============================================

async function seedPipelines() {
    console.log('📊 Seeding pipelines V2.0...');

    // MARKETING PIPELINE
    const marketingStages = [
        { slug: 'lead-nuevo', name: 'Lead Nuevo', stage_type: 'PROSPECTING' as const, color: '#3B82F6', order: 0 },
        { slug: 'contactado', name: 'Contactado', stage_type: 'PROSPECTING' as const, color: '#8B5CF6', order: 1 },
        { slug: 'calificado', name: 'Calificado', stage_type: 'QUALIFICATION' as const, color: '#10B981', order: 2 },
        { slug: 'propuesta', name: 'Propuesta Enviada', stage_type: 'PROPOSAL' as const, color: '#F59E0B', order: 3 },
        { slug: 'negociacion', name: 'Negociación', stage_type: 'PROPOSAL' as const, color: '#EF4444', order: 4 },
        { slug: 'ganado', name: 'Ganado', stage_type: 'CONVERSION' as const, color: '#059669', order: 5, is_system: true },
        { slug: 'perdido', name: 'Perdido', stage_type: 'CLOSED_LOST' as const, color: '#6B7280', order: 6, is_system: true },
    ];

    for (const stage of marketingStages) {
        await prisma.marketing_pipeline_stages.upsert({
            where: {
                studio_id_slug: {
                    studio_id: DEMO_STUDIO_ID,
                    slug: stage.slug,
                },
            },
            update: {},
            create: {
                studio_id: DEMO_STUDIO_ID,
                ...stage,
                is_active: true,
                is_system: stage.is_system || false,
                created_at: new Date(),
                updated_at: new Date(),
            },
        });
    }
    console.log(`  ✅ Marketing Pipeline (${marketingStages.length} stages)`);

    // MANAGER PIPELINE
    const managerStages = [
        { slug: 'planeacion', name: 'Planeación', stage_type: 'PLANNING' as const, color: '#3B82F6', order: 0 },
        { slug: 'preparacion', name: 'Preparación', stage_type: 'PLANNING' as const, color: '#8B5CF6', order: 1 },
        { slug: 'produccion', name: 'Producción', stage_type: 'PRODUCTION' as const, color: '#EF4444', order: 2 },
        { slug: 'post-produccion', name: 'Post-Producción', stage_type: 'POST_PRODUCTION' as const, color: '#F59E0B', order: 3 },
        { slug: 'entrega', name: 'Entrega', stage_type: 'DELIVERY' as const, color: '#06B6D4', order: 4 },
        { slug: 'garantia', name: 'Garantía', stage_type: 'WARRANTY' as const, color: '#10B981', order: 5 },
        { slug: 'completado', name: 'Completado', stage_type: 'COMPLETED' as const, color: '#059669', order: 6, is_system: true },
    ];

    for (const stage of managerStages) {
        await prisma.manager_pipeline_stages.upsert({
            where: {
                studio_id_slug: {
                    studio_id: DEMO_STUDIO_ID,
                    slug: stage.slug,
                },
            },
            update: {},
            create: {
                studio_id: DEMO_STUDIO_ID,
                ...stage,
                is_active: true,
                is_system: stage.is_system || false,
                created_at: new Date(),
                updated_at: new Date(),
            },
        });
    }
    console.log(`  ✅ Manager Pipeline (${managerStages.length} stages)`);
}

// ============================================
// 8. CATÁLOGO (sample)
// ============================================

async function seedCatalogo() {
    console.log('📁 Seeding catálogo...');

    // Secciones
    const seccion = await prisma.studio_servicio_secciones.upsert({
        where: { nombre: 'Cobertura del Evento' },
        update: {},
        create: {
            nombre: 'Cobertura del Evento',
            descripcion: 'Servicios de fotografía y video el día del evento',
            orden: 0,
        },
    });

    // Categoría
    const categoria = await prisma.studio_servicio_categorias.upsert({
        where: { nombre: 'Fotografía de evento' },
        update: {},
        create: {
            nombre: 'Fotografía de evento',
            orden: 0,
        },
    });

    // Relación sección-categoría
    await prisma.studio_seccion_categorias.createMany({
        data: {
            seccion_id: seccion.id,
            categoria_id: categoria.id,
        },
        skipDuplicates: true,
    });

    // Servicios (solo costo y gasto - utilidad se calcula al vuelo)
    const servicios = [
        { nombre: 'Fotógrafo principal por hora', costo: 500, orden: 0 },
        { nombre: 'Asistente de iluminación por hora', costo: 200, orden: 1 },
        { nombre: 'Revelado digital de fotos', costo: 1500, orden: 2 },
    ];

    await prisma.studio_servicios.createMany({
        data: servicios.map(servicio => ({
            studio_id: DEMO_STUDIO_ID,
            servicio_categoria_id: categoria.id,
            nombre: servicio.nombre,
            costo: servicio.costo,
            gasto: 0,
            tipo_utilidad: 'servicio',
            orden: servicio.orden,
            status: 'active',
        })),
        skipDuplicates: true,
    });
    console.log(`  ✅ Catálogo (${servicios.length} servicios)`);
}

// ============================================
// 9. TIPOS DE EVENTO
// ============================================

async function seedTiposEvento() {
    console.log('🎉 Seeding tipos de evento...');

    const tipos = [
        { nombre: 'Boda', orden: 0 },
        { nombre: 'XV Años', orden: 1 },
        { nombre: 'Sesión Familiar', orden: 2 },
        { nombre: 'Sesión Embarazo', orden: 3 },
        { nombre: 'Evento Corporativo', orden: 4 },
    ];

    await prisma.studio_evento_tipos.createMany({
        data: tipos.map(tipo => ({
            studio_id: DEMO_STUDIO_ID,
            nombre: tipo.nombre,
            status: 'active',
            orden: tipo.orden,
            created_at: new Date(),
            updated_at: new Date(),
        })),
        skipDuplicates: true,
    });
    console.log(`  ✅ ${tipos.length} tipos de evento`);
}

// ============================================
// 10. DEMO LEAD
// ============================================

async function seedDemoLead() {
    console.log('👤 Seeding demo lead...');

    const demoLead = await prisma.platform_leads.create({
        data: {
            studio_id: DEMO_STUDIO_ID,
            name: 'Carlos Méndez',
            email: 'owner@demo-studio.com',
            phone: '+52 33 1234 5678',
            studio_name: 'Demo Studio',
            studio_slug: DEMO_STUDIO_SLUG,
            interested_plan: 'pro',
            score: 8,
            priority: 'high',
            stage_id: null, // No hay stages configurados aún
            acquisition_channel_id: null, // Se puede asignar después
            agent_id: null, // Se puede asignar después
            probable_start_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    console.log(`  ✅ Demo Lead: ${demoLead.name} (${demoLead.email})`);
}

// ============================================
// EXECUTE
// ============================================

main()
    .catch((e) => {
        console.error('❌ Error en seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });