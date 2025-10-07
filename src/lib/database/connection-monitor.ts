/**
 * Sistema de monitoreo de conexiones a base de datos
 * Implementa verificación de salud y métricas de performance
 */

import { prisma } from '@/lib/prisma';

export interface ConnectionHealth {
  isHealthy: boolean;
  responseTime: number;
  lastChecked: Date;
  error?: string;
}

export interface ConnectionMetrics {
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  averageResponseTime: number;
  lastError?: string;
}

class ConnectionMonitor {
  private metrics: ConnectionMetrics = {
    totalChecks: 0,
    successfulChecks: 0,
    failedChecks: 0,
    averageResponseTime: 0,
  };

  private responseTimes: number[] = [];

  /**
   * Verifica la salud de la conexión a la base de datos
   */
  async checkHealth(): Promise<ConnectionHealth> {
    const startTime = Date.now();
    
    try {
      // Ejecutar una consulta simple para verificar conectividad
      await prisma.$queryRaw`SELECT 1`;
      
      const responseTime = Date.now() - startTime;
      this.updateMetrics(true, responseTime);
      
      return {
        isHealthy: true,
        responseTime,
        lastChecked: new Date(),
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.updateMetrics(false, responseTime, errorMessage);
      
      return {
        isHealthy: false,
        responseTime,
        lastChecked: new Date(),
        error: errorMessage,
      };
    }
  }

  /**
   * Obtiene las métricas actuales de conexión
   */
  getMetrics(): ConnectionMetrics {
    return { ...this.metrics };
  }

  /**
   * Obtiene el estado de salud actual
   */
  async getCurrentStatus(): Promise<{
    health: ConnectionHealth;
    metrics: ConnectionMetrics;
  }> {
    const health = await this.checkHealth();
    const metrics = this.getMetrics();
    
    return { health, metrics };
  }

  /**
   * Actualiza las métricas internas
   */
  private updateMetrics(success: boolean, responseTime: number, error?: string): void {
    this.metrics.totalChecks++;
    
    if (success) {
      this.metrics.successfulChecks++;
    } else {
      this.metrics.failedChecks++;
      this.metrics.lastError = error;
    }
    
    // Mantener solo los últimos 100 response times para el promedio
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift();
    }
    
    // Calcular promedio de response time
    this.metrics.averageResponseTime = 
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;
  }

  /**
   * Resetea las métricas
   */
  resetMetrics(): void {
    this.metrics = {
      totalChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      averageResponseTime: 0,
    };
    this.responseTimes = [];
  }

  /**
   * Obtiene un resumen de salud en formato legible
   */
  async getHealthSummary(): Promise<string> {
    const { health, metrics } = await this.getCurrentStatus();
    
    const successRate = metrics.totalChecks > 0 
      ? ((metrics.successfulChecks / metrics.totalChecks) * 100).toFixed(1)
      : '0';
    
    return `
📊 Estado de Conexión a Base de Datos:
├── Estado: ${health.isHealthy ? '✅ Saludable' : '❌ Con problemas'}
├── Tiempo de respuesta: ${health.responseTime}ms
├── Última verificación: ${health.lastChecked.toLocaleString()}
├── Tasa de éxito: ${successRate}%
├── Total de verificaciones: ${metrics.totalChecks}
└── Tiempo promedio: ${metrics.averageResponseTime.toFixed(1)}ms
${health.error ? `\n⚠️ Último error: ${health.error}` : ''}
    `.trim();
  }
}

// Instancia singleton del monitor
export const connectionMonitor = new ConnectionMonitor();

/**
 * Función de utilidad para verificar conexión rápida
 */
export async function quickHealthCheck(): Promise<boolean> {
  try {
    const health = await connectionMonitor.checkHealth();
    return health.isHealthy;
  } catch {
    return false;
  }
}

/**
 * Función para logging de métricas en desarrollo
 */
export function logConnectionMetrics(): void {
  if (process.env.NODE_ENV === 'development') {
    connectionMonitor.getCurrentStatus().then(({ metrics }) => {
      console.log('📊 Métricas de Conexión:', {
        totalChecks: metrics.totalChecks,
        successRate: `${((metrics.successfulChecks / metrics.totalChecks) * 100).toFixed(1)}%`,
        averageResponseTime: `${metrics.averageResponseTime.toFixed(1)}ms`,
        lastError: metrics.lastError,
      });
    });
  }
}
