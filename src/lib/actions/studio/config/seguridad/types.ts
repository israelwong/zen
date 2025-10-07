// ========================================
// TYPES - SEGURIDAD
// ========================================

export interface SecuritySettings {
    id: string;
    user_id: string;
    email_notifications: boolean;
    device_alerts: boolean;
    session_timeout: number;
    created_at: Date;
    updated_at: Date;
}

export interface AccessLog {
    id: string;
    user_id: string;
    action: string;
    ip_address: string | null;
    user_agent: string | null;
    success: boolean;
    details: Record<string, unknown> | null;
    created_at: Date;
}

export interface SecurityFormData {
    email_notifications: boolean;
    device_alerts: boolean;
    session_timeout: number;
}

export interface PasswordChangeData {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}
