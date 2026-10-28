-- =============================================================================
-- GROWTH: formal WhatsApp copy (v3) and the WhatsApp sweep counter. Additive only:
--   * new versions of the WhatsApp templates the owner has not edited
--     (created_by IS NULL); older versions are archived, never deleted
--   * signature 'Saúl · Tlaco' → 'Saúl Franco · Tlaco' only if unchanged
--   * new function growth_sweep_remaining
-- Reverted by supabase/snippets/growth_rollback.sql.
-- =============================================================================

-- ── 1. Copy v3: usted, no slang, always a sign-off ───────────────────────────
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('m1', 'A',
       E'{saludo}. ¿Hablo con {negocio}?\n\nMi nombre es Saúl y le escribo de Tlaco. Vi su comercio en {colonia} y le preparé, sin costo, un ejemplo de tienda en línea para que sus clientes le hagan pedidos desde el celular, con entrega a domicilio y pago sin terminal.\n\n¿Me permite enviarle el enlace para que la conozca?\n\nQuedo a sus órdenes.\n{firma}'),
      ('m1', 'B',
       E'{saludo}. ¿Hablo con {negocio}?\n\nMi nombre es Saúl y le escribo de Tlaco. Vi su comercio en {colonia} y le preparé un ejemplo de cómo se vería su tienda en línea, para que sus clientes le hagan pedidos desde el celular, con entrega a domicilio y pago sin terminal:\n{link}\n\nActivarla no tiene costo y toma un par de minutos. Si lo prefiere, con gusto paso a su local y se la dejo lista.\n\nQuedo a sus órdenes.\n{firma}'),
      ('seguimiento', 'A',
       E'{saludo}. Le escribo nuevamente de Tlaco para dar seguimiento.\n\n¿Tuvo oportunidad de ver la tienda que le preparamos a {negocio}? Se la comparto otra vez:\n{link}\n\nSi lo prefiere, puedo pasar a su local y dejársela funcionando en 15 minutos, sin costo.\n\nQuedo a sus órdenes.\n{firma}'),
      ('si', 'A',
       E'Con gusto. Aquí tiene el enlace de su tienda:\n{link}\n\nDesde ahí la puede activar sin costo. Si lo prefiere, paso a su local esta semana y se la dejo funcionando. ¿Qué día y horario le acomodan?\n\nQuedo a sus órdenes.\n{firma}')
    ) AS v(step, variant, body)
  LOOP
    IF EXISTS (
      SELECT 1 FROM public.growth_templates t
      WHERE t.channel = 'whatsapp' AND t.giro IS NULL AND t.step = r.step AND t.variant = r.variant
        AND t.status <> 'archived' AND t.created_by IS NULL
    ) THEN
      PERFORM public.growth_save_template_version('whatsapp', NULL, r.step, r.variant, NULL, r.body, NULL);
    END IF;
  END LOOP;
END;
$$;

UPDATE public.growth_settings SET signature = 'Saúl Franco · Tlaco' WHERE signature = 'Saúl · Tlaco';

-- ── 2. How many cards a sweep still has (same predicate as growth_reserve_batch) ──
CREATE OR REPLACE FUNCTION public.growth_sweep_remaining(p_kind text, p_municipio text DEFAULT NULL, p_giro text DEFAULT NULL)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer
  FROM public.growth_leads g
  WHERE g.next_channel = 'whatsapp'
    -- Skipped cards and other kinds' batches are out; this sweep's own cards still count.
    AND (g.reserved_until IS NULL OR g.reserved_until < now() OR g.reserved_kind = p_kind)
    AND (g.snoozed_until IS NULL OR g.snoozed_until < now())
    AND (p_municipio IS NULL OR g.municipio = p_municipio)
    AND (p_giro IS NULL OR g.giro = p_giro)
    AND (
      (p_kind = 'whatsapp' AND g.phone_status = 'desconocido' AND g.stage IN ('nuevo', 'sin_contacto'))
      OR (p_kind = 'seguimiento' AND g.phone_status = 'enviado' AND g.whatsapp_attempts = 1
          AND g.stage IN ('contactado', 'caliente') AND g.last_whatsapp_at < now() - interval '3 days')
    );
$$;

REVOKE ALL ON FUNCTION public.growth_sweep_remaining(text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.growth_sweep_remaining(text, text, text) TO service_role;
