-- =============================================================================
-- GROWTH: follow a registered business until it sells.
--   * growth_activation_stage: registrado → tienda_lista (setup finished) →
--     cobros (Mercado Pago connected) → primera_venta → activo (5+ paid orders
--     in 30 days), read-only over tenants, payment connections and orders
--   * growth_activation_board: the team's registered leads with that stage
--   * growth_lead_next_action suggests the activation message for the stage
-- Growth objects only. Reverted by supabase/snippets/growth_activation_rollback.sql.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.growth_activation_stage(p_tenant_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_paid_30 integer;
  v_paid_ever boolean;
BEGIN
  IF p_tenant_id IS NULL THEN
    RETURN 'registrado';
  END IF;
  SELECT count(*) FILTER (WHERE o.paid_at > now() - interval '30 days'), count(*) > 0
  INTO v_paid_30, v_paid_ever
  FROM public.orders o
  WHERE o.tenant_id = p_tenant_id AND o.paid_at IS NOT NULL AND o.status <> 'cancelled';

  IF v_paid_30 >= 5 THEN RETURN 'activo'; END IF;
  IF v_paid_ever THEN RETURN 'primera_venta'; END IF;
  IF EXISTS (SELECT 1 FROM public.payment_provider_connections c WHERE c.tenant_id = p_tenant_id AND c.provider = 'mercadopago' AND c.status = 'connected') THEN
    RETURN 'cobros';
  END IF;
  IF EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = p_tenant_id AND t.settings->'onboarding'->>'status' = 'active') THEN
    RETURN 'tienda_lista';
  END IF;
  RETURN 'registrado';
END;
$$;

CREATE OR REPLACE FUNCTION public.growth_activation_board(p_workspace_id uuid, p_actor_id uuid, p_owner text DEFAULT NULL)
RETURNS TABLE (
  lead_id uuid,
  business_name text,
  giro text,
  municipio text,
  owner_user_id uuid,
  tenant_id uuid,
  tenant_slug text,
  registered_at timestamptz,
  activation text,
  paid_orders_30d integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text := public.growth_member_role(p_workspace_id, p_actor_id);
  v_owner uuid := CASE WHEN p_owner ~ '^[0-9a-f-]{36}$' THEN p_owner::uuid END;
BEGIN
  IF v_role IS NULL THEN
    RAISE EXCEPTION 'NOT_A_MEMBER';
  END IF;
  RETURN QUERY
  SELECT g.id, g.business_name, g.giro, g.municipio, g.owner_user_id, g.registered_tenant_id, t.slug,
         coalesce((SELECT max(e.created_at) FROM public.growth_lead_events e WHERE e.lead_id = g.id AND e.type = 'registered'), g.last_activity_at),
         public.growth_activation_stage(g.registered_tenant_id),
         (SELECT count(*)::integer FROM public.orders o WHERE o.tenant_id = g.registered_tenant_id AND o.paid_at > now() - interval '30 days' AND o.status <> 'cancelled')
  FROM public.growth_leads g
  LEFT JOIN public.tenants t ON t.id = g.registered_tenant_id
  WHERE g.workspace_id = p_workspace_id
    AND g.stage = 'registrado'
    AND (v_role = 'coordinador' OR g.owner_user_id = p_actor_id)
    AND (p_owner IS NULL OR p_owner = 'all'
         OR (p_owner = 'me' AND g.owner_user_id = p_actor_id)
         OR (v_owner IS NOT NULL AND g.owner_user_id = v_owner))
  ORDER BY g.last_activity_at DESC NULLS LAST
  LIMIT 300;
END;
$$;

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
  v_activation text;
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
    -- After registering, the next message follows the business's own progress.
    v_activation := public.growth_activation_stage(v_lead.registered_tenant_id);
    v_code := 'activation';
    v_step := CASE v_activation
      WHEN 'registrado' THEN 'activacion_tienda'
      WHEN 'tienda_lista' THEN 'activacion_mp'
      WHEN 'cobros' THEN 'activacion_venta'
      WHEN 'primera_venta' THEN 'activacion_venta'
      ELSE NULL
    END;
    v_wait := v_activation = 'primera_venta'
      AND EXISTS (SELECT 1 FROM jsonb_array_elements(v_sent) x WHERE x->>'step' = 'activacion_venta');
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
      'appointment_at', v_lead.appointment_at,
      'activation', v_activation
    ))
  );
END;
$$;

REVOKE ALL ON FUNCTION public.growth_activation_stage(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.growth_activation_board(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.growth_activation_stage(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.growth_activation_board(uuid, uuid, text) TO service_role;
