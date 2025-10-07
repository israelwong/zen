-- Migración 002: Sistema de tipos de pipeline
-- Fecha: 2024-09-18
-- Descripción: Crear sistema de pipelines separados para conversión y soporte

-- Crear tabla de tipos de pipeline
CREATE TABLE IF NOT EXISTS platform_pipeline_types (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nombre VARCHAR(100) UNIQUE NOT NULL,
  descripcion TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6',
  activo BOOLEAN DEFAULT true,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Agregar columna pipeline_type_id a platform_pipeline_stages
ALTER TABLE platform_pipeline_stages 
ADD COLUMN IF NOT EXISTS pipeline_type_id VARCHAR(255);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_pipeline_types_activo ON platform_pipeline_types(activo);
CREATE INDEX IF NOT EXISTS idx_pipeline_types_orden ON platform_pipeline_types(orden);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_type ON platform_pipeline_stages(pipeline_type_id);

-- Insertar tipos de pipeline por defecto
INSERT INTO platform_pipeline_types (id, nombre, descripcion, color, orden) VALUES
('pipeline_conversion', 'Conversión', 'Pipeline para gestión de prospectos y conversión a clientes', '#3B82F6', 1),
('pipeline_support', 'Soporte', 'Pipeline para gestión de tickets de soporte de clientes', '#10B981', 2)
ON CONFLICT (nombre) DO NOTHING;

-- Actualizar etapas existentes para asignarlas al pipeline de conversión
UPDATE platform_pipeline_stages 
SET pipeline_type_id = 'pipeline_conversion' 
WHERE pipeline_type_id IS NULL;

-- Agregar comentarios
COMMENT ON TABLE platform_pipeline_types IS 'Tipos de pipeline: conversión, soporte, etc.';
COMMENT ON COLUMN platform_pipeline_stages.pipeline_type_id IS 'Referencia al tipo de pipeline al que pertenece esta etapa';
