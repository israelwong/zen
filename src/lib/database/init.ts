/**
 * Inicialización de la configuración de base de datos
 * Debe ser llamado al inicio de la aplicación
 */

import { initializeDatabaseConfig } from './config';
import { connectionMonitor } from './connection-monitor';

/**
 * Inicializa toda la configuración de base de datos
 * Incluye validación de variables de entorno y verificación de conectividad
 */
export async function initializeDatabase(): Promise<{
  success: boolean;
  message: string;
  health?: unknown;
}> {
  try {
    // 1. Validar y inicializar configuración
    initializeDatabaseConfig();

    // 2. Verificar conectividad inicial
    const health = await connectionMonitor.checkHealth();

    if (!health.isHealthy) {
      return {
        success: false,
        message: `Error de conectividad inicial: ${health.error}`,
        health,
      };
    }

    // 3. Log de inicialización exitosa
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Base de datos inicializada correctamente');
      console.log(`📊 Tiempo de respuesta inicial: ${health.responseTime}ms`);
    }

    return {
      success: true,
      message: 'Base de datos inicializada correctamente',
      health,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

    console.error('❌ Error al inicializar base de datos:', errorMessage);

    return {
      success: false,
      message: `Error de inicialización: ${errorMessage}`,
    };
  }
}

/**
 * Función de utilidad para verificar el estado de la base de datos
 */
export async function getDatabaseStatus(): Promise<{
  isHealthy: boolean;
  responseTime: number;
  lastChecked: Date;
  error?: string;
  metrics: unknown;
}> {
  const { health, metrics } = await connectionMonitor.getCurrentStatus();

  return {
    isHealthy: health.isHealthy,
    responseTime: health.responseTime,
    lastChecked: health.lastChecked,
    error: health.error,
    metrics,
  };
}

/**
 * Función para logging de estado en desarrollo
 */
export function logDatabaseStatus(): void {
  if (process.env.NODE_ENV === 'development') {
    getDatabaseStatus().then(status => {
      console.log('📊 Estado de Base de Datos:', {
        isHealthy: status.isHealthy ? '✅' : '❌',
        responseTime: `${status.responseTime}ms`,
        lastChecked: status.lastChecked.toLocaleString(),
        totalChecks: (status.metrics as { totalChecks?: number })?.totalChecks || 0,
        successRate: (() => {
          const metrics = status.metrics as { totalChecks?: number; successfulChecks?: number };
          const totalChecks = metrics?.totalChecks || 0;
          const successfulChecks = metrics?.successfulChecks || 0;
          return totalChecks > 0
            ? `${((successfulChecks / totalChecks) * 100).toFixed(1)}%`
            : '0%';
        })(),
        averageResponseTime: `${((status.metrics as { averageResponseTime?: number })?.averageResponseTime || 0).toFixed(1)}ms`,
      });
    });
  }
}
