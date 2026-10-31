-- =============================================================================
-- GROWTH: «Tu día», the three things a team member should do today.
--   * growth_my_day: replies waiting for an answer, follow-ups and hot
--     prospects due, visits today, first messages left in their zones and how
--     many they sent today (against their daily goal)
-- Growth objects only. Reverted by supabase/snippets/growth_my_day_rollback.sql.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.growth_my_day(p_workspace_id uuid, p_actor_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_day_start timestamptz := date_trunc('day', now() AT TIME ZONE 'America/Mexico_City') AT TIME ZONE 'America/Mexico_City';
  v_result jsonb;
BEGIN
  IF public.growth_member_role(p_workspace_id, p_actor_id) IS NULL THEN
    RAISE EXCEPTION 'NOT_A_MEMBER';
  END IF;

  SELECT jsonb_build_object(
    'replied_due', count(*) FILTER (WHERE g.stage = 'conversando' AND g.next_step_at < v_day_start + interval '1 day'),
    'hot_due', count(*) FILTER (WHERE g.stage = 'caliente' AND g.next_step_at < v_day_start + interval '1 day'),
    'follow_ups_due', count(*) FILTER (WHERE g.stage = 'contactado' AND g.next_step_at < v_day_start + interval '1 day'),
    'overdue', count(*) FILTER (WHERE g.next_step_at < v_day_start),
    'visits_today', count(*) FILTER (WHERE g.stage = 'cita' AND g.appointment_at >= v_day_start AND g.appointment_at < v_day_start + interval '1 day')
  )
  INTO v_result
  FROM public.growth_leads g
  WHERE g.workspace_id = p_workspace_id AND g.owner_user_id = p_actor_id;

  RETURN v_result || jsonb_build_object(
    'first_messages_left', public.growth_sweep_remaining('whatsapp', NULL, NULL, p_workspace_id, p_actor_id),
    'sent_today', (
      SELECT count(*) FROM public.growth_lead_events e
      WHERE e.actor_user_id = p_actor_id AND e.type = 'whatsapp_sent' AND e.created_at >= v_day_start
    ),
    'daily_goal', coalesce((SELECT m.daily_goal FROM public.growth_members m WHERE m.workspace_id = p_workspace_id AND m.user_id = p_actor_id), 20)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.growth_my_day(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.growth_my_day(uuid, uuid) TO service_role;
