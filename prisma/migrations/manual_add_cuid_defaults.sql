-- Migración manual para agregar @default(cuid()) a modelos platform
-- Ejecutar cuando la conexión a la base de datos se restablezca

-- Agregar DEFAULT gen_random_uuid() a los campos id que no lo tienen
-- Nota: PostgreSQL no tiene cuid() nativo, usamos gen_random_uuid() como alternativa

-- platform_pipeline_stages
ALTER TABLE platform_pipeline_stages ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- platform_billing_cycles  
ALTER TABLE platform_billing_cycles ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- platform_plans
ALTER TABLE platform_plans ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- platform_activities
ALTER TABLE platform_activities ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- platform_agents
ALTER TABLE platform_agents ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- platform_lead_bitacora
ALTER TABLE platform_lead_bitacora ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- platform_leads
ALTER TABLE platform_leads ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- platform_notifications
ALTER TABLE platform_notifications ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- platform_plataformas_publicidad
ALTER TABLE platform_plataformas_publicidad ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- subscriptions
ALTER TABLE subscriptions ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
