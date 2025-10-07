import { z } from "zod";
import { IdSchema, UrlSchema } from "./shared-schemas";

// Schema para plataforma de red social
export const PlataformaSchema = z.object({
    id: IdSchema,
    name: z.string().min(1, "Nombre requerido"),
    slug: z.string().min(1, "Slug requerido"),
    description: z.string().optional(),
    color: z.string().optional(),
    icon: z.string().optional(),
    baseUrl: z.string().url("URL base inválida").optional(),
    order: z.number().min(0).default(0),
});

// Schema para crear red social
export const RedSocialCreateSchema = z.object({
    plataformaId: IdSchema,
    url: z.string().url("URL inválida"),
    activo: z.boolean().default(true),
});

// Schema para actualizar red social
export const RedSocialUpdateSchema = z.object({
    id: IdSchema,
    url: z.string().url("URL inválida").optional(),
    activo: z.boolean().optional(),
});

// Schema para actualizar múltiples redes sociales
export const RedSocialBulkUpdateSchema = z.object({
    redesSociales: z.array(RedSocialUpdateSchema),
});

// Schema para eliminar red social
export const RedSocialDeleteSchema = z.object({
    id: IdSchema,
});

// Schema para toggle de estado
export const RedSocialToggleSchema = z.object({
    id: IdSchema,
    activo: z.boolean(),
});

// Schema para filtros de redes sociales
export const RedSocialFiltersSchema = z.object({
    activo: z.boolean().optional(),
    plataformaId: z.string().optional(),
    query: z.string().optional(),
});

// Schema para estadísticas de redes sociales
export const RedSocialStatsSchema = z.object({
    periodo: z.enum(["dia", "semana", "mes", "trimestre", "año"]).default("mes"),
    desde: z.string().optional(),
    hasta: z.string().optional(),
});

// Tipos derivados
export type PlataformaForm = z.infer<typeof PlataformaSchema>;
export type RedSocialCreateForm = z.infer<typeof RedSocialCreateSchema>;
export type RedSocialUpdateForm = z.infer<typeof RedSocialUpdateSchema>;
export type RedSocialBulkUpdateForm = z.infer<typeof RedSocialBulkUpdateSchema>;
export type RedSocialDeleteForm = z.infer<typeof RedSocialDeleteSchema>;
export type RedSocialToggleForm = z.infer<typeof RedSocialToggleSchema>;
export type RedSocialFiltersForm = z.infer<typeof RedSocialFiltersSchema>;
export type RedSocialStatsForm = z.infer<typeof RedSocialStatsSchema>;
