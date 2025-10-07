/**
 * Utilidades para validación de UUIDs
 */

/**
 * Valida si un string es un UUID válido (v4)
 * @param uuid - String a validar
 * @returns true si es un UUID válido, false si no
 */
export function isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

/**
 * Valida si un ID es compatible con Supabase Auth
 * Supabase Auth requiere UUIDs válidos
 * @param id - ID a validar
 * @returns true si es válido para Supabase Auth
 */
export function isValidSupabaseAuthId(id: string): boolean {
    return isValidUUID(id);
}
