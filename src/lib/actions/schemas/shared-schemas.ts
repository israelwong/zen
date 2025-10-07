import { z } from "zod";
import { APP_CONFIG } from "../constants/config";

// Schema base para paginación
export const PaginationSchema = z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(APP_CONFIG.MAX_PAGE_SIZE).default(APP_CONFIG.DEFAULT_PAGE_SIZE),
});

// Schema para rango de fechas
export const DateRangeSchema = z.object({
    desde: z.string().optional(),
    hasta: z.string().optional(),
});

// Schema para búsqueda
export const SearchSchema = z.object({
    query: z.string().optional(),
    ...PaginationSchema.shape,
});

// Schema para filtros comunes
export const CommonFiltersSchema = z.object({
    ...PaginationSchema.shape,
    ...DateRangeSchema.shape,
    query: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Schema para IDs
export const IdSchema = z.string().min(1, "ID requerido");

// Schema para emails
export const EmailSchema = z.string().email("Email inválido");

// Schema para teléfonos
export const PhoneSchema = z.string().min(10, "Teléfono debe tener al menos 10 dígitos");

// Schema para nombres
export const NameSchema = z.string()
    .min(APP_CONFIG.MIN_NAME_LENGTH, `Nombre debe tener al menos ${APP_CONFIG.MIN_NAME_LENGTH} caracteres`)
    .max(APP_CONFIG.MAX_NAME_LENGTH, `Nombre no puede exceder ${APP_CONFIG.MAX_NAME_LENGTH} caracteres`);

// Schema para contraseñas
export const PasswordSchema = z.string()
    .min(APP_CONFIG.MIN_PASSWORD_LENGTH, `Contraseña debe tener al menos ${APP_CONFIG.MIN_PASSWORD_LENGTH} caracteres`)
    .max(APP_CONFIG.MAX_PASSWORD_LENGTH, `Contraseña no puede exceder ${APP_CONFIG.MAX_PASSWORD_LENGTH} caracteres`);

// Schema para notas
export const NotesSchema = z.string()
    .max(APP_CONFIG.MAX_NOTES_LENGTH, `Notas no pueden exceder ${APP_CONFIG.MAX_NOTES_LENGTH} caracteres`)
    .optional();

// Schema para URLs
export const UrlSchema = z.string().url("URL inválida").optional();

// Schema para archivos
export const FileSchema = z.object({
    name: z.string(),
    size: z.number().max(APP_CONFIG.MAX_FILE_SIZE, "Archivo demasiado grande"),
    type: z.string(),
    url: z.string().url(),
});

// Schema para direcciones
export const AddressSchema = z.object({
    calle: z.string().optional(),
    numero: z.string().optional(),
    colonia: z.string().optional(),
    ciudad: z.string().optional(),
    estado: z.string().optional(),
    codigoPostal: z.string().optional(),
    pais: z.string().default("México"),
});

// Schema para coordenadas
export const CoordinatesSchema = z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
});

// Schema para horarios
export const ScheduleSchema = z.object({
    dia: z.enum(["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"]),
    apertura: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:MM)"),
    cierre: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:MM)"),
    activo: z.boolean().default(true),
});

// Schema para redes sociales
export const SocialMediaSchema = z.object({
    plataforma: z.string(),
    url: z.string().url("URL inválida"),
    activo: z.boolean().default(true),
});

// Schema para configuración de notificaciones
export const NotificationPreferencesSchema = z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
    sms: z.boolean().default(false),
    leadCreated: z.boolean().default(true),
    leadUpdated: z.boolean().default(true),
    quoteSent: z.boolean().default(true),
    paymentReceived: z.boolean().default(true),
});

// Tipos derivados
export type PaginationForm = z.infer<typeof PaginationSchema>;
export type DateRangeForm = z.infer<typeof DateRangeSchema>;
export type SearchForm = z.infer<typeof SearchSchema>;
export type CommonFiltersForm = z.infer<typeof CommonFiltersSchema>;
export type IdForm = z.infer<typeof IdSchema>;
export type EmailForm = z.infer<typeof EmailSchema>;
export type PhoneForm = z.infer<typeof PhoneSchema>;
export type NameForm = z.infer<typeof NameSchema>;
export type PasswordForm = z.infer<typeof PasswordSchema>;
export type NotesForm = z.infer<typeof NotesSchema>;
export type UrlForm = z.infer<typeof UrlSchema>;
export type FileForm = z.infer<typeof FileSchema>;
export type AddressForm = z.infer<typeof AddressSchema>;
export type CoordinatesForm = z.infer<typeof CoordinatesSchema>;
export type ScheduleForm = z.infer<typeof ScheduleSchema>;
export type SocialMediaForm = z.infer<typeof SocialMediaSchema>;
export type NotificationPreferencesForm = z.infer<typeof NotificationPreferencesSchema>;
