// Enums para el sistema
export const ENUMS = {
    // Estados de procesamiento
    PROCESSING_STATUS: {
        PENDING: "pending",
        PROCESSING: "processing",
        COMPLETED: "completed",
        FAILED: "failed",
        CANCELLED: "cancelled",
    },

    // Tipos de notificación
    NOTIFICATION_TYPES: {
        INFO: "info",
        SUCCESS: "success",
        WARNING: "warning",
        ERROR: "error",
    },

    // Tipos de archivo
    FILE_TYPES: {
        IMAGE: "image",
        DOCUMENT: "document",
        VIDEO: "video",
        AUDIO: "audio",
        OTHER: "other",
    },

    // Tipos de integración
    INTEGRATION_TYPES: {
        STRIPE: "stripe",
        EMAIL: "email",
        SMS: "sms",
        WEBHOOK: "webhook",
        API: "api",
    },

    // Tipos de evento
    EVENT_TYPES: {
        USER_LOGIN: "user_login",
        USER_LOGOUT: "user_logout",
        LEAD_CREATED: "lead_created",
        LEAD_UPDATED: "lead_updated",
        LEAD_DELETED: "lead_deleted",
        CLIENT_CREATED: "client_created",
        CLIENT_UPDATED: "client_updated",
        QUOTE_CREATED: "quote_created",
        QUOTE_SENT: "quote_sent",
        QUOTE_APPROVED: "quote_approved",
        QUOTE_REJECTED: "quote_rejected",
        PAYMENT_RECEIVED: "payment_received",
        PAYMENT_FAILED: "payment_failed",
    },

    // Tipos de canal de comunicación
    COMMUNICATION_CHANNELS: {
        EMAIL: "email",
        PHONE: "phone",
        SMS: "sms",
        WHATSAPP: "whatsapp",
        FACEBOOK: "facebook",
        INSTAGRAM: "instagram",
        WEBSITE: "website",
        REFERRAL: "referral",
        OTHER: "other",
    },

    // Tipos de actividad
    ACTIVITY_TYPES: {
        CALL: "call",
        EMAIL: "email",
        MEETING: "meeting",
        NOTE: "note",
        TASK: "task",
        FOLLOW_UP: "follow_up",
        QUOTE_SENT: "quote_sent",
        CONTRACT_SIGNED: "contract_signed",
        PAYMENT_RECEIVED: "payment_received",
    },

    // Prioridades
    PRIORITIES: {
        LOW: "low",
        MEDIUM: "medium",
        HIGH: "high",
        URGENT: "urgent",
    },

    // Frecuencias
    FREQUENCIES: {
        DAILY: "daily",
        WEEKLY: "weekly",
        MONTHLY: "monthly",
        QUARTERLY: "quarterly",
        YEARLY: "yearly",
    },

    // Tipos de reporte
    REPORT_TYPES: {
        LEADS: "leads",
        CLIENTS: "clients",
        QUOTES: "quotes",
        PAYMENTS: "payments",
        ACTIVITIES: "activities",
        PERFORMANCE: "performance",
        FINANCIAL: "financial",
    },

    // Formatos de exportación
    EXPORT_FORMATS: {
        PDF: "pdf",
        EXCEL: "excel",
        CSV: "csv",
        JSON: "json",
    },
} as const;

// Tipos derivados para TypeScript
export type ProcessingStatus = (typeof ENUMS.PROCESSING_STATUS)[keyof typeof ENUMS.PROCESSING_STATUS];
export type NotificationType = (typeof ENUMS.NOTIFICATION_TYPES)[keyof typeof ENUMS.NOTIFICATION_TYPES];
export type FileType = (typeof ENUMS.FILE_TYPES)[keyof typeof ENUMS.FILE_TYPES];
export type IntegrationType = (typeof ENUMS.INTEGRATION_TYPES)[keyof typeof ENUMS.INTEGRATION_TYPES];
export type EventType = (typeof ENUMS.EVENT_TYPES)[keyof typeof ENUMS.EVENT_TYPES];
export type CommunicationChannel = (typeof ENUMS.COMMUNICATION_CHANNELS)[keyof typeof ENUMS.COMMUNICATION_CHANNELS];
export type ActivityType = (typeof ENUMS.ACTIVITY_TYPES)[keyof typeof ENUMS.ACTIVITY_TYPES];
export type Priority = (typeof ENUMS.PRIORITIES)[keyof typeof ENUMS.PRIORITIES];
export type Frequency = (typeof ENUMS.FREQUENCIES)[keyof typeof ENUMS.FREQUENCIES];
export type ReportType = (typeof ENUMS.REPORT_TYPES)[keyof typeof ENUMS.REPORT_TYPES];
export type ExportFormat = (typeof ENUMS.EXPORT_FORMATS)[keyof typeof ENUMS.EXPORT_FORMATS];
