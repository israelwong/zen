// ========================================
// TYPES - PERFIL
// ========================================

export interface PerfilData {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    avatarUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface PerfilFormData {
    name: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
}

export interface PerfilUpdateData extends PerfilFormData {
    id: string;
}

export interface PerfilStats {
    totalLeads: number;
    leadsActivos: number;
    leadsInactivos: number;
    ultimaActualizacion: Date;
}
