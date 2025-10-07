import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Función para crear cliente de Supabase con permisos de administrador
export function createClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!, // Clave de servicio para operaciones admin
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );
}

// Cliente de Supabase con permisos de administrador (para compatibilidad)
const supabaseAdmin = createClient();

export { supabaseAdmin };
