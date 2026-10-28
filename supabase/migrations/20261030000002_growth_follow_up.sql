-- =============================================================================
-- GROWTH: follow-up pipeline. Additive, growth_* objects only:
--   * new stage 'cita' (scheduled visit) and the next-step columns
--   * trigger that sets the next step whenever a lead changes stage
--   * growth_follow_up (schedule/reschedule/cancel visit, remind, note, pause)
--   * growth_pipeline_counts for the board and the stage bar
--   * first "Para ti" view already marks the lead as 'caliente'
--   * opening copy without the colonia ("Vi su comercio y …")
-- Reverted by supabase/snippets/growth_rollback.sql.
-- =============================================================================

-- ── 1. Stage 'cita' and next-step columns ────────────────────────────────────
ALTER TABLE public.growth_leads DROP CONSTRAINT IF EXISTS growth_leads_stage_check;
ALTER TABLE public.growth_leads ADD CONSTRAINT growth_leads_stage_check
  CHECK (stage IN ('nuevo', 'contactado', 'conversando', 'caliente', 'cita', 'registrado', 'sin_respuesta', 'descartado', 'sin_contacto'));

ALTER TABLE public.growth_leads
  ADD COLUMN IF NOT EXISTS next_step text CHECK (next_step IN ('whatsapp', 'llamada', 'visita', 'retomar')),
  ADD COLUMN IF NOT EXISTS next_step_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_step_note text CHECK (char_length(next_step_note) <= 280),
  ADD COLUMN IF NOT EXISTS appointment_at timestamptz;

CREATE INDEX IF NOT EXISTS growth_leads_next_step_idx ON public.growth_leads (next_step_at) WHERE next_step_at IS NOT NULL;

-- ── 2. Next step follows the stage (manual reminders survive until the stage moves) ──
CREATE OR REPLACE FUNCTION public.growth_leads_next_step()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_moved boolean := NEW.stage IS DISTINCT FROM OLD.stage
    OR NEW.whatsapp_attempts IS DISTINCT FROM OLD.whatsapp_attempts
    OR NEW.last_whatsapp_at IS DISTINCT FROM OLD.last_whatsapp_at
    OR NEW.snoozed_until IS DISTINCT FROM OLD.snoozed_until
    OR NEW.appointment_at IS DISTINCT FROM OLD.appointment_at;
  v_note_set boolean := NEW.next_step_note IS DISTINCT FROM OLD.next_step_note;
BEGIN
  IF NOT v_moved AND NEW.next_step_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.stage IN ('registrado', 'descartado') THEN
    NEW.appointment_at := NULL;
  END IF;

  IF NEW.stage IN ('nuevo', 'sin_contacto', 'registrado', 'descartado', 'sin_respuesta') THEN
    NEW.next_step := NULL;
    NEW.next_step_at := NULL;
  ELSIF NEW.snoozed_until IS NOT NULL AND NEW.snoozed_until > now() THEN
    NEW.next_step := 'retomar';
    NEW.next_step_at := NEW.snoozed_until;
  ELSIF NEW.stage = 'cita' THEN
    NEW.next_step := 'visita';
    NEW.next_step_at := coalesce(NEW.appointment_at, now());
  ELSIF NEW.stage = 'contactado' AND NEW.whatsapp_attempts >= 2 THEN
    NEW.next_step := 'visita';
    NEW.next_step_at := coalesce(NEW.last_whatsapp_at, now()) + interval '7 days';
  ELSIF NEW.stage = 'contactado' THEN
    NEW.next_step := 'whatsapp';
    NEW.next_step_at := coalesce(NEW.last_whatsapp_at, now()) + interval '3 days';
  ELSE
    -- caliente / conversando: write today.
    NEW.next_step := 'whatsapp';
    NEW.next_step_at := now();
  END IF;

  IF v_moved AND NOT v_note_set THEN
    NEW.next_step_note := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS growth_leads_next_step ON public.growth_leads;
CREATE TRIGGER growth_leads_next_step
  BEFORE UPDATE ON public.growth_leads
  FOR EACH ROW
  -- Leads still waiting for a first contact have no next step: skip them (bulk updates stay cheap).
  WHEN (NEW.stage NOT IN ('nuevo', 'sin_contacto') OR OLD.stage NOT IN ('nuevo', 'sin_contacto'))
  EXECUTE FUNCTION public.growth_leads_next_step();

-- Backfill: open leads get their next step (the trigger fills it because it is still empty).
UPDATE public.growth_leads SET updated_at = updated_at
WHERE stage IN ('contactado', 'caliente', 'conversando') AND next_step_at IS NULL;

