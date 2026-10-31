-- Reverts 20261031000006_growth_activation.sql. Growth objects only.
BEGIN;

-- growth_lead_next_action without activation, verbatim from 20261031000002_growth_next_action.
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

DROP FUNCTION IF EXISTS public.growth_activation_board(uuid, uuid, text);
DROP FUNCTION IF EXISTS public.growth_activation_stage(uuid);

COMMIT;
