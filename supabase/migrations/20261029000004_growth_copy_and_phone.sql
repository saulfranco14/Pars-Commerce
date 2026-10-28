-- =============================================================================
-- GROWTH: opening copy v2 and phone correction. Additive only:
--   * new versions of the seeded templates (the v1 rows are archived, never
--     deleted) — only where the owner has not edited them yet
--   * new function growth_update_lead_phone
-- Reverted by supabase/snippets/growth_rollback.sql.
-- =============================================================================

-- ── 1. Copy v2: introduce Tlaco instead of the neighbour line, neutral giro ──
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('whatsapp', 'm1', 'A', NULL::text,
       E'{saludo}, ¿es {negocio}?\n\nSoy Saúl, de Tlaco. Vi su comercio en {colonia} y le escribo porque con Tlaco sus clientes le pueden pedir por celular, con entrega a domicilio, y pagarle sin terminal.\n\nLe armé un ejemplo de cómo se vería su tienda. ¿Se lo mando para que lo vea? No cuesta nada.'),
      ('whatsapp', 'm1', 'B', NULL::text,
       E'{saludo}, ¿es {negocio}?\n\nSoy Saúl, de Tlaco. Vi su comercio en {colonia} y le armé un ejemplo de cómo se vería su tienda para que sus clientes le pidan por celular, con entrega a domicilio, y le paguen sin terminal:\n{link}\n\nSi le late, se activa gratis en 2 minutos. Y si prefiere, paso a su local y se la dejo lista.'),
      ('email', 'd0', 'A', '{negocio}: te armé tu tienda',
       E'Hola, equipo de {negocio}:\n\nSoy Saúl, de Tlaco. Vi su comercio en {colonia} y te preparé una tienda de ejemplo.\n\nTus clientes la abren desde su celular, piden con entrega a domicilio y pagan sin descargar nada y sin terminal.\n\nLa puedes ver aquí. Es privada, solo tú tienes el link:\n{link}\n\nSi te sirve, la activas gratis en 2 minutos.\n\n{firma}'),
      ('email', 'd0', 'B', 'Una tienda para {negocio}',
       E'Hola, equipo de {negocio}:\n\nSoy Saúl, de Tlaco. Vi su comercio en {colonia} y armé una tienda de prueba para que tus clientes pidan desde su celular, con entrega a domicilio, y te paguen sin app y sin terminal.\n\n¿Te mando el link para que la veas? Es gratis y no tienes que instalar nada.\n\n{firma}'),
      ('email', 'd0', 'C', 'Pregunta rápida, {negocio}',
       E'Hola, equipo de {negocio}:\n\nUna pregunta rápida: ¿cuántos de tus clientes te piden por WhatsApp o por teléfono?\n\nTe lo pregunto porque armé para {negocio} una tienda donde te piden desde su celular, con entrega a domicilio, y te pagan sin terminal. La puedes ver aquí:\n{link}\n\n{firma}'),
      ('email', 'd3', 'A', 'Re: {negocio}',
       E'Hola de nuevo.\n\nUna idea para {negocio}: que tus clientes vean tus productos y te pidan desde su celular, aunque no estés en el local.\n\nTu tienda sigue lista en el mismo link:\n{link}\n\nSi quieres, paso a tu local y te la enseño en 15 minutos.\n\n{firma}')
    ) AS v(channel, step, variant, subject, body)
  LOOP
    IF EXISTS (
      SELECT 1 FROM public.growth_templates t
      WHERE t.channel = r.channel AND t.giro IS NULL AND t.step = r.step AND t.variant = r.variant
        AND t.status <> 'archived' AND t.version = 1
    ) THEN
      PERFORM public.growth_save_template_version(r.channel, NULL, r.step, r.variant, r.subject, r.body, NULL);
    END IF;
  END LOOP;
END;
$$;

-- ── 2. Phone correction (e.g. the number on Google Maps is a different one) ──
CREATE OR REPLACE FUNCTION public.growth_update_lead_phone(p_lead_id uuid, p_phone text)
RETURNS public.growth_leads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead public.growth_leads;
  v_previous text;
BEGIN
  IF p_phone IS NULL OR p_phone !~ '^\+52[0-9]{10}$' THEN
    RAISE EXCEPTION 'INVALID_PHONE';
  END IF;
  SELECT * INTO v_lead FROM public.growth_leads WHERE id = p_lead_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'LEAD_NOT_FOUND';
  END IF;
  IF v_lead.phone_e164 IS NOT DISTINCT FROM p_phone THEN
    RETURN v_lead;
  END IF;
  IF EXISTS (SELECT 1 FROM public.growth_leads g WHERE g.phone_e164 = p_phone AND g.id <> p_lead_id) THEN
    RAISE EXCEPTION 'PHONE_TAKEN';
  END IF;
  IF public.growth_is_suppressed(p_phone, NULL) THEN
    RAISE EXCEPTION 'PHONE_SUPPRESSED';
  END IF;

  v_previous := v_lead.phone_e164;
  -- A new number starts clean; the old one keeps its suppression if it had one.
  UPDATE public.growth_leads g
  SET phone_e164 = p_phone,
      phone_status = 'desconocido',
      whatsapp_attempts = 0,
      last_whatsapp_at = NULL,
      stage = CASE WHEN g.stage = 'sin_contacto' THEN 'nuevo' ELSE g.stage END,
      last_activity_at = now(),
      updated_at = now()
  WHERE g.id = p_lead_id;

  UPDATE public.growth_leads g
  SET next_channel = public.growth_next_channel(g)
  WHERE g.id = p_lead_id
  RETURNING * INTO v_lead;

  INSERT INTO public.growth_lead_events (lead_id, type, channel, actor, payload)
  VALUES (p_lead_id, 'phone_corrected', 'whatsapp', 'operator', jsonb_build_object('previous', v_previous));

  RETURN v_lead;
END;
$$;

REVOKE ALL ON FUNCTION public.growth_update_lead_phone(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.growth_update_lead_phone(uuid, text) TO service_role;
