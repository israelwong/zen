-- Migración 003: Sistema de descuentos
-- Fecha: 2024-09-18
-- Descripción: Crear sistema completo de descuentos y códigos de agente

-- Crear tabla de códigos de descuento generales
CREATE TABLE IF NOT EXISTS platform_discount_codes (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  tipo_descuento VARCHAR(20) NOT NULL CHECK (tipo_descuento IN ('porcentaje', 'monto_fijo')),
  valor_descuento DECIMAL(10,2) NOT NULL,
  tipo_aplicacion VARCHAR(20) NOT NULL CHECK (tipo_aplicacion IN ('plan_mensual', 'plan_anual', 'ambos')),
  fecha_inicio TIMESTAMP NOT NULL,
  fecha_fin TIMESTAMP NOT NULL,
  uso_maximo INTEGER,
  uso_actual INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  stripe_coupon_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear tabla de uso de descuentos
CREATE TABLE IF NOT EXISTS platform_discount_usage (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  discount_code_id VARCHAR(255) NOT NULL,
  lead_id VARCHAR(255),
  subscription_id VARCHAR(255),
  monto_descuento DECIMAL(10,2) NOT NULL,
  fecha_uso TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (discount_code_id) REFERENCES platform_discount_codes(id) ON DELETE CASCADE,
  FOREIGN KEY (lead_id) REFERENCES platform_leads(id) ON DELETE SET NULL,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL
);

-- Crear tabla de códigos de descuento de agentes
CREATE TABLE IF NOT EXISTS platform_agent_discount_codes (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  codigo_base VARCHAR(20) NOT NULL,
  lead_id VARCHAR(255) NOT NULL,
  agente_id VARCHAR(255) NOT NULL,
  codigo_completo VARCHAR(50) UNIQUE NOT NULL,
  tipo_descuento VARCHAR(20) NOT NULL CHECK (tipo_descuento IN ('porcentaje', 'monto_fijo')),
  valor_descuento DECIMAL(10,2) NOT NULL,
  duracion_descuento VARCHAR(20) NOT NULL CHECK (duracion_descuento IN ('1_mes', '3_meses', 'permanente')),
  stripe_coupon_id VARCHAR(255) UNIQUE,
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_expiracion TIMESTAMP NOT NULL,
  usado BOOLEAN DEFAULT false,
  fecha_uso TIMESTAMP,
  subscription_id VARCHAR(255),
  activo BOOLEAN DEFAULT true,
  FOREIGN KEY (lead_id) REFERENCES platform_leads(id) ON DELETE CASCADE,
  FOREIGN KEY (agente_id) REFERENCES platform_agents(id) ON DELETE CASCADE,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_discount_codes_activo ON platform_discount_codes(activo);
CREATE INDEX IF NOT EXISTS idx_discount_codes_fechas ON platform_discount_codes(fecha_inicio, fecha_fin);
CREATE INDEX IF NOT EXISTS idx_discount_codes_stripe ON platform_discount_codes(stripe_coupon_id);

CREATE INDEX IF NOT EXISTS idx_discount_usage_code ON platform_discount_usage(discount_code_id);
CREATE INDEX IF NOT EXISTS idx_discount_usage_lead ON platform_discount_usage(lead_id);
CREATE INDEX IF NOT EXISTS idx_discount_usage_subscription ON platform_discount_usage(subscription_id);
CREATE INDEX IF NOT EXISTS idx_discount_usage_fecha ON platform_discount_usage(fecha_uso);

CREATE INDEX IF NOT EXISTS idx_agent_discount_lead ON platform_agent_discount_codes(lead_id);
CREATE INDEX IF NOT EXISTS idx_agent_discount_agente ON platform_agent_discount_codes(agente_id);
CREATE INDEX IF NOT EXISTS idx_agent_discount_codigo ON platform_agent_discount_codes(codigo_completo);
CREATE INDEX IF NOT EXISTS idx_agent_discount_usado ON platform_agent_discount_codes(usado);
CREATE INDEX IF NOT EXISTS idx_agent_discount_expiracion ON platform_agent_discount_codes(fecha_expiracion);

-- Agregar comentarios para documentación
COMMENT ON TABLE platform_discount_codes IS 'Códigos de descuento generales de la plataforma';
COMMENT ON TABLE platform_discount_usage IS 'Registro de uso de códigos de descuento';
COMMENT ON TABLE platform_agent_discount_codes IS 'Códigos de descuento personalizados generados por agentes para leads específicos';

-- Insertar códigos de descuento de ejemplo
INSERT INTO platform_discount_codes (id, codigo, nombre, descripcion, tipo_descuento, valor_descuento, tipo_aplicacion, fecha_inicio, fecha_fin, uso_maximo) VALUES
('discount_black_friday', 'BLACKFRIDAY2024', 'Black Friday 2024', 'Descuento especial Black Friday', 'porcentaje', 15.00, 'ambos', '2024-11-24 00:00:00', '2024-11-30 23:59:59', 1000),
('discount_anual_diciembre', 'ANUAL2024', 'Descuento Plan Anual Diciembre', 'Descuento adicional para planes anuales en diciembre', 'porcentaje', 10.00, 'plan_anual', '2024-12-01 00:00:00', '2024-12-31 23:59:59', NULL)
ON CONFLICT (codigo) DO NOTHING;