-- ── 3. A scheduled visit goes to the visit channel (keeps it out of WhatsApp and email queues) ──
CREATE OR REPLACE FUNCTION public.growth_next_channel(p_lead public.growth_leads)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_visit_zones text[];
BEGIN
  IF p_lead.stage IN ('registrado', 'descartado') THEN
    RETURN 'ninguno';
  END IF;
  IF p_lead.stage = 'cita' THEN
    RETURN 'visita';
  END IF;
  SELECT visit_municipios INTO v_visit_zones FROM public.growth_settings WHERE id;

  IF p_lead.phone_e164 IS NOT NULL
     AND p_lead.phone_status IN ('desconocido', 'enviado', 'respondio')
     AND NOT public.growth_is_suppressed(p_lead.phone_e164, NULL) THEN
    RETURN 'whatsapp';
  END IF;
  -- Email runs on its own, so it goes before visits; routes still include every open lead.
  IF p_lead.email IS NOT NULL
     AND p_lead.email_status IN ('desconocido', 'enviado', 'respondio')
     AND NOT public.growth_is_suppressed(NULL, p_lead.email) THEN
    RETURN 'correo';
  END IF;
  IF p_lead.municipio = ANY (coalesce(v_visit_zones, ARRAY[]::text[]))
     AND p_lead.visit_status IN ('pendiente', 'no_estaba', 'interesado')
     AND p_lead.visit_attempts < 3 THEN
    RETURN 'visita';
  END IF;
  RETURN 'ninguno';
END;
$$;

-- ── 4. Operator follow-up: every move checked against the pipeline ───────────
CREATE OR REPLACE FUNCTION public.growth_follow_up(p_lead_id uuid, p_action text, p_at timestamptz DEFAULT NULL, p_note text DEFAULT NULL)
RETURNS public.growth_leads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead public.growth_leads;
  v_note text := nullif(left(trim(coalesce(p_note, '')), 280), '');
  v_open boolean;
BEGIN
  SELECT * INTO v_lead FROM public.growth_leads WHERE id = p_lead_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'LEAD_NOT_FOUND';
  END IF;
  v_open := v_lead.stage NOT IN ('registrado', 'descartado');

  IF p_action IN ('schedule_visit', 'reschedule_visit', 'remind', 'pause') AND p_at IS NULL THEN
    RAISE EXCEPTION 'DATE_REQUIRED';
  END IF;
  IF p_action = 'note' AND v_note IS NULL THEN
    RAISE EXCEPTION 'NOTE_REQUIRED';
  END IF;

  CASE p_action
    WHEN 'schedule_visit' THEN
      IF NOT v_open OR v_lead.stage = 'cita' THEN RAISE EXCEPTION 'INVALID_TRANSITION'; END IF;
      UPDATE public.growth_leads g SET stage = 'cita', appointment_at = p_at, snoozed_until = NULL, next_step_note = v_note,
        reserved_until = NULL, reserved_kind = NULL, last_activity_at = now(), updated_at = now()
      WHERE g.id = p_lead_id RETURNING * INTO v_lead;
    WHEN 'reschedule_visit' THEN
      IF v_lead.stage <> 'cita' THEN RAISE EXCEPTION 'INVALID_TRANSITION'; END IF;
      UPDATE public.growth_leads g SET appointment_at = p_at, next_step_note = v_note, last_activity_at = now(), updated_at = now()
      WHERE g.id = p_lead_id RETURNING * INTO v_lead;
    WHEN 'cancel_visit' THEN
      IF v_lead.stage <> 'cita' THEN RAISE EXCEPTION 'INVALID_TRANSITION'; END IF;
      UPDATE public.growth_leads g SET stage = 'conversando', appointment_at = NULL, next_step_note = v_note, last_activity_at = now(), updated_at = now()
      WHERE g.id = p_lead_id RETURNING * INTO v_lead;
    WHEN 'remind' THEN
      IF NOT v_open THEN RAISE EXCEPTION 'INVALID_TRANSITION'; END IF;
      UPDATE public.growth_leads g SET next_step = coalesce(g.next_step, 'whatsapp'), next_step_at = p_at, next_step_note = v_note,
        last_activity_at = now(), updated_at = now()
      WHERE g.id = p_lead_id RETURNING * INTO v_lead;
    WHEN 'pause' THEN
      IF NOT v_open OR p_at <= now() THEN RAISE EXCEPTION 'INVALID_TRANSITION'; END IF;
      UPDATE public.growth_leads g SET snoozed_until = p_at, next_step_note = v_note, last_activity_at = now(), updated_at = now()
      WHERE g.id = p_lead_id RETURNING * INTO v_lead;
    WHEN 'resume' THEN
      IF NOT v_open OR v_lead.snoozed_until IS NULL THEN RAISE EXCEPTION 'INVALID_TRANSITION'; END IF;
      UPDATE public.growth_leads g SET snoozed_until = NULL, last_activity_at = now(), updated_at = now()
      WHERE g.id = p_lead_id RETURNING * INTO v_lead;
    WHEN 'note' THEN
      UPDATE public.growth_leads g SET last_activity_at = now(), updated_at = now()
      WHERE g.id = p_lead_id RETURNING * INTO v_lead;
    ELSE
      RAISE EXCEPTION 'UNKNOWN_FOLLOW_UP';
  END CASE;

  UPDATE public.growth_leads g SET next_channel = public.growth_next_channel(g)
  WHERE g.id = p_lead_id RETURNING * INTO v_lead;

  INSERT INTO public.growth_lead_events (lead_id, type, actor, payload)
  VALUES (p_lead_id,
          CASE p_action
            WHEN 'schedule_visit' THEN 'visit_scheduled'
            WHEN 'reschedule_visit' THEN 'visit_rescheduled'
            WHEN 'cancel_visit' THEN 'visit_cancelled'
            WHEN 'remind' THEN 'reminder_set'
            WHEN 'pause' THEN 'paused'
            WHEN 'resume' THEN 'resumed'
            ELSE 'note_added'
          END,
          'operator',
          jsonb_strip_nulls(jsonb_build_object('at', p_at, 'note', v_note)));

  RETURN v_lead;
