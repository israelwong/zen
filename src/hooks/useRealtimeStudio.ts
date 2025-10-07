'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabaseRealtime } from '@/lib/supabase/realtime-client';
import { obtenerIdentidadStudio } from '@/lib/actions/studio/config/identidad.actions';
import { REALTIME_CONFIG, logRealtime, canUseRealtime } from '@/lib/realtime/realtime-control';
import type { IdentidadData } from '@/app/studio/[slug]/app/configuracion/studio/identidad/types';

interface UseRealtimeStudioOptions {
  studioSlug: string;
  onUpdate?: (data: IdentidadData) => void;
}

export function useRealtimeStudio({ studioSlug, onUpdate }: UseRealtimeStudioOptions) {
  const [identidadData, setIdentidadData] = useState<IdentidadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectionAttempts, setReconnectionAttempts] = useState(0);

  // Referencias para control de conexiones
  const channelRef = useRef<unknown>(null);
  const supabaseRef = useRef<unknown>(null);
  const isMountedRef = useRef(true);

  // Función para cargar datos iniciales
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      logRealtime('STUDIO_NAVBAR', 'Cargando datos iniciales del studio', { studioSlug });

      const data = await obtenerIdentidadStudio(studioSlug);

      if (isMountedRef.current && 'studio_name' in data) {
        setIdentidadData(data as IdentidadData);
        onUpdate?.(data as IdentidadData);
        logRealtime('STUDIO_NAVBAR', 'Datos iniciales cargados exitosamente', { name: data.studio_name });
      }
    } catch (err) {
      console.error('Error loading studio data:', err);
      setError('Error al cargar datos del estudio');

      // Fallback a datos por defecto
      const fallbackData: IdentidadData = {
        id: studioSlug,
        studio_name: 'Studio',
        slug: studioSlug,
        slogan: null,
        descripcion: null,
        palabras_clave: [],
        logo_url: null,
        isotipo_url: null
      };

      if (isMountedRef.current) {
        setIdentidadData(fallbackData);
        onUpdate?.(fallbackData);
        logRealtime('STUDIO_NAVBAR', 'Usando datos de fallback', { fallbackData });
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [studioSlug, onUpdate]);

  // Cargar datos iniciales
  useEffect(() => {
    if (studioSlug) {
      loadInitialData();
    }
  }, [studioSlug, loadInitialData]);

  // Función para manejar actualizaciones de Realtime
  const handleRealtimeUpdate = useCallback(async (payload: unknown, eventType: string) => {
    if (!isMountedRef.current) return;

    logRealtime('STUDIO_NAVBAR', `Datos actualizados via realtime (${eventType})`, payload);

    try {
      // Recargar datos actualizados
      const updatedData = await obtenerIdentidadStudio(studioSlug);

      if (isMountedRef.current && 'studio_name' in updatedData) {
        setIdentidadData(updatedData as IdentidadData);
        onUpdate?.(updatedData as IdentidadData);
        logRealtime('STUDIO_NAVBAR', 'Datos actualizados exitosamente', { name: (updatedData as IdentidadData).studio_name });
      }
    } catch (err) {
      console.error('Error reloading studio data after realtime update:', err);
      logRealtime('STUDIO_NAVBAR', 'Error al recargar datos después de actualización', err);
    }
  }, [studioSlug, onUpdate]);

  // Función para limpiar conexiones
  const cleanupConnections = useCallback(() => {
    if (channelRef.current) {
      logRealtime('STUDIO_NAVBAR', 'Limpiando conexión de canal', { channel: (channelRef.current as { topic?: string })?.topic });
      (supabaseRef.current as { removeChannel?: (channel: unknown) => void })?.removeChannel?.(channelRef.current);
      channelRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Configurar Supabase Realtime
  useEffect(() => {
    if (!studioSlug || !canUseRealtime('STUDIO_NAVBAR')) {
      logRealtime('STUDIO_NAVBAR', 'Realtime deshabilitado para este componente');
      return;
    }

    // Verificar si ya hay una conexión activa
    if ((channelRef.current as { state?: string })?.state === 'subscribed') {
      logRealtime('STUDIO_NAVBAR', 'Canal ya suscrito, evitando duplicación');
      return;
    }

    supabaseRef.current = supabaseRealtime;

    // Suscribirse a cambios en la tabla projects usando broadcast
    const channel = supabaseRealtime
      .channel(`studio:${studioSlug}`, {
        config: {
          private: true,
          broadcast: { self: true, ack: true }
        }
      })
      .on('broadcast', { event: 'UPDATE' }, (payload) => handleRealtimeUpdate(payload, 'UPDATE'))
      .on('broadcast', { event: 'INSERT' }, (payload) => handleRealtimeUpdate(payload, 'INSERT'))
      .subscribe((status, err) => {
        if (isMountedRef.current) {
          switch (status) {
            case 'SUBSCRIBED':
              setIsConnected(true);
              setReconnectionAttempts(0);
              logRealtime('STUDIO_NAVBAR', 'Canal suscrito exitosamente', { status });
              break;
            case 'CHANNEL_ERROR':
              setIsConnected(false);
              setReconnectionAttempts(prev => prev + 1);
              logRealtime('STUDIO_NAVBAR', 'Error en canal', { status, error: err, attempts: reconnectionAttempts + 1 });

              // Intentar reconexión si no hemos excedido el límite
              if (reconnectionAttempts < REALTIME_CONFIG.MAX_RECONNECTION_ATTEMPTS) {
                setTimeout(() => {
                  if (isMountedRef.current) {
                    logRealtime('STUDIO_NAVBAR', 'Intentando reconexión...', { attempt: reconnectionAttempts + 1 });
                    cleanupConnections();
                  }
                }, REALTIME_CONFIG.RECONNECTION_DELAY);
              }
              break;
            case 'CLOSED':
              setIsConnected(false);
              logRealtime('STUDIO_NAVBAR', 'Canal cerrado', { status });
              break;
            default:
              logRealtime('STUDIO_NAVBAR', 'Estado del canal', { status });
          }
        }
      });

    channelRef.current = channel;

    // Cleanup al desmontar
    return () => {
      isMountedRef.current = false;
      cleanupConnections();
    };
  }, [studioSlug, handleRealtimeUpdate, cleanupConnections, reconnectionAttempts]);

  // Función para recargar datos manualmente
  const refetch = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      setLoading(true);
      setError(null);
      logRealtime('STUDIO_NAVBAR', 'Recargando datos manualmente');

      const data = await obtenerIdentidadStudio(studioSlug);

      if (isMountedRef.current && 'studio_name' in data) {
        setIdentidadData(data as IdentidadData);
        onUpdate?.(data as IdentidadData);
        logRealtime('STUDIO_NAVBAR', 'Datos recargados exitosamente');
      }
    } catch (err) {
      console.error('Error refetching studio data:', err);
      setError('Error al recargar datos del estudio');
      logRealtime('STUDIO_NAVBAR', 'Error al recargar datos', err);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [studioSlug, onUpdate]);

  return {
    identidadData,
    loading,
    error,
    isConnected,
    reconnectionAttempts,
    refetch,
    // Funciones de control
    reconnect: () => {
      logRealtime('STUDIO_NAVBAR', 'Reconectando manualmente');
      cleanupConnections();
    },
    disconnect: () => {
      logRealtime('STUDIO_NAVBAR', 'Desconectando manualmente');
      cleanupConnections();
    }
  };
}
