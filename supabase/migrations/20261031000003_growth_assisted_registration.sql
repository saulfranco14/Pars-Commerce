-- =============================================================================
-- GROWTH: a team member registers the prospect's business from its card.
--   * growth_mark_registered: links the new tenant to the lead, credits the
--     lead's owner in tenant_acquisitions (bucket 'assisted', channel 'equipo')
--     and closes the lead as registrado, in one transaction
-- Growth objects only. Reverted by supabase/snippets/growth_assisted_registration_rollback.sql.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.growth_mark_registered(p_lead_id uuid, p_tenant_id uuid, p_actor_id uuid)
RETURNS public.growth_leads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead public.growth_leads;
BEGIN
  v_lead := public.growth_lock_for_actor(p_lead_id, p_actor_id);
  IF v_lead.stage = 'registrado' THEN
    RAISE EXCEPTION 'ALREADY_REGISTERED';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = p_tenant_id) THEN
    RAISE EXCEPTION 'TENANT_NOT_FOUND';
  END IF;

  INSERT INTO public.tenant_acquisitions (tenant_id, bucket, lead_id, channel, acquired_by)
  VALUES (p_tenant_id, 'assisted', v_lead.id, 'equipo', coalesce(v_lead.owner_user_id, p_actor_id))
  ON CONFLICT (tenant_id) DO NOTHING;

  UPDATE public.growth_leads g SET
    stage = 'registrado',
    next_channel = 'ninguno',
    registered_tenant_id = p_tenant_id,
    reserved_until = NULL,
    reserved_kind = NULL,
    last_activity_at = now(),
    updated_at = now()
  WHERE g.id = v_lead.id
  RETURNING * INTO v_lead;

  INSERT INTO public.growth_lead_events (lead_id, type, channel, actor, actor_user_id, payload)
  VALUES (v_lead.id, 'registered', 'equipo', 'operator', p_actor_id, jsonb_build_object('tenant_id', p_tenant_id, 'bucket', 'assisted'));

  RETURN v_lead;
END;
$$;

REVOKE ALL ON FUNCTION public.growth_mark_registered(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.growth_mark_registered(uuid, uuid, uuid) TO service_role;
