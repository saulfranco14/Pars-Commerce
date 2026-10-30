-- Reverts 20261031000002_growth_next_action.sql. Growth objects only.
-- Deploy the code that still uses the three original WhatsApp steps first.
BEGIN;

DROP FUNCTION IF EXISTS public.growth_lead_next_action(uuid);

-- Templates for the new steps go away with their versions; events keep their template_id as a dangling uuid.
DELETE FROM public.growth_templates WHERE step IN (
  'vio_tienda', 'objecion_costo', 'objecion_tiempo', 'objecion_duda', 'objecion_whatsapp',
  'visita_confirmar', 'cita_recordatorio', 'post_visita', 'ultimo', 'activacion_tienda', 'activacion_mp', 'activacion_venta'
);
ALTER TABLE public.growth_templates DROP CONSTRAINT IF EXISTS growth_templates_step_check;
ALTER TABLE public.growth_templates ADD CONSTRAINT growth_templates_step_check CHECK (step IN ('m1', 'seguimiento', 'si', 'd0', 'd3', 'd7'));

ALTER TABLE public.growth_lead_links DROP COLUMN IF EXISTS token_cipher;

COMMIT;
