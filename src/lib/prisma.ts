import { PrismaClient } from '@prisma/client'

// Patrón Singleton para evitar múltiples instancias
declare global {
  var __prisma: PrismaClient | undefined;
}

// Verificar que la URL de la base de datos esté disponible
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL no está definida en las variables de entorno');
}

// Cliente de Prisma centralizado con singleton
const prisma = globalThis.__prisma || new PrismaClient({
  // Configuración optimizada para producción
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  errorFormat: 'pretty',
  // Configuración de conexión optimizada
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Reutilización en desarrollo para evitar agotamiento de conexiones
if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}

export { prisma };
