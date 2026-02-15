-- tenant_social_whatsapp: columnas dedicadas en tenants para WhatsApp y redes sociales
-- No usar settings JSONB; columnas directas para mejor consulta y tipado

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS whatsapp_phone text,
  ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.tenants.whatsapp_phone IS 'Numero WhatsApp con codigo de pais, ej. 5215512345678';
COMMENT ON COLUMN public.tenants.social_links IS 'URLs de redes: { instagram?, facebook?, twitter? }';
