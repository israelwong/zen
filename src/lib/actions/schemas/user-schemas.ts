import { z } from "zod";
import { USER_ROLES } from "../constants/status";
import { NameSchema, EmailSchema, PhoneSchema, PasswordSchema, IdSchema } from "./shared-schemas";

// Schema para crear usuario
export const UserCreateSchema = z.object({
    nombre: NameSchema,
    email: EmailSchema,
    telefono: PhoneSchema.optional(),
    password: PasswordSchema,
    role: z.enum(Object.values(USER_ROLES) as [string, ...string[]]),
    studioId: z.string().optional(),
    activo: z.boolean().default(true),
    avatar: z.string().url("URL inválida").optional(),
    bio: z.string().max(500).optional(),
    preferencias: z.object({
        idioma: z.string().default("es"),
        zonaHoraria: z.string().default("America/Mexico_City"),
        notificaciones: z.object({
            email: z.boolean().default(true),
            push: z.boolean().default(true),
            sms: z.boolean().default(false),
        }).optional(),
    }).optional(),
});

// Schema para actualizar usuario
export const UserUpdateSchema = UserCreateSchema.partial().extend({
    id: IdSchema,
});

// Schema para perfil de usuario
export const UserProfileSchema = z.object({
    nombre: NameSchema,
    telefono: PhoneSchema.optional(),
    avatar: z.string().url("URL inválida").optional(),
    bio: z.string().max(500).optional(),
    preferencias: z.object({
        idioma: z.string().default("es"),
        zonaHoraria: z.string().default("America/Mexico_City"),
        notificaciones: z.object({
            email: z.boolean().default(true),
            push: z.boolean().default(true),
            sms: z.boolean().default(false),
        }).optional(),
    }).optional(),
});

// Schema para cambiar contraseña
export const ChangePasswordSchema = z.object({
    currentPassword: PasswordSchema,
    newPassword: PasswordSchema,
    confirmPassword: PasswordSchema,
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

// Schema para reset de contraseña
export const ResetPasswordSchema = z.object({
    email: EmailSchema,
});

// Schema para confirmar reset de contraseña
export const ConfirmResetPasswordSchema = z.object({
    token: z.string().min(1, "Token requerido"),
    newPassword: PasswordSchema,
    confirmPassword: PasswordSchema,
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

// Schema para login
export const LoginSchema = z.object({
    email: EmailSchema,
    password: PasswordSchema,
    rememberMe: z.boolean().default(false),
});

// Schema para registro
export const RegisterSchema = z.object({
    nombre: NameSchema,
    email: EmailSchema,
    password: PasswordSchema,
    confirmPassword: PasswordSchema,
    telefono: PhoneSchema.optional(),
    aceptaTerminos: z.boolean().refine((val) => val === true, {
        message: "Debes aceptar los términos y condiciones",
    }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

// Schema para verificar email
export const VerifyEmailSchema = z.object({
    token: z.string().min(1, "Token requerido"),
});

// Schema para reenviar verificación
export const ResendVerificationSchema = z.object({
    email: EmailSchema,
});

// Schema para filtros de usuarios
export const UserFiltersSchema = z.object({
    role: z.enum(Object.values(USER_ROLES) as [string, ...string[]]).optional(),
    activo: z.boolean().optional(),
    studioId: z.string().optional(),
    desde: z.string().optional(),
    hasta: z.string().optional(),
    query: z.string().optional(),
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(20),
});

// Schema para asignar roles
export const UserRoleAssignmentSchema = z.object({
    userId: IdSchema,
    role: z.enum(Object.values(USER_ROLES) as [string, ...string[]]),
    studioId: z.string().optional(),
});

// Schema para activar/desactivar usuario
export const UserStatusSchema = z.object({
    userId: IdSchema,
    activo: z.boolean(),
});

// Schema para estadísticas de usuario
export const UserStatsSchema = z.object({
    periodo: z.enum(["dia", "semana", "mes", "trimestre", "año"]).default("mes"),
    desde: z.string().optional(),
    hasta: z.string().optional(),
    metricas: z.array(z.enum(["actividad", "leads", "clientes", "cotizaciones"])).optional(),
});

// Tipos derivados
export type UserCreateForm = z.infer<typeof UserCreateSchema>;
export type UserUpdateForm = z.infer<typeof UserUpdateSchema>;
export type UserProfileForm = z.infer<typeof UserProfileSchema>;
export type ChangePasswordForm = z.infer<typeof ChangePasswordSchema>;
export type ResetPasswordForm = z.infer<typeof ResetPasswordSchema>;
export type ConfirmResetPasswordForm = z.infer<typeof ConfirmResetPasswordSchema>;
export type LoginForm = z.infer<typeof LoginSchema>;
export type RegisterForm = z.infer<typeof RegisterSchema>;
export type VerifyEmailForm = z.infer<typeof VerifyEmailSchema>;
export type ResendVerificationForm = z.infer<typeof ResendVerificationSchema>;
export type UserFiltersForm = z.infer<typeof UserFiltersSchema>;
export type UserRoleAssignmentForm = z.infer<typeof UserRoleAssignmentSchema>;
export type UserStatusForm = z.infer<typeof UserStatusSchema>;
export type UserStatsForm = z.infer<typeof UserStatsSchema>;
