-- Reverts supabase/migrations/20261101000001_growth_cold_leads_and_variants.sql.
-- The new m1 A/C versions are archived (events may point at them) and the previous A comes back.
BEGIN;

DROP FUNCTION IF EXISTS public.growth_cold_leads(uuid, uuid, integer, text);
DROP FUNCTION IF EXISTS public.growth_bulk_drop(uuid, uuid, uuid[], text);
DROP FUNCTION IF EXISTS public.growth_variant_stats(uuid, text, integer);

WITH added AS (
  UPDATE public.growth_templates t SET status = 'archived'
  WHERE t.workspace_id = '00000000-0000-4000-8000-000000000001' AND t.channel = 'whatsapp' AND t.giro IS NULL
    AND t.step = 'm1' AND t.variant IN ('A', 'C') AND t.created_by IS NULL AND t.status <> 'archived'
    AND (t.body LIKE '%Soy {nombre}, de Tlaco. Le preparé sin costo una tienda en línea de ejemplo%'
      OR t.body LIKE '%con una pregunta rápida para {negocio}%')
  RETURNING t.variant, t.version
)
UPDATE public.growth_templates t SET status = 'active'
FROM added a
WHERE a.variant = 'A' AND t.workspace_id = '00000000-0000-4000-8000-000000000001' AND t.channel = 'whatsapp'
  AND t.giro IS NULL AND t.step = 'm1' AND t.variant = 'A' AND t.version = a.version - 1;

COMMIT;
