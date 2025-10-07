import { createBrowserClient } from '@supabase/ssr'

// Cliente para componentes del cliente (navegador)
export const createClientSupabase = () =>
    createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    )