/**
 * Configuración centralizada de base de datos
 * Valida variables de entorno y proporciona configuración optimizada
 */

export interface DatabaseConfig {
  url: string;
  directUrl?: string;
  maxConnections: number;
  connectionTimeout: number;
  queryTimeout: number;
}

/**
 * Valida y obtiene la configuración de base de datos
 */
export function getDatabaseConfig(): DatabaseConfig {
  const databaseUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL is required. Please check your environment variables.'
    );
  }

  // Configuración optimizada para diferentes entornos
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    url: databaseUrl,
    directUrl,
    maxConnections: isProduction ? 20 : 10,
    connectionTimeout: isProduction ? 30000 : 10000, // 30s en prod, 10s en dev
    queryTimeout: isProduction ? 60000 : 30000, // 60s en prod, 30s en dev
  };
}

/**
 * Valida que todas las variables de entorno requeridas estén presentes
 */
export function validateEnvironmentVariables(): {
  isValid: boolean;
  missing: string[];
  warnings: string[];
} {
  const required = [
    'DATABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const optional = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'DIRECT_URL',
    'STRIPE_SECRET_KEY',
  ];

  const missing: string[] = [];
  const warnings: string[] = [];

  // Verificar variables requeridas
  required.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  // Verificar variables opcionales
  optional.forEach(varName => {
    if (!process.env[varName]) {
      warnings.push(varName);
    }
  });

  // Validaciones específicas
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('postgresql://')) {
    warnings.push('DATABASE_URL should be a PostgreSQL connection string');
  }

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://')) {
    warnings.push('NEXT_PUBLIC_SUPABASE_URL should start with https://');
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Obtiene información de configuración para logging
 */
export function getConfigInfo(): {
  environment: string;
  database: {
    hasUrl: boolean;
    hasDirectUrl: boolean;
    urlPreview: string;
  };
  supabase: {
    hasUrl: boolean;
    hasAnonKey: boolean;
    hasServiceKey: boolean;
  };
  stripe: {
    hasSecretKey: boolean;
  };
} {
  const dbUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  return {
    environment: process.env.NODE_ENV || 'development',
    database: {
      hasUrl: !!dbUrl,
      hasDirectUrl: !!directUrl,
      urlPreview: dbUrl ? `${dbUrl.substring(0, 20)}...` : 'Not set',
    },
    supabase: {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      hasServiceKey: !!supabaseServiceKey,
    },
    stripe: {
      hasSecretKey: !!stripeSecretKey,
    },
  };
}

/**
 * Inicializa y valida la configuración de base de datos
 * Debe ser llamado al inicio de la aplicación
 */
export function initializeDatabaseConfig(): void {
  const validation = validateEnvironmentVariables();
  
  if (!validation.isValid) {
    console.error('❌ Variables de entorno faltantes:', validation.missing);
    throw new Error(`Missing required environment variables: ${validation.missing.join(', ')}`);
  }

  if (validation.warnings.length > 0) {
    console.warn('⚠️ Variables de entorno opcionales faltantes:', validation.warnings);
  }

  const config = getDatabaseConfig();
  const info = getConfigInfo();

  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Configuración de Base de Datos:', {
      environment: info.environment,
      database: info.database,
      supabase: info.supabase,
      stripe: info.stripe,
      maxConnections: config.maxConnections,
      connectionTimeout: config.connectionTimeout,
    });
  }
}
