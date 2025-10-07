// src/types/setup-validation.ts

export interface SetupSectionConfig {
    id: string;
    sectionId: string;
    sectionName: string;
    description: string;
    requiredFields: string[];
    optionalFields: string[];
    dependencies: string[];
    weight: number;
    isActive: boolean;
}

export interface ValidationResult {
    isValid: boolean;
    completionPercentage: number;
    completedFields: string[];
    missingFields: string[];
    errors: string[];
}

export interface SetupSectionProgress {
    id: string;
    name: string;
    sectionId?: string;
    setupStatusId?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'error';
    completionPercentage: number;
    completedFields: string[];
    missingFields: string[];
    errors?: string[];
    completedAt?: Date;
    lastUpdatedAt: Date;
}

export interface StudioSetupStatus {
    id: string;
    projectId: string;
    overallProgress: number;
    isFullyConfigured: boolean;
    lastValidatedAt: Date;
    sections: SetupSectionProgress[];
}

export interface SetupProgressLog {
    id?: string;
    projectId: string;
    sectionId?: string;
    action: 'created' | 'updated' | 'completed' | 'error';
    oldStatus?: string;
    newStatus?: string;
    details?: Record<string, unknown>;
    source: 'manual' | 'ai' | 'system';
    createdAt: Date;
}

// Configuración de secciones por defecto
export const SETUP_SECTIONS_CONFIG: SetupSectionConfig[] = [
    // Estudio
    {
        id: 'estudio_identidad',
        sectionId: 'estudio_identidad',
        sectionName: 'Identidad de Marca',
        description: 'Nombre del negocio, logo, colores principales',
        requiredFields: ['name', 'slug'],
        optionalFields: ['logoUrl', 'slogan', 'descripcion'],
        dependencies: [],
        weight: 15,
        isActive: true
    },
    {
        id: 'estudio_contacto',
        sectionId: 'estudio_contacto',
        sectionName: 'Información de Contacto',
        description: 'Correo público, teléfono, dirección del estudio',
        requiredFields: ['email'],
        optionalFields: ['phone', 'address', 'website'],
        dependencies: [],
        weight: 10,
        isActive: true
    },
    {
        id: 'estudio_redes_sociales',
        sectionId: 'estudio_redes_sociales',
        sectionName: 'Presencia en Línea',
        description: 'Redes sociales, sitio web',
        requiredFields: [],
        optionalFields: ['redes_sociales'],
        dependencies: [],
        weight: 5,
        isActive: true
    },
    {
        id: 'estudio_horarios',
        sectionId: 'estudio_horarios',
        sectionName: 'Horarios de Atención',
        description: 'Días y horas en que atiendes a clientes',
        requiredFields: [],
        optionalFields: ['horarios_atencion'],
        dependencies: [],
        weight: 5,
        isActive: true
    },

    // Negocio
    {
        id: 'negocio_precios',
        sectionId: 'negocio_precios',
        sectionName: 'Precios y Utilidad',
        description: 'Define tus reglas maestras de precios',
        requiredFields: [],
        optionalFields: ['configuraciones'],
        dependencies: [],
        weight: 15,
        isActive: true
    },
    {
        id: 'negocio_condiciones',
        sectionId: 'negocio_condiciones',
        sectionName: 'Condiciones Comerciales',
        description: 'Crea tus planes de pago',
        requiredFields: [],
        optionalFields: ['condiciones_comerciales'],
        dependencies: ['negocio_precios'],
        weight: 10,
        isActive: true
    },
    {
        id: 'negocio_metodos_pago',
        sectionId: 'negocio_metodos_pago',
        sectionName: 'Métodos de Pago',
        description: 'Configura las formas en que tus clientes pueden pagarte',
        requiredFields: [],
        optionalFields: ['metodos_pago'],
        dependencies: [],
        weight: 10,
        isActive: true
    },
    {
        id: 'negocio_cuentas_bancarias',
        sectionId: 'negocio_cuentas_bancarias',
        sectionName: 'Cuentas Bancarias',
        description: 'Registra la cuenta donde recibirás los pagos',
        requiredFields: [],
        optionalFields: [],
        dependencies: ['negocio_metodos_pago'],
        weight: 5,
        isActive: true
    },

    // Catálogo
    {
        id: 'catalogo_servicios',
        sectionId: 'catalogo_servicios',
        sectionName: 'Servicios',
        description: 'Lista detallada de todos tus servicios individuales',
        requiredFields: [],
        optionalFields: ['servicios'],
        dependencies: ['negocio_precios'],
        weight: 15,
        isActive: true
    },
    {
        id: 'catalogo_paquetes',
        sectionId: 'catalogo_paquetes',
        sectionName: 'Paquetes',
        description: 'Crea y combina servicios para ofrecer paquetes atractivos',
        requiredFields: [],
        optionalFields: ['paquetes'],
        dependencies: ['catalogo_servicios'],
        weight: 10,
        isActive: true
    },
    {
        id: 'catalogo_especialidades',
        sectionId: 'catalogo_especialidades',
        sectionName: 'Especialidades',
        description: 'Organiza tus servicios y paquetes por tipo de evento',
        requiredFields: [],
        optionalFields: [],
        dependencies: ['catalogo_servicios'],
        weight: 5,
        isActive: true
    },

    // Equipo
    {
        id: 'equipo_empleados',
        sectionId: 'equipo_empleados',
        sectionName: 'Miembros del Equipo',
        description: 'Gestiona los perfiles de tus empleados y proveedores',
        requiredFields: [],
        optionalFields: ['studio_users'],
        dependencies: [],
        weight: 5,
        isActive: true
    }
];
