export const LEAD_STATUS = {
    NUEVO: "nuevo",
    CONTACTADO: "contactado",
    CALIFICADO: "calificado",
    PROPUESTA: "propuesta",
    NEGOCIACION: "negociacion",
    GANADO: "ganado",
    PERDIDO: "perdido",
    ARCHIVADO: "archivado",
} as const;

export const STUDIO_STATUS = {
    ACTIVO: "activo",
    INACTIVO: "inactivo",
    SUSPENDIDO: "suspendido",
    PENDIENTE: "pendiente",
} as const;

export const USER_ROLES = {
    SUPER_ADMIN: "super_admin",
    AGENTE: "agente",
    SUSCRIPTOR: "suscriptor",
} as const;

export const CLIENT_STATUS = {
    ACTIVO: "activo",
    INACTIVO: "inactivo",
    POTENCIAL: "potencial",
    CONVERTIDO: "convertido",
} as const;

export const QUOTE_STATUS = {
    BORRADOR: "borrador",
    ENVIADA: "enviada",
    APROBADA: "aprobada",
    RECHAZADA: "rechazada",
    EXPIRADA: "expirada",
} as const;

export const ACTIVITY_TYPES = {
    LLAMADA: "llamada",
    EMAIL: "email",
    REUNION: "reunion",
    NOTA: "nota",
    TAREA: "tarea",
} as const;

// Tipos derivados
export type LeadStatus = (typeof LEAD_STATUS)[keyof typeof LEAD_STATUS];
export type StudioStatus = (typeof STUDIO_STATUS)[keyof typeof STUDIO_STATUS];
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
export type ClientStatus = (typeof CLIENT_STATUS)[keyof typeof CLIENT_STATUS];
export type QuoteStatus = (typeof QUOTE_STATUS)[keyof typeof QUOTE_STATUS];
export type ActivityType = (typeof ACTIVITY_TYPES)[keyof typeof ACTIVITY_TYPES];
