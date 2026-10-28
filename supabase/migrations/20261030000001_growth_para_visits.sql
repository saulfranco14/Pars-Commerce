-- =============================================================================
-- GROWTH: «Para ti» visit summaries. growth_track_link takes an optional payload
-- that is kept on the lead event: what a visit saw and tapped (para_left) and
-- which button was used (claim_clicked / help_clicked, with its placement).
-- Callers that send only (token, event, seconds) keep working through the default.
-- Reverted by supabase/snippets/growth_rollback.sql.
-- =============================================================================

DROP FUNCTION IF EXISTS public.growth_track_link(text, text, integer);

CREATE OR REPLACE FUNCTION public.growth_track_link(
  p_token_hash text,
  p_event text,
  p_seconds integer DEFAULT NULL,
  p_payload jsonb DEFAULT NULL
)
RETURNS TABLE (lead_id uuid, business_name text, municipio text, view_count integer, became_hot boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link public.growth_lead_links;
  v_lead public.growth_leads;
  v_hot boolean := false;
BEGIN
  IF p_event NOT IN ('para_viewed', 'para_seconds', 'para_left', 'claim_clicked', 'help_clicked') THEN
    RAISE EXCEPTION 'UNKNOWN_LINK_EVENT';
  END IF;
  IF p_payload IS NOT NULL AND jsonb_typeof(p_payload) <> 'object' THEN
    RAISE EXCEPTION 'INVALID_LINK_PAYLOAD';
  END IF;

  SELECT * INTO v_link FROM public.growth_lead_links l
  WHERE l.token_hash = p_token_hash AND l.purpose = 'para' AND l.revoked_at IS NULL AND l.expires_at > now()
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF p_event = 'para_viewed' THEN
    UPDATE public.growth_lead_links l SET view_count = l.view_count + 1, last_viewed_at = now()
    WHERE l.id = v_link.id RETURNING l.* INTO v_link;
  END IF;

  SELECT * INTO v_lead FROM public.growth_leads WHERE id = v_link.lead_id FOR UPDATE;
  IF p_event = 'para_viewed' AND v_link.view_count >= 2 AND v_lead.stage IN ('nuevo', 'contactado') THEN
    v_hot := true;
  END IF;

  UPDATE public.growth_leads g SET
    stage = CASE WHEN v_hot THEN 'caliente' ELSE g.stage END,
    last_activity_at = now(),
    updated_at = now()
  WHERE g.id = v_lead.id;

  -- seconds and view_count come from the server, never from the payload.
  INSERT INTO public.growth_lead_events (lead_id, type, channel, actor, template_id, payload)
  VALUES (v_lead.id, p_event, v_link.channel, 'prospect', v_link.template_id,
          jsonb_strip_nulls(coalesce(p_payload, '{}'::jsonb) || jsonb_build_object('seconds', p_seconds, 'view_count', v_link.view_count)));

  RETURN QUERY SELECT v_lead.id, v_lead.business_name, v_lead.municipio, v_link.view_count, v_hot;
END;
$$;

REVOKE ALL ON FUNCTION public.growth_track_link(text, text, integer, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.growth_track_link(text, text, integer, jsonb) TO service_role;
