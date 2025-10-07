import { z } from "zod";
import { LEAD_STATUS } from "../constants/status";
import { NameSchema, EmailSchema, PhoneSchema, NotesSchema, IdSchema } from "./shared-schemas";

// Schema para crear lead
export const LeadCreateSchema = z.object({
    nombre: NameSchema,
    email: EmailSchema,
    telefono: PhoneSchema.optional(),
    canalId: IdSchema,
    status: z.enum(Object.values(LEAD_STATUS) as [string, ...string[]]).default(LEAD_STATUS.NUEVO),
    notas: NotesSchema,
    fechaEvento: z.string().optional(),
    presupuesto: z.number().min(0).optional(),
    direccion: z.string().optional(),
    empresa: z.string().optional(),
    cargo: z.string().optional(),
    fuente: z.string().optional(),
    prioridad: z.enum(["baja", "media", "alta", "urgente"]).default("media"),
});

// Schema para actualizar lead
export const LeadUpdateSchema = LeadCreateSchema.partial().extend({
    id: IdSchema,
});

// Schema para filtros de leads
export const LeadFiltersSchema = z.object({
    status: z.enum(Object.values(LEAD_STATUS) as [string, ...string[]]).optional(),
    canalId: z.string().optional(),
    desde: z.string().optional(),
    hasta: z.string().optional(),
    query: z.string().optional(),
    prioridad: z.enum(["baja", "media", "alta", "urgente"]).optional(),
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(20),
});

// Schema para cambiar estado de lead
export const LeadStatusChangeSchema = z.object({
    leadId: IdSchema,
    status: z.enum(Object.values(LEAD_STATUS) as [string, ...string[]]),
    notas: NotesSchema,
});

// Schema para agregar nota a lead
export const LeadNoteSchema = z.object({
    leadId: IdSchema,
    nota: z.string().min(1, "Nota requerida").max(2000, "Nota demasiado larga"),
    tipo: z.enum(["general", "llamada", "email", "reunion", "seguimiento"]).default("general"),
});

// Schema para asignar lead
export const LeadAssignmentSchema = z.object({
    leadId: IdSchema,
    agenteId: IdSchema.optional(),
    studioId: IdSchema.optional(),
});

// Schema para duplicar lead
export const LeadDuplicateSchema = z.object({
    leadId: IdSchema,
    nuevoNombre: NameSchema.optional(),
});

// Schema para exportar leads
export const LeadExportSchema = z.object({
    formato: z.enum(["pdf", "excel", "csv"]),
    filtros: LeadFiltersSchema.optional(),
    campos: z.array(z.string()).optional(),
});

// Schema para importar leads
export const LeadImportSchema = z.object({
    archivo: z.string(), // Base64 del archivo
    formato: z.enum(["excel", "csv"]),
    mapeo: z.record(z.string(), z.string()), // Mapeo de columnas
    actualizarExistentes: z.boolean().default(false),
});

// Schema para estadísticas de leads
export const LeadStatsSchema = z.object({
    periodo: z.enum(["dia", "semana", "mes", "trimestre", "año"]).default("mes"),
    desde: z.string().optional(),
    hasta: z.string().optional(),
    agrupadoPor: z.enum(["status", "canal", "agente", "fecha"]).default("status"),
});

// Tipos derivados
export type LeadCreateForm = z.infer<typeof LeadCreateSchema>;
export type LeadUpdateForm = z.infer<typeof LeadUpdateSchema>;
export type LeadFiltersForm = z.infer<typeof LeadFiltersSchema>;
export type LeadStatusChangeForm = z.infer<typeof LeadStatusChangeSchema>;
export type LeadNoteForm = z.infer<typeof LeadNoteSchema>;
export type LeadAssignmentForm = z.infer<typeof LeadAssignmentSchema>;
export type LeadDuplicateForm = z.infer<typeof LeadDuplicateSchema>;
export type LeadExportForm = z.infer<typeof LeadExportSchema>;
export type LeadImportForm = z.infer<typeof LeadImportSchema>;
export type LeadStatsForm = z.infer<typeof LeadStatsSchema>;
