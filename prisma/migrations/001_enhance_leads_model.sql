-- Migración 001: Mejoras al modelo de leads
-- Fecha: 2024-09-18
-- Descripción: Agregar campos para mejor clasificación y seguimiento de leads

-- Agregar nuevos campos a platform_leads
ALTER TABLE platform_leads 
ADD COLUMN IF NOT EXISTS tipo_lead VARCHAR(20) DEFAULT 'prospecto',
ADD COLUMN IF NOT EXISTS metodo_conversion VARCHAR(20),
ADD COLUMN IF NOT EXISTS agente_conversion_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS fecha_primera_interaccion TIMESTAMP,
ADD COLUMN IF NOT EXISTS numero_interacciones INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS fuente_original VARCHAR(100),
ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100),
ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(100),
ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(100);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_platform_leads_tipo_lead ON platform_leads(tipo_lead);
CREATE INDEX IF NOT EXISTS idx_platform_leads_metodo_conversion ON platform_leads(metodo_conversion);
CREATE INDEX IF NOT EXISTS idx_platform_leads_agente_conversion ON platform_leads(agente_conversion_id);
CREATE INDEX IF NOT EXISTS idx_platform_leads_fecha_interaccion ON platform_leads(fecha_primera_interaccion);

-- Agregar comentarios para documentación
COMMENT ON COLUMN platform_leads.tipo_lead IS 'Tipo de lead: prospecto, conversion_directa, conversion_agente, cliente_activo, soporte';
COMMENT ON COLUMN platform_leads.metodo_conversion IS 'Método de conversión: demo, directo, agente, soporte';
COMMENT ON COLUMN platform_leads.agente_conversion_id IS 'ID del agente que logró la conversión';
COMMENT ON COLUMN platform_leads.fecha_primera_interaccion IS 'Fecha de la primera interacción con el lead';
COMMENT ON COLUMN platform_leads.numero_interacciones IS 'Número total de interacciones con el lead';
