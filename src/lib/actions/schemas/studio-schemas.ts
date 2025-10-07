import { z } from "zod";
import { STUDIO_STATUS } from "../constants/status";
import { NameSchema, EmailSchema, PhoneSchema, AddressSchema, ScheduleSchema, SocialMediaSchema, IdSchema } from "./shared-schemas";

// Schema para crear studio
export const StudioCreateSchema = z.object({
    nombre: NameSchema,
    slug: z.string().regex(/^[a-z0-9-]+$/, "Slug inválido (solo minúsculas, números y guiones)"),
    email: EmailSchema,
    telefono: PhoneSchema.optional(),
    direccion: AddressSchema.optional(),
    planId: IdSchema,
    agenteId: IdSchema.optional(),
    status: z.enum(Object.values(STUDIO_STATUS) as [string, ...string[]]).default(STUDIO_STATUS.ACTIVO),
    descripcion: z.string().max(500).optional(),
    sitioWeb: z.string().url("URL inválida").optional(),
    logo: z.string().url("URL inválida").optional(),
    horarios: z.array(ScheduleSchema).optional(),
    redesSociales: z.array(SocialMediaSchema).optional(),
});

// Schema para actualizar studio
export const StudioUpdateSchema = StudioCreateSchema.partial().extend({
    id: IdSchema,
});

// Schema para configuración de cuenta
export const StudioAccountConfigSchema = z.object({
    nombre: NameSchema,
    email: EmailSchema,
    telefono: PhoneSchema.optional(),
    direccion: AddressSchema.optional(),
    sitioWeb: z.string().url("URL inválida").optional(),
    descripcion: z.string().max(500).optional(),
});

// Schema para configuración de negocio
export const StudioBusinessConfigSchema = z.object({
    nombreComercial: NameSchema,
    rfc: z.string().regex(/^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/, "RFC inválido").optional(),
    giro: z.string().optional(),
    experiencia: z.number().min(0).optional(),
    especialidades: z.array(z.string()).optional(),
    servicios: z.array(z.string()).optional(),
    precios: z.object({
        rangoMinimo: z.number().min(0).optional(),
        rangoMaximo: z.number().min(0).optional(),
        moneda: z.string().default("MXN"),
    }).optional(),
});

// Schema para configuración de personal
export const StudioStaffConfigSchema = z.object({
    nombre: NameSchema,
    cargo: z.string().optional(),
    telefono: PhoneSchema.optional(),
    email: EmailSchema.optional(),
    permisos: z.array(z.string()).optional(),
    activo: z.boolean().default(true),
});

// Schema para configuración de horarios
export const StudioScheduleConfigSchema = z.object({
    horarios: z.array(ScheduleSchema),
    zonaHoraria: z.string().default("America/Mexico_City"),
    diasLaborales: z.array(z.enum(["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"])),
    horarioEspecial: z.object({
        activo: z.boolean().default(false),
        fechaInicio: z.string().optional(),
        fechaFin: z.string().optional(),
        horarios: z.array(ScheduleSchema).optional(),
    }).optional(),
});

// Schema para configuración de redes sociales
export const StudioSocialMediaConfigSchema = z.object({
    redesSociales: z.array(SocialMediaSchema),
});

// Schema para configuración de integraciones
export const StudioIntegrationsConfigSchema = z.object({
    stripe: z.object({
        activo: z.boolean().default(false),
        publicKey: z.string().optional(),
        webhookSecret: z.string().optional(),
    }).optional(),
    email: z.object({
        activo: z.boolean().default(false),
        provider: z.enum(["gmail", "outlook", "custom"]).optional(),
        config: z.record(z.string(), z.string()).optional(),
    }).optional(),
    calendario: z.object({
        activo: z.boolean().default(false),
        provider: z.enum(["google", "outlook", "apple"]).optional(),
        config: z.record(z.string(), z.string()).optional(),
    }).optional(),
});

// Schema para filtros de studios
export const StudioFiltersSchema = z.object({
    status: z.enum(Object.values(STUDIO_STATUS) as [string, ...string[]]).optional(),
    planId: z.string().optional(),
    agenteId: z.string().optional(),
    desde: z.string().optional(),
    hasta: z.string().optional(),
    query: z.string().optional(),
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(20),
});

// Schema para estadísticas de studio
export const StudioStatsSchema = z.object({
    periodo: z.enum(["dia", "semana", "mes", "trimestre", "año"]).default("mes"),
    desde: z.string().optional(),
    hasta: z.string().optional(),
    metricas: z.array(z.enum(["leads", "clientes", "cotizaciones", "ingresos", "actividades"])).optional(),
});

// Tipos derivados
export type StudioCreateForm = z.infer<typeof StudioCreateSchema>;
export type StudioUpdateForm = z.infer<typeof StudioUpdateSchema>;
export type StudioAccountConfigForm = z.infer<typeof StudioAccountConfigSchema>;
export type StudioBusinessConfigForm = z.infer<typeof StudioBusinessConfigSchema>;
export type StudioStaffConfigForm = z.infer<typeof StudioStaffConfigSchema>;
export type StudioScheduleConfigForm = z.infer<typeof StudioScheduleConfigSchema>;
export type StudioSocialMediaConfigForm = z.infer<typeof StudioSocialMediaConfigSchema>;
export type StudioIntegrationsConfigForm = z.infer<typeof StudioIntegrationsConfigSchema>;
export type StudioFiltersForm = z.infer<typeof StudioFiltersSchema>;
export type StudioStatsForm = z.infer<typeof StudioStatsSchema>;
