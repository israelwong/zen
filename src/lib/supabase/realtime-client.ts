import { createClient } from '@supabase/supabase-js';
import { getRealtimeConfig } from '@/lib/realtime/realtime-control';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or Anon Key');
}

// Configuración optimizada para Realtime
const realtimeConfig = getRealtimeConfig();

export const supabaseRealtime = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: realtimeConfig.clientConfig.eventsPerSecond,
      reconnectAfterMs: realtimeConfig.clientConfig.reconnectAfterMs,
      maxReconnectionAttempts: realtimeConfig.clientConfig.maxReconnectionAttempts
    }
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-client-info': 'prosocial-platform-studio'
    }
  },
  auth: {
    persistSession: true // Para studio necesitamos sesiones persistentes
  }
});

// Función para crear cliente con configuración personalizada
export function createRealtimeClient(config?: {
  eventsPerSecond?: number;
  reconnectAfterMs?: number;
  maxReconnectionAttempts?: number;
}) {
  const customConfig = {
    eventsPerSecond: config?.eventsPerSecond || realtimeConfig.clientConfig.eventsPerSecond,
    reconnectAfterMs: config?.reconnectAfterMs || realtimeConfig.clientConfig.reconnectAfterMs,
    maxReconnectionAttempts: config?.maxReconnectionAttempts || realtimeConfig.clientConfig.maxReconnectionAttempts
  };

  return createClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
      params: customConfig
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'x-client-info': 'prosocial-platform-custom'
      }
    },
    auth: {
      persistSession: true
    }
  });
}
