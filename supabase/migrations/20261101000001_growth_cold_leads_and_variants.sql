-- =============================================================================
-- GROWTH: clean out leads that never opened their store, measure each message
-- variant and give every first message the store link. Additive only:
--   * growth_cold_leads: contacted, never opened the «Para ti» link, N days on
--   * growth_bulk_drop: drop many leads at once through growth_record_outcome
--   * growth_variant_stats: per variant, how many opened, replied, claimed
--   * WhatsApp m1 A/B/C all carry {link}; only unedited templates get a version
-- Reverted by supabase/snippets/growth_cold_leads_and_variants_rollback.sql.
-- =============================================================================

-- ── 1. Leads that never opened their store ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.growth_cold_leads(
  p_workspace_id uuid,
  p_actor_id uuid,
  p_min_days integer DEFAULT 3,
  p_owner text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  business_name text,
  giro text,
  municipio text,
  colonia text,
  whatsapp_attempts integer,
  last_whatsapp_at timestamptz,
  owner_user_id uuid
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.growth_member_role(p_workspace_id, p_actor_id) IS NULL THEN
    RAISE EXCEPTION 'NOT_A_MEMBER';
  END IF;

  RETURN QUERY
  SELECT g.id, g.business_name, g.giro, g.municipio, g.colonia, g.whatsapp_attempts, g.last_whatsapp_at, g.owner_user_id
  FROM public.growth_leads g
  WHERE g.workspace_id = p_workspace_id
    AND g.stage IN ('contactado', 'sin_respuesta')
    AND g.whatsapp_attempts >= 1
    AND g.last_whatsapp_at < now() - make_interval(days => greatest(p_min_days, 1))
    AND NOT EXISTS (
      SELECT 1 FROM public.growth_lead_events e
      WHERE e.lead_id = g.id AND e.type IN ('para_viewed', 'whatsapp_replied', 'email_replied', 'visit_requested')
    )
    AND public.growth_can_act(g, p_actor_id)
    AND (p_owner IS NULL OR (p_owner = 'me' AND g.owner_user_id = p_actor_id) OR g.owner_user_id::text = p_owner)
  ORDER BY g.last_whatsapp_at
  LIMIT 1000;
END;
$$;

REVOKE ALL ON FUNCTION public.growth_cold_leads(uuid, uuid, integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.growth_cold_leads(uuid, uuid, integer, text) TO service_role;

-- ── 2. Drop many at once (same rules as one by one) ─────────────────────────
CREATE OR REPLACE FUNCTION public.growth_bulk_drop(
  p_workspace_id uuid,
  p_actor_id uuid,
  p_lead_ids uuid[],
  p_reason text DEFAULT 'rechazo'
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_done integer := 0;
BEGIN
  IF public.growth_member_role(p_workspace_id, p_actor_id) IS NULL THEN
    RAISE EXCEPTION 'NOT_A_MEMBER';
  END IF;
  IF coalesce(array_length(p_lead_ids, 1), 0) > 1000 THEN
    RAISE EXCEPTION 'TOO_MANY';
  END IF;

  FOREACH v_id IN ARRAY coalesce(p_lead_ids, '{}') LOOP
    CONTINUE WHEN NOT EXISTS (
      SELECT 1 FROM public.growth_leads g
      WHERE g.id = v_id AND g.workspace_id = p_workspace_id AND g.stage NOT IN ('registrado', 'descartado')
    );
    BEGIN
      PERFORM public.growth_record_outcome(v_id, 'not_interested', 'operator', jsonb_build_object('reason', p_reason, 'bulk', true), NULL, NULL, p_actor_id);
      v_done := v_done + 1;
    EXCEPTION WHEN OTHERS THEN
      -- A lead someone else works stays as it is; the rest are dropped.
      NULL;
    END;
  END LOOP;
  RETURN v_done;
END;
$$;

REVOKE ALL ON FUNCTION public.growth_bulk_drop(uuid, uuid, uuid[], text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.growth_bulk_drop(uuid, uuid, uuid[], text) TO service_role;

-- ── 3. How each variant performs (first send of the step per lead) ──────────
CREATE OR REPLACE FUNCTION public.growth_variant_stats(
  p_workspace_id uuid,
  p_step text,
  p_days integer DEFAULT 90
)
RETURNS TABLE (variant text, sent integer, opened integer, replied integer, claimed integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH sends AS (
    SELECT DISTINCT ON (e.lead_id) e.lead_id, coalesce(e.payload->>'variant', t.variant) AS variant, e.created_at
    FROM public.growth_lead_events e
    JOIN public.growth_leads g ON g.id = e.lead_id AND g.workspace_id = p_workspace_id
    LEFT JOIN public.growth_templates t ON t.id = e.template_id
    WHERE e.type = 'whatsapp_sent'
      AND coalesce(e.payload->>'step', t.step) = p_step
      AND e.created_at > now() - make_interval(days => greatest(p_days, 1))
    ORDER BY e.lead_id, e.created_at
  )
  SELECT
    s.variant,
    count(*)::integer,
    count(*) FILTER (WHERE EXISTS (SELECT 1 FROM public.growth_lead_events x WHERE x.lead_id = s.lead_id AND x.type = 'para_viewed' AND x.created_at > s.created_at))::integer,
    count(*) FILTER (WHERE EXISTS (SELECT 1 FROM public.growth_lead_events x WHERE x.lead_id = s.lead_id AND x.type IN ('whatsapp_replied', 'email_replied') AND x.created_at > s.created_at))::integer,
    count(*) FILTER (WHERE EXISTS (SELECT 1 FROM public.growth_lead_events x WHERE x.lead_id = s.lead_id AND x.type IN ('claim_clicked', 'registered') AND x.created_at > s.created_at))::integer
  FROM sends s
  WHERE s.variant IS NOT NULL
  GROUP BY s.variant
  ORDER BY s.variant;
$$;

REVOKE ALL ON FUNCTION public.growth_variant_stats(uuid, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.growth_variant_stats(uuid, text, integer) TO service_role;

-- ── 4. Every first message carries the store link ───────────────────────────
-- Messages without the link got no visits and no replies, so A is rewritten and C is new.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('A', E'{saludo}. ¿Hablo con {negocio}?\n\nSoy {nombre}, de Tlaco. Le preparé sin costo una tienda en línea de ejemplo para su negocio, ya con {giro_linea}:\n{link}\n\nSus clientes le piden desde el celular y a usted le llega el pedido completo. ¿Qué le parece?\n\nQuedo a sus órdenes.\n{firma}'),
      ('C', E'{saludo}. Le escribo de Tlaco con una pregunta rápida para {negocio}: ¿sus clientes le piden por WhatsApp o por teléfono?\n\nLe armé una página donde esos pedidos le llegan ordenados, con entrega a domicilio y pago con tarjeta sin terminal. Así se vería la suya:\n{link}\n\nNo tiene costo activarla. Si gusta, le explico en dos minutos.\n\nQuedo a sus órdenes.\n{firma}')
    ) AS v(variant, body)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.growth_templates t
      WHERE t.workspace_id = '00000000-0000-4000-8000-000000000001' AND t.channel = 'whatsapp' AND t.giro IS NULL
        AND t.step = 'm1' AND t.variant = r.variant AND t.status <> 'archived' AND t.created_by IS NOT NULL
    ) THEN
      PERFORM public.growth_save_template_version('whatsapp', NULL, 'm1', r.variant, NULL, r.body, NULL);
    END IF;
  END LOOP;
END;
$$;
