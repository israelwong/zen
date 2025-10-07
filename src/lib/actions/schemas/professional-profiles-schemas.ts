import { z } from "zod";
import { IdSchema } from "./shared-schemas";

// Schema para crear perfil profesional
export const ProfessionalProfileCreateSchema = z.object({
    name: z.string().min(1, "El nombre del perfil es requerido").max(50, "El nombre no puede exceder 50 caracteres"),
    slug: z.string().min(1, "El slug es requerido").max(50, "El slug no puede exceder 50 caracteres")
        .regex(/^[a-z0-9-]+$/, "El slug solo puede contener letras minúsculas, números y guiones"),
    description: z.string().max(200, "La descripción no puede exceder 200 caracteres").optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "El color debe ser un código hexadecimal válido").optional(),
    icon: z.string().max(30, "El nombre del icono no puede exceder 30 caracteres").optional(),
    isActive: z.boolean().default(true),
    order: z.number().int().min(0).default(0),
});

// Schema para actualizar perfil profesional
export const ProfessionalProfileUpdateSchema = ProfessionalProfileCreateSchema.partial().extend({
    id: IdSchema,
});

// Schema para filtros de perfiles profesionales
export const ProfessionalProfileFiltersSchema = z.object({
    isActive: z.boolean().optional(),
    isDefault: z.boolean().optional(),
    search: z.string().optional(),
});

// Schema para asignar perfiles a usuario
export const UserProfileAssignmentSchema = z.object({
    userId: IdSchema,
    profileIds: z.array(IdSchema).min(1, "Debe seleccionar al menos un perfil"),
    descriptions: z.record(z.string(), z.string()).optional(), // Descripciones específicas por perfil
});

// Tipos TypeScript derivados
export type ProfessionalProfileCreateForm = z.infer<typeof ProfessionalProfileCreateSchema>;
export type ProfessionalProfileUpdateForm = z.infer<typeof ProfessionalProfileUpdateSchema>;
export type ProfessionalProfileFiltersForm = z.infer<typeof ProfessionalProfileFiltersSchema>;
export type UserProfileAssignmentForm = z.infer<typeof UserProfileAssignmentSchema>;

// Constantes para UI
export const DEFAULT_PROFESSIONAL_PROFILES = [
    {
        name: "Fotógrafo",
        slug: "fotografo",
        description: "Especialista en captura de imágenes fotográficas",
        color: "#3B82F6", // Blue
        icon: "Camera",
        isDefault: true,
        order: 1,
    },
    {
        name: "Camarógrafo",
        slug: "camarografo",
        description: "Especialista en grabación de video",
        color: "#10B981", // Emerald
        icon: "Video",
        isDefault: true,
        order: 2,
    },
    {
        name: "Editor",
        slug: "editor",
        description: "Especialista en edición y postproducción",
        color: "#8B5CF6", // Violet
        icon: "Scissors",
        isDefault: true,
        order: 3,
    },
    {
        name: "Retocador",
        slug: "retocador",
        description: "Especialista en retoque fotográfico",
        color: "#F59E0B", // Amber
        icon: "Palette",
        isDefault: true,
        order: 4,
    },
    {
        name: "Operador de Dron",
        slug: "operador-dron",
        description: "Piloto certificado de drones para tomas aéreas",
        color: "#EF4444", // Red
        icon: "Zap",
        isDefault: true,
        order: 5,
    },
    {
        name: "Asistente",
        slug: "asistente",
        description: "Apoyo general en producciones",
        color: "#6B7280", // Gray
        icon: "User",
        isDefault: true,
        order: 6,
    },
    {
        name: "Coordinador",
        slug: "coordinador",
        description: "Coordinación de equipos y producciones",
        color: "#8B5CF6", // Purple
        icon: "Users",
        isDefault: true,
        order: 7,
    },
] as const;

// Colores predefinidos para UI
export const PROFILE_COLORS = [
    "#3B82F6", // Blue
    "#10B981", // Emerald
    "#8B5CF6", // Violet
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#6B7280", // Gray
    "#EC4899", // Pink
    "#14B8A6", // Teal
    "#F97316", // Orange
    "#84CC16", // Lime
] as const;

// Iconos disponibles (Lucide React)
export const PROFILE_ICONS = [
    "Camera",
    "Video",
    "Scissors",
    "Palette",
    "Zap",
    "User",
    "Users",
    "Briefcase",
    "Award",
    "Star",
    "Heart",
    "Shield",
    "Target",
    "Lightbulb",
    "Rocket",
] as const;