END;
$$;

-- ── 5. Counts for the stage bar and the board ────────────────────────────────
CREATE OR REPLACE FUNCTION public.growth_pipeline_counts(p_municipio text DEFAULT NULL, p_giro text DEFAULT NULL)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH bounds AS (
    SELECT (date_trunc('day', now() AT TIME ZONE 'America/Mexico_City') AT TIME ZONE 'America/Mexico_City') AS day_start
  )
  SELECT jsonb_build_object(
    'por_contactar', count(*) FILTER (WHERE g.stage IN ('nuevo', 'sin_contacto')),
    'contactado', count(*) FILTER (WHERE g.stage = 'contactado'),
    'caliente', count(*) FILTER (WHERE g.stage = 'caliente'),
    'conversando', count(*) FILTER (WHERE g.stage = 'conversando'),
    'cita', count(*) FILTER (WHERE g.stage = 'cita'),
    'registrado', count(*) FILTER (WHERE g.stage = 'registrado'),
    'sin_respuesta', count(*) FILTER (WHERE g.stage = 'sin_respuesta'),
    'descartado', count(*) FILTER (WHERE g.stage = 'descartado'),
    'due_today', count(*) FILTER (WHERE g.next_step_at < b.day_start + interval '1 day'),
    'overdue', count(*) FILTER (WHERE g.next_step_at < b.day_start),
    'paused', count(*) FILTER (WHERE g.snoozed_until > now() AND g.stage NOT IN ('registrado', 'descartado'))
  )
  FROM public.growth_leads g CROSS JOIN bounds b
  WHERE (p_municipio IS NULL OR g.municipio = p_municipio)
    AND (p_giro IS NULL OR g.giro = p_giro);
$$;

-- ── 6. The first view of "Para ti" already means the prospect is warm ────────
-- Same signature and payload handling as 20261030000001; only the hot rule changes.
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
  IF p_event NOT IN ('para_viewed', 'para_seconds', 'para_left', 'claim_clicked', 'help_clicked', 'objection_chosen', 'visit_requested') THEN
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
  IF p_event IN ('para_viewed', 'claim_clicked', 'visit_requested') AND v_lead.stage IN ('nuevo', 'contactado') THEN
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

-- ── 7. Opening copy without the colonia (DENUE colonias read badly) ──────────
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT t.channel, t.giro, t.step, t.variant, t.subject, t.body
    FROM public.growth_templates t
    WHERE t.status = 'active' AND t.created_by IS NULL AND t.body LIKE '%Vi su comercio en {colonia}%'
  LOOP
    PERFORM public.growth_save_template_version(r.channel, r.giro, r.step, r.variant, r.subject,
      replace(r.body, 'Vi su comercio en {colonia}', 'Vi su comercio'), NULL);
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.growth_follow_up(uuid, text, timestamptz, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.growth_pipeline_counts(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.growth_follow_up(uuid, text, timestamptz, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.growth_pipeline_counts(text, text) TO service_role;
