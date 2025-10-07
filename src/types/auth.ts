// =====================================================================
// TIPOS DE AUTENTICACIÓN Y ROLES
// =====================================================================

export enum UserRole {
    SUPER_ADMIN = "super_admin", // ProSocial Platform
    AGENTE = "agente", // ProSocial Platform
    SUSCRIPTOR = "suscriptor", // Studio específico
}

export enum Permission {
    // Super Admin
    MANAGE_PLATFORM = "manage_platform",
    MANAGE_REVENUE = "manage_revenue",
    MANAGE_STUDIOS = "manage_studios",

    // Agente
    MANAGE_LEADS = "manage_leads",
    MANAGE_CONVERSIONS = "manage_conversions",
    VIEW_ANALYTICS = "view_analytics",

    // Suscriptor
    MANAGE_STUDIO = "manage_studio",
    MANAGE_EVENTS = "manage_events",
    MANAGE_CLIENTS = "manage_clients",
    MANAGE_QUOTATIONS = "manage_quotations",
}

export interface UserProfile {
    id: string
    email: string
    fullName?: string
    avatarUrl?: string
    role: UserRole
    studioId?: string
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}

export interface AuthUser {
    id: string
    email: string
    profile: UserProfile
}

// =====================================================================
// MAPEO DE PERMISOS POR ROL
// =====================================================================

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    [UserRole.SUPER_ADMIN]: [
        Permission.MANAGE_PLATFORM,
        Permission.MANAGE_REVENUE,
        Permission.MANAGE_STUDIOS,
        Permission.MANAGE_LEADS,
        Permission.MANAGE_CONVERSIONS,
        Permission.VIEW_ANALYTICS,
        Permission.MANAGE_STUDIO,
        Permission.MANAGE_EVENTS,
        Permission.MANAGE_CLIENTS,
        Permission.MANAGE_QUOTATIONS,
    ],
    [UserRole.AGENTE]: [
        Permission.MANAGE_LEADS,
        Permission.MANAGE_CONVERSIONS,
        Permission.VIEW_ANALYTICS,
    ],
    [UserRole.SUSCRIPTOR]: [
        Permission.MANAGE_STUDIO,
        Permission.MANAGE_EVENTS,
        Permission.MANAGE_CLIENTS,
        Permission.MANAGE_QUOTATIONS,
    ],
}

// =====================================================================
// RUTAS POR ROL
// =====================================================================

export const ROLE_ROUTES: Record<UserRole, string> = {
    [UserRole.SUPER_ADMIN]: "/platform/admin",
    [UserRole.AGENTE]: "/platform/agente",
    [UserRole.SUSCRIPTOR]: "/studio", // Se completará con el slug del studio
}

// =====================================================================
// FUNCIONES DE UTILIDAD
// =====================================================================

export function hasPermission(userRole: UserRole, permission: Permission): boolean {
    return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false
}

export function canAccessRoute(userRole: UserRole, pathname: string): boolean {
    // Super admin puede acceder a todo
    if (userRole === UserRole.SUPER_ADMIN) {
        return true
    }

    // Verificar rutas específicas por rol
    switch (userRole) {
        case UserRole.AGENTE:
            return pathname.startsWith("/platform/agente") ||
                pathname.startsWith("/platform/admin/leads") ||
                pathname.startsWith("/platform/admin/analytics")

        case UserRole.SUSCRIPTOR:
            return pathname.startsWith("/studio/")

        default:
            return false
    }
}

export function getDefaultRoute(userRole: UserRole | string, studioSlug?: string): string {
    // Normalizar el rol a string para comparación
    const role = typeof userRole === 'string' ? userRole : userRole.toString();

    console.log('🔍 getDefaultRoute - userRole recibido:', userRole)
    console.log('🔍 getDefaultRoute - role normalizado:', role)
    console.log('🔍 getDefaultRoute - studioSlug:', studioSlug)

    switch (role) {
        case UserRole.SUPER_ADMIN:
        case 'super_admin':
            console.log('🔍 getDefaultRoute - Redirigiendo a /admin')
            return "/admin"
        case UserRole.AGENTE:
        case 'agente':
            console.log('🔍 getDefaultRoute - Redirigiendo a /agente')
            return "/agente"
        case UserRole.SUSCRIPTOR:
        case 'suscriptor':
            console.log('🔍 getDefaultRoute - Redirigiendo a /studio')
            return studioSlug ? `/studio/${studioSlug}` : "/unauthorized"
        default:
            console.log('🔍 getDefaultRoute - Redirigiendo a /unauthorized (default)')
            return "/unauthorized"
    }
}
