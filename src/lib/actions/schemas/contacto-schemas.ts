import { z } from "zod";
import { IdSchema } from "./shared-schemas";

// Constantes para tipos de teléfono
export const TIPOS_TELEFONO = [
    "principal",
    "whatsapp",
    "emergencia",
    "oficina"
] as const;

// Schema para crear teléfono
export const TelefonoCreateSchema = z.object({
    numero: z.string()
        .min(1, "El número de teléfono es requerido")
        .regex(/^[\+]?[0-9\s\-\(\)]+$/, "Formato de teléfono inválido")
        .max(20, "El número de teléfono es muy largo"),
    tipo: z.enum(TIPOS_TELEFONO, {
        message: "Tipo de teléfono inválido"
    }),
    activo: z.boolean().default(true),
});

// Schema para actualizar teléfono
export const TelefonoUpdateSchema = TelefonoCreateSchema.partial().extend({
    id: IdSchema,
});

// Schema para actualizar múltiples teléfonos
export const TelefonosBulkUpdateSchema = z.object({
    telefonos: z.array(TelefonoUpdateSchema),
});

// Schema para toggle de estado de teléfono
export const TelefonoToggleSchema = z.object({
    id: IdSchema,
    activo: z.boolean(),
});

// Schema para eliminar teléfono
export const TelefonoDeleteSchema = z.object({
    id: IdSchema,
});

// Schema para filtros de teléfonos
export const TelefonosFiltersSchema = z.object({
    activo: z.boolean().optional(),
    tipo: z.enum(TIPOS_TELEFONO).optional(),
});

// Schema para datos de contacto (dirección y website)
export const ContactoDataSchema = z.object({
    direccion: z.string()
        .max(500, "La dirección es muy larga")
        .optional(),
    website: z.string()
        .url("URL del website inválida")
        .max(200, "La URL del website es muy larga")
        .optional()
        .or(z.literal("")), // Permitir string vacío
});

// Schema para actualizar datos de contacto
export const ContactoDataUpdateSchema = z.object({
    field: z.enum(["direccion", "website"], {
        message: "Campo inválido"
    }),
    value: z.string().max(500, "El valor es muy largo"),
});

// Schema para actualizar múltiples campos de contacto
export const ContactoDataBulkUpdateSchema = ContactoDataSchema;

// Schema para estadísticas de contacto
export const ContactoStatsSchema = z.object({
    periodo: z.enum(["dia", "semana", "mes", "trimestre", "año"]).default("mes"),
});

// Schema para validación de número de teléfono
export const TelefonoValidationSchema = z.object({
    numero: z.string().min(1, "Número requerido"),
    pais: z.string().optional().default("MX"),
});

// Tipos derivados
export type TipoTelefono = (typeof TIPOS_TELEFONO)[number];
export type TelefonoCreateForm = z.infer<typeof TelefonoCreateSchema>;
export type TelefonoUpdateForm = z.infer<typeof TelefonoUpdateSchema>;
export type TelefonosBulkUpdateForm = z.infer<typeof TelefonosBulkUpdateSchema>;
export type TelefonoToggleForm = z.infer<typeof TelefonoToggleSchema>;
export type TelefonoDeleteForm = z.infer<typeof TelefonoDeleteSchema>;
export type TelefonosFiltersForm = z.infer<typeof TelefonosFiltersSchema>;
export type ContactoDataForm = z.infer<typeof ContactoDataSchema>;
export type ContactoDataUpdateForm = z.infer<typeof ContactoDataUpdateSchema>;
export type ContactoDataBulkUpdateForm = z.infer<typeof ContactoDataBulkUpdateSchema>;
export type ContactoStatsForm = z.infer<typeof ContactoStatsSchema>;
export type TelefonoValidationForm = z.infer<typeof TelefonoValidationSchema>;

// Constantes para tipos de teléfono con labels y colores
export const TIPOS_TELEFONO_LABELS = {
    principal: { label: "Principal", color: "bg-blue-500", icon: "📞" },
    whatsapp: { label: "WhatsApp", color: "bg-green-500", icon: "💬" },
    emergencia: { label: "Emergencia", color: "bg-red-500", icon: "🚨" },
    oficina: { label: "Oficina", color: "bg-zinc-500", icon: "🏢" }
} as const;

// Función para obtener información del tipo de teléfono
export function getTipoTelefonoInfo(tipo: TipoTelefono) {
    return TIPOS_TELEFONO_LABELS[tipo];
}

// Función para validar número de teléfono
export function validateTelefono(numero: string): boolean {
    // Regex para números de teléfono internacionales
    const telefonoRegex = /^[\+]?[0-9\s\-\(\)]+$/;
    return telefonoRegex.test(numero) && numero.length >= 7 && numero.length <= 20;
}

// Función para formatear número de teléfono
export function formatTelefono(numero: string): string {
    // Remover caracteres no numéricos excepto +
    const cleaned = numero.replace(/[^\d\+]/g, '');

    // Si no tiene código de país, agregar +52 para México
    if (!cleaned.startsWith('+')) {
        return `+52 ${cleaned}`;
    }

    return numero;
}

// Función para extraer número limpio
export function getTelefonoLimpio(numero: string): string {
    return numero.replace(/[^\d]/g, '');
}

// Función para validar URL de website
export function validateWebsite(url: string): boolean {
    if (!url) return true; // Permitir vacío

    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// Función para formatear URL de website
export function formatWebsite(url: string): string {
    if (!url) return '';

    // Si no tiene protocolo, agregar https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `https://${url}`;
    }

    return url;
}
