// ========================================
// TYPES - CUENTAS BANCARIAS
// ========================================

export interface CuentaBancariaData {
    id: string;
    banco: string;
    numeroCuenta: string;
    titular: string;
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CuentaBancariaFormData {
    banco: string;
    numeroCuenta: string;
    titular: string;
    activo?: boolean;
}

export interface CuentaBancariaUpdateData extends CuentaBancariaFormData {
    id: string;
}

export interface CuentaBancariaFilters {
    activo?: boolean;
    banco?: string;
}

export interface CuentaBancariaStats {
    total: number;
    activas: number;
    inactivas: number;
    porBanco: Record<string, number>;
}
