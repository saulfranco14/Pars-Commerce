-- =============================================================================
-- GROWTH: the next message follows the prospect's history.
--   * new WhatsApp steps: vio_tienda, objecion_* (one per «Para ti» doubt),
--     visita_confirmar, cita_recordatorio, post_visita, ultimo, activacion_*
--   * growth_lead_links.token_cipher: the "Para ti" token encrypted by the app,
--     so a lead keeps one link instead of a new one per draft
--   * growth_lead_next_action: which message fits now and the facts behind it
--     (what was sent, views, doubts, visit requests, replies). Timing still
--     comes from the growth_leads_next_step trigger.
--   * formal v1 copy for the new steps (Tlaco's workspace)
-- Growth objects only. Reverted by supabase/snippets/growth_next_action_rollback.sql.
-- =============================================================================

-- ── 1. Steps ─────────────────────────────────────────────────────────────────
ALTER TABLE public.growth_templates DROP CONSTRAINT IF EXISTS growth_templates_step_check;
ALTER TABLE public.growth_templates ADD CONSTRAINT growth_templates_step_check CHECK (step IN (
  'm1', 'seguimiento', 'si', 'vio_tienda', 'objecion_costo', 'objecion_tiempo', 'objecion_duda', 'objecion_whatsapp',
  'visita_confirmar', 'cita_recordatorio', 'post_visita', 'ultimo', 'activacion_tienda', 'activacion_mp', 'activacion_venta',
  'd0', 'd3', 'd7'
));

-- ── 2. One reusable link per lead ────────────────────────────────────────────
ALTER TABLE public.growth_lead_links ADD COLUMN IF NOT EXISTS token_cipher text;

-- ── 3. What to send next, and why ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.growth_lead_next_action(p_lead_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead public.growth_leads;
  v_sent jsonb;
  v_views integer;
  v_last_view timestamptz;
  v_views_since integer;
  v_objection jsonb;
  v_visit jsonb;
  v_reply_at timestamptz;
  v_scheduled_at timestamptz;
  v_step text;
  v_code text;
  v_wait boolean := false;
BEGIN
  SELECT * INTO v_lead FROM public.growth_leads WHERE id = p_lead_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- The step comes from the payload when the composer sent it; older events only have the template.
  SELECT coalesce(jsonb_agg(jsonb_build_object('step', s.step, 'variant', s.variant, 'at', s.created_at) ORDER BY s.created_at), '[]'::jsonb)
  INTO v_sent
  FROM (
    SELECT coalesce(e.payload->>'step', t.step) AS step, coalesce(e.payload->>'variant', t.variant) AS variant, e.created_at
    FROM public.growth_lead_events e
    LEFT JOIN public.growth_templates t ON t.id = e.template_id
    WHERE e.lead_id = p_lead_id AND e.type = 'whatsapp_sent'
  ) s;

  SELECT coalesce(sum(l.view_count), 0)::integer, max(l.last_viewed_at) INTO v_views, v_last_view
  FROM public.growth_lead_links l WHERE l.lead_id = p_lead_id AND l.purpose = 'para';
  SELECT count(*)::integer INTO v_views_since FROM public.growth_lead_events e
  WHERE e.lead_id = p_lead_id AND e.type = 'para_viewed' AND (v_lead.last_whatsapp_at IS NULL OR e.created_at > v_lead.last_whatsapp_at);
  SELECT jsonb_build_object('reason', e.payload->>'reason', 'at', e.created_at) INTO v_objection FROM public.growth_lead_events e
  WHERE e.lead_id = p_lead_id AND e.type = 'objection_chosen' ORDER BY e.created_at DESC LIMIT 1;
  SELECT jsonb_build_object('day', e.payload->>'day', 'slot', e.payload->>'slot', 'at', e.created_at) INTO v_visit FROM public.growth_lead_events e
  WHERE e.lead_id = p_lead_id AND e.type = 'visit_requested' ORDER BY e.created_at DESC LIMIT 1;
  SELECT max(e.created_at) INTO v_reply_at FROM public.growth_lead_events e
  WHERE e.lead_id = p_lead_id AND e.type IN ('whatsapp_replied', 'email_replied');
  SELECT max(e.created_at) INTO v_scheduled_at FROM public.growth_lead_events e
  WHERE e.lead_id = p_lead_id AND e.type IN ('visit_scheduled', 'visit_rescheduled');

  IF v_lead.stage = 'registrado' THEN
    v_step := 'activacion_tienda'; v_code := 'registered';
  ELSIF v_lead.stage = 'descartado' THEN
    v_code := 'dropped';
  ELSIF v_lead.phone_e164 IS NULL THEN
    v_code := 'no_phone';
  ELSIF v_lead.phone_status IN ('sin_whatsapp', 'equivocado') THEN
    v_code := 'bad_phone';
  ELSIF v_lead.stage = 'cita' THEN
    IF v_lead.appointment_at IS NOT NULL AND v_lead.appointment_at < now() THEN
      v_step := 'post_visita';
      v_code := 'visit_passed';
      v_wait := EXISTS (SELECT 1 FROM jsonb_array_elements(v_sent) x WHERE x->>'step' = 'post_visita' AND (x->>'at')::timestamptz > v_lead.appointment_at);
    ELSE
      v_step := 'cita_recordatorio';
      v_code := 'visit_soon';
      v_wait := v_lead.appointment_at > now() + interval '36 hours'
        OR EXISTS (SELECT 1 FROM jsonb_array_elements(v_sent) x WHERE x->>'step' = 'cita_recordatorio' AND (x->>'at')::timestamptz > coalesce(v_scheduled_at, '-infinity'::timestamptz));
    END IF;
  ELSIF v_visit IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_sent) x WHERE (x->>'at')::timestamptz > (v_visit->>'at')::timestamptz) THEN
    v_step := 'visita_confirmar'; v_code := 'visit_requested';
  ELSIF v_objection IS NOT NULL
    AND v_objection->>'reason' IN ('costo', 'tiempo', 'duda', 'whatsapp')
    AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_sent) x WHERE x->>'step' LIKE 'objecion_%' AND (x->>'at')::timestamptz > (v_objection->>'at')::timestamptz) THEN
    v_step := 'objecion_' || (v_objection->>'reason'); v_code := 'objection';
  ELSIF v_lead.phone_status = 'respondio' OR v_lead.email_status = 'respondio' THEN
    v_step := 'si';
    v_code := 'replied';
    v_wait := EXISTS (SELECT 1 FROM jsonb_array_elements(v_sent) x WHERE x->>'step' = 'si' AND (x->>'at')::timestamptz > coalesce(v_reply_at, '-infinity'::timestamptz));
  ELSIF v_lead.whatsapp_attempts = 0 THEN
    v_step := 'm1'; v_code := 'first';
  ELSIF v_views_since > 0
    AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_sent) x WHERE x->>'step' = 'vio_tienda' AND (x->>'at')::timestamptz > coalesce(v_last_view, '-infinity'::timestamptz)) THEN
    v_step := 'vio_tienda'; v_code := 'viewed';
  ELSIF v_lead.whatsapp_attempts >= 2 THEN
    IF EXISTS (SELECT 1 FROM jsonb_array_elements(v_sent) x WHERE x->>'step' = 'ultimo') THEN
      v_code := 'exhausted';
    ELSE
      v_step := 'ultimo';
      v_code := 'last_call';
      v_wait := v_lead.last_whatsapp_at > now() - interval '7 days';
    END IF;
  ELSE
    v_step := 'seguimiento';
    v_code := 'follow_up';
    v_wait := v_lead.last_whatsapp_at > now() - interval '3 days';
  END IF;

  RETURN jsonb_build_object(
    'step', v_step,
    'code', v_code,
    'wait', v_wait,
    'facts', jsonb_strip_nulls(jsonb_build_object(
      'sent', v_sent,
      'attempts', v_lead.whatsapp_attempts,
      'last_sent_at', v_lead.last_whatsapp_at,
      'views', v_views,
      'views_since_last_send', v_views_since,
      'last_view_at', v_last_view,
      'objection', v_objection,
      'visit', v_visit,
      'reply_at', v_reply_at,
      'appointment_at', v_lead.appointment_at
    ))
  );
END;
$$;

REVOKE ALL ON FUNCTION public.growth_lead_next_action(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.growth_lead_next_action(uuid) TO service_role;

-- ── 4. Formal copy for the new steps ─────────────────────────────────────────
INSERT INTO public.growth_templates (workspace_id, channel, giro, step, variant, version, subject, body) VALUES
  ('00000000-0000-4000-8000-000000000001', 'whatsapp', NULL, 'vio_tienda', 'A', 1, NULL,
   E'{saludo}. Vi que abrió la tienda de ejemplo que le preparé para {negocio}. ¿Qué le pareció?\n\nSi gusta, se la dejo lista sin costo. Aquí sigue el enlace:\n{link}\n\n{firma}'),
  ('00000000-0000-4000-8000-000000000001', 'whatsapp', NULL, 'objecion_costo', 'A', 1, NULL,
   E'{saludo}. Sobre el costo: activar su tienda no cuesta y no pide tarjeta. Tlaco no cobra comisión por lo que usted venda; si un cliente le paga con tarjeta, Mercado Pago cobra la suya por ese pago.\n\nAquí está su tienda:\n{link}\n\n¿Le ayudo a activarla?\n\n{firma}'),
  ('00000000-0000-4000-8000-000000000001', 'whatsapp', NULL, 'objecion_tiempo', 'A', 1, NULL,
   E'{saludo}. Entiendo que ahorita no tiene tiempo. Si gusta, paso a su local y se la dejo funcionando en unos 15 minutos, sin costo.\n\n¿Qué día y horario le acomodan?\n\n{firma}'),
  ('00000000-0000-4000-8000-000000000001', 'whatsapp', NULL, 'objecion_duda', 'A', 1, NULL,
   E'{saludo}. Gracias por revisar su tienda. Para decirle con franqueza si le sirve: ¿qué es lo que más vende y cómo le hacen hoy los pedidos sus clientes?\n\n{firma}'),
  ('00000000-0000-4000-8000-000000000001', 'whatsapp', NULL, 'objecion_whatsapp', 'A', 1, NULL,
   E'{saludo}. Puede seguir vendiendo por WhatsApp igual que hoy: sólo comparte su enlace y sus clientes eligen ahí, con precio y foto, sin que usted conteste uno por uno.\n\nAquí está:\n{link}\n\n{firma}'),
  ('00000000-0000-4000-8000-000000000001', 'whatsapp', NULL, 'visita_confirmar', 'A', 1, NULL,
   E'{saludo}. Recibí su solicitud de visita. Con gusto paso a {negocio} para dejarle lista su tienda.\n\n¿Me confirma la dirección y a qué hora le queda mejor?\n\n{firma}'),
  ('00000000-0000-4000-8000-000000000001', 'whatsapp', NULL, 'cita_recordatorio', 'A', 1, NULL,
   E'{saludo}. Le confirmo nuestra visita para dejarle lista su tienda en línea. ¿Sigue en pie?\n\nSi necesita moverla, dígame qué día le acomoda.\n\n{firma}'),
  ('00000000-0000-4000-8000-000000000001', 'whatsapp', NULL, 'post_visita', 'A', 1, NULL,
   E'{saludo}. Gracias por recibirme. Le dejo de nuevo el enlace de su tienda para que la revise con calma:\n{link}\n\nCualquier duda, aquí estoy.\n\n{firma}'),
  ('00000000-0000-4000-8000-000000000001', 'whatsapp', NULL, 'ultimo', 'A', 1, NULL,
   E'{saludo}. Es el último mensaje que le envío sobre esto, para no incomodarle. Su tienda de ejemplo sigue disponible aquí:\n{link}\n\nSi más adelante le interesa, con gusto le ayudo.\n\n{firma}'),
  ('00000000-0000-4000-8000-000000000001', 'whatsapp', NULL, 'activacion_tienda', 'A', 1, NULL,
   E'{saludo}. Gracias por registrarse en Tlaco. ¿Le ayudo a terminar de configurar su tienda? Son unos minutos y puedo acompañarle por llamada o en su local.\n\n{firma}'),
  ('00000000-0000-4000-8000-000000000001', 'whatsapp', NULL, 'activacion_mp', 'A', 1, NULL,
   E'{saludo}. Su tienda ya está lista. Sólo falta conectar Mercado Pago para que el dinero de sus ventas le llegue directo a su cuenta.\n\nSon 2 minutos; si gusta, lo hacemos juntos por llamada.\n\n{firma}'),
  ('00000000-0000-4000-8000-000000000001', 'whatsapp', NULL, 'activacion_venta', 'A', 1, NULL,
   E'{saludo}. Su tienda ya puede cobrar. ¿Ya compartió su enlace con sus clientes?\n\nLe sugiero ponerlo en su estado de WhatsApp y en su perfil de Facebook. Si quiere, le preparo el mensaje para que sólo lo reenvíe.\n\n{firma}')
ON CONFLICT DO NOTHING;
