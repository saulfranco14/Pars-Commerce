-- Reverts 20261031000001_growth_workspaces.sql. Growth objects only.
-- Deploy the code without workspaces first: the previous functions do not take workspace or actor.
-- Leads other workspaces created are deleted, because uniqueness goes back to global.
BEGIN;

-- Copy that names the sender goes back to the owner's name.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT t.workspace_id, t.channel, t.giro, t.step, t.variant, t.subject, t.body, t.created_by
    FROM public.growth_templates t
    WHERE t.status <> 'archived' AND t.body LIKE '%{nombre}%'
  LOOP
    PERFORM public.growth_save_template_version(r.channel, r.giro, r.step, r.variant, r.subject,
      replace(replace(r.body, 'Mi nombre es {nombre}', 'Mi nombre es Saúl'), 'Soy {nombre}', 'Soy Saúl'), r.created_by, r.workspace_id);
  END LOOP;
END;
$$;

DROP FUNCTION IF EXISTS public.growth_add_lead(uuid, uuid, jsonb);
DROP FUNCTION IF EXISTS public.growth_assign_leads(uuid, uuid, uuid[], uuid);
DROP FUNCTION IF EXISTS public.growth_contact_owner(uuid, text, text);
DROP FUNCTION IF EXISTS public.growth_update_lead_email(uuid, text, uuid);
DROP FUNCTION IF EXISTS public.growth_can_act_on(uuid, uuid);
DROP FUNCTION IF EXISTS public.growth_lock_for_actor(uuid, uuid);
DROP FUNCTION IF EXISTS public.growth_can_act(public.growth_leads, uuid);
DROP FUNCTION IF EXISTS public.growth_in_zones(text, text, jsonb);
DROP FUNCTION IF EXISTS public.growth_member_role(uuid, uuid);
DROP FUNCTION IF EXISTS public.growth_upsert_leads(jsonb, uuid);
DROP FUNCTION IF EXISTS public.growth_record_outcome(uuid, text, text, jsonb, date, uuid, uuid);
DROP FUNCTION IF EXISTS public.growth_reserve_batch(text, text, text, integer, integer, uuid, uuid);
DROP FUNCTION IF EXISTS public.growth_sweep_remaining(text, text, text, uuid, uuid);
DROP FUNCTION IF EXISTS public.growth_nearby_leads(double precision, double precision, integer, uuid, uuid);
DROP FUNCTION IF EXISTS public.growth_follow_up(uuid, text, timestamptz, text, uuid);
DROP FUNCTION IF EXISTS public.growth_update_lead_phone(uuid, text, uuid);
DROP FUNCTION IF EXISTS public.growth_pipeline_counts(text, text, uuid, uuid);
DROP FUNCTION IF EXISTS public.growth_save_template_version(text, text, text, text, text, text, uuid, uuid);
DROP FUNCTION IF EXISTS public.growth_enroll_email_leads(integer, uuid);
DROP FUNCTION IF EXISTS public.growth_funnel(timestamptz, timestamptz, uuid);
DROP FUNCTION IF EXISTS public.growth_is_suppressed(text, text, uuid);

DELETE FROM public.growth_leads WHERE workspace_id <> '00000000-0000-4000-8000-000000000001';
DELETE FROM public.growth_suppressions WHERE workspace_id <> '00000000-0000-4000-8000-000000000001';
DELETE FROM public.growth_templates WHERE workspace_id <> '00000000-0000-4000-8000-000000000001';
DELETE FROM public.growth_mailboxes WHERE workspace_id <> '00000000-0000-4000-8000-000000000001';
DELETE FROM public.growth_operator_chats WHERE workspace_id <> '00000000-0000-4000-8000-000000000001';
DELETE FROM public.growth_settings WHERE workspace_id <> '00000000-0000-4000-8000-000000000001';

DROP INDEX IF EXISTS public.growth_leads_owner_idx;
DROP INDEX IF EXISTS public.growth_leads_denue_key;
DROP INDEX IF EXISTS public.growth_leads_phone_key;
DROP INDEX IF EXISTS public.growth_leads_email_key;
DROP INDEX IF EXISTS public.growth_suppressions_phone_key;
DROP INDEX IF EXISTS public.growth_suppressions_email_key;
DROP INDEX IF EXISTS public.growth_templates_version_key;
DROP INDEX IF EXISTS public.growth_templates_live_key;
DROP INDEX IF EXISTS public.growth_mailboxes_address_key;

ALTER TABLE public.growth_leads ADD CONSTRAINT growth_leads_denue_id_key UNIQUE (denue_id);
CREATE UNIQUE INDEX growth_leads_phone_key ON public.growth_leads (phone_e164) WHERE phone_e164 IS NOT NULL;
CREATE UNIQUE INDEX growth_leads_email_key ON public.growth_leads (lower(email)) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX growth_suppressions_phone_key ON public.growth_suppressions (phone_e164) WHERE phone_e164 IS NOT NULL;
CREATE UNIQUE INDEX growth_suppressions_email_key ON public.growth_suppressions (lower(email)) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX growth_templates_version_key ON public.growth_templates (channel, coalesce(giro, ''), step, variant, version);
CREATE UNIQUE INDEX growth_templates_live_key ON public.growth_templates (channel, coalesce(giro, ''), step, variant) WHERE status <> 'archived';
CREATE UNIQUE INDEX growth_mailboxes_address_key ON public.growth_mailboxes (lower(address));

ALTER TABLE public.growth_settings DROP CONSTRAINT IF EXISTS growth_settings_pkey;
ALTER TABLE public.growth_settings ADD COLUMN id boolean NOT NULL DEFAULT true CHECK (id);
ALTER TABLE public.growth_settings ADD PRIMARY KEY (id);
ALTER TABLE public.growth_settings DROP COLUMN workspace_id;

ALTER TABLE public.growth_leads DROP COLUMN IF EXISTS workspace_id, DROP COLUMN IF EXISTS owner_user_id, DROP COLUMN IF EXISTS owned_at, DROP COLUMN IF EXISTS reserved_by;
ALTER TABLE public.growth_suppressions DROP COLUMN IF EXISTS workspace_id;
ALTER TABLE public.growth_templates DROP COLUMN IF EXISTS workspace_id;
ALTER TABLE public.growth_mailboxes DROP COLUMN IF EXISTS workspace_id;
ALTER TABLE public.growth_operator_chats DROP COLUMN IF EXISTS workspace_id;
ALTER TABLE public.growth_lead_events DROP COLUMN IF EXISTS actor_user_id;
ALTER TABLE public.tenant_acquisitions DROP COLUMN IF EXISTS acquired_by;

DROP TABLE IF EXISTS public.growth_members;
DROP TABLE IF EXISTS public.growth_workspaces;

-- Previous definitions, taken verbatim from the migrations they last came from.

-- growth_is_suppressed: from 20261029000001_growth_leads.sql
CREATE OR REPLACE FUNCTION public.growth_is_suppressed(p_phone text, p_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.growth_suppressions s
    WHERE (p_phone IS NOT NULL AND s.phone_e164 = p_phone)
       OR (p_email IS NOT NULL AND lower(s.email) = lower(p_email))
  );
$$;

-- growth_next_channel: from 20261030000002_growth_follow_up.sql
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

-- growth_upsert_leads: from 20261029000001_growth_leads.sql
CREATE OR REPLACE FUNCTION public.growth_upsert_leads(p_rows jsonb)
RETURNS TABLE (inserted integer, updated integer, merged_contacts integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row jsonb;
  v_phone text;
  v_email text;
  v_denue text;
  v_is_insert boolean;
  v_id uuid;
  v_inserted integer := 0;
  v_updated integer := 0;
  v_merged integer := 0;
BEGIN
  IF jsonb_typeof(p_rows) <> 'array' THEN
    RAISE EXCEPTION 'ROWS_MUST_BE_ARRAY';
  END IF;

  FOR v_row IN SELECT value FROM jsonb_array_elements(p_rows)
  LOOP
    v_denue := nullif(btrim(v_row->>'denue_id'), '');
    v_phone := nullif(btrim(v_row->>'phone_e164'), '');
    v_email := lower(nullif(btrim(v_row->>'email'), ''));

    IF v_phone IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.growth_leads g WHERE g.phone_e164 = v_phone AND g.denue_id IS DISTINCT FROM v_denue
    ) THEN
      v_phone := NULL;
      v_merged := v_merged + 1;
    END IF;
    IF v_email IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.growth_leads g WHERE lower(g.email) = v_email AND g.denue_id IS DISTINCT FROM v_denue
    ) THEN
      v_email := NULL;
      v_merged := v_merged + 1;
    END IF;

    INSERT INTO public.growth_leads AS g (
      denue_id, business_name, legal_name, giro, catalog_template_key, activity, staff_range,
      municipio, colonia, address, postal_code, lat, lng, phone_e164, email, website, source, source_detail
    ) VALUES (
      v_denue,
      btrim(v_row->>'business_name'),
      nullif(btrim(v_row->>'legal_name'), ''),
      btrim(v_row->>'giro'),
      nullif(btrim(v_row->>'catalog_template_key'), ''),
      nullif(btrim(v_row->>'activity'), ''),
      nullif(btrim(v_row->>'staff_range'), ''),
      btrim(v_row->>'municipio'),
      nullif(btrim(v_row->>'colonia'), ''),
      nullif(btrim(v_row->>'address'), ''),
      nullif(btrim(v_row->>'postal_code'), ''),
      (nullif(v_row->>'lat', ''))::double precision,
      (nullif(v_row->>'lng', ''))::double precision,
      v_phone,
      v_email,
      nullif(btrim(v_row->>'website'), ''),
      coalesce(nullif(btrim(v_row->>'source'), ''), 'denue'),
      nullif(btrim(v_row->>'source_detail'), '')
    )
    ON CONFLICT (denue_id) DO UPDATE SET
      business_name = EXCLUDED.business_name,
      legal_name = EXCLUDED.legal_name,
      activity = EXCLUDED.activity,
      staff_range = EXCLUDED.staff_range,
      colonia = EXCLUDED.colonia,
      address = EXCLUDED.address,
      postal_code = EXCLUDED.postal_code,
      lat = EXCLUDED.lat,
      lng = EXCLUDED.lng,
      phone_e164 = coalesce(g.phone_e164, EXCLUDED.phone_e164),
      email = coalesce(g.email, EXCLUDED.email),
      website = coalesce(EXCLUDED.website, g.website),
      updated_at = now()
    RETURNING (xmax = 0), g.id INTO v_is_insert, v_id;

    UPDATE public.growth_leads g
    SET next_channel = public.growth_next_channel(g),
        stage = CASE WHEN g.stage = 'nuevo' AND public.growth_next_channel(g) = 'ninguno' THEN 'sin_contacto' ELSE g.stage END
    WHERE g.id = v_id;

    IF v_is_insert THEN v_inserted := v_inserted + 1; ELSE v_updated := v_updated + 1; END IF;
  END LOOP;

  RETURN QUERY SELECT v_inserted, v_updated, v_merged;
END;
$$;

-- growth_record_outcome: from 20261029000001_growth_leads.sql
CREATE OR REPLACE FUNCTION public.growth_record_outcome(
  p_lead_id uuid,
  p_outcome text,
  p_actor text DEFAULT 'operator',
  p_payload jsonb DEFAULT '{}'::jsonb,
  p_revisit_at date DEFAULT NULL,
  p_template_id uuid DEFAULT NULL
)
RETURNS public.growth_leads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead public.growth_leads;
  v_channel text;
  v_next text;
BEGIN
  SELECT * INTO v_lead FROM public.growth_leads WHERE id = p_lead_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'LEAD_NOT_FOUND';
  END IF;

  v_channel := CASE
    WHEN p_outcome LIKE 'whatsapp_%' OR p_outcome IN ('no_whatsapp', 'wrong_number') THEN 'whatsapp'
    WHEN p_outcome LIKE 'visit_%' THEN 'visita'
    WHEN p_outcome LIKE 'email_%' THEN 'correo'
    ELSE NULL
  END;

  CASE p_outcome
    WHEN 'whatsapp_sent' THEN
      v_lead.phone_status := CASE WHEN v_lead.phone_status = 'respondio' THEN 'respondio' ELSE 'enviado' END;
      v_lead.whatsapp_attempts := v_lead.whatsapp_attempts + 1;
      v_lead.last_whatsapp_at := now();
      IF v_lead.stage IN ('nuevo', 'sin_contacto', 'sin_respuesta') THEN v_lead.stage := 'contactado'; END IF;
    WHEN 'whatsapp_replied' THEN
      v_lead.phone_status := 'respondio';
      v_lead.snoozed_until := NULL;
      IF v_lead.stage NOT IN ('registrado', 'descartado') THEN v_lead.stage := 'conversando'; END IF;
    WHEN 'whatsapp_no_answer' THEN
      v_lead.phone_status := 'sin_respuesta';
    WHEN 'no_whatsapp' THEN
      v_lead.phone_status := 'sin_whatsapp';
    WHEN 'wrong_number' THEN
      v_lead.phone_status := 'equivocado';
      INSERT INTO public.growth_suppressions (phone_e164, reason, lead_id)
      VALUES (v_lead.phone_e164, 'equivocado', v_lead.id)
      ON CONFLICT DO NOTHING;
    WHEN 'email_sent' THEN
      v_lead.email_status := CASE WHEN v_lead.email_status = 'respondio' THEN 'respondio' ELSE 'enviado' END;
      IF v_lead.stage IN ('nuevo', 'sin_contacto', 'sin_respuesta') THEN v_lead.stage := 'contactado'; END IF;
    WHEN 'email_replied' THEN
      v_lead.email_status := 'respondio';
      v_lead.snoozed_until := NULL;
      IF v_lead.stage NOT IN ('registrado', 'descartado') THEN v_lead.stage := 'conversando'; END IF;
    WHEN 'email_no_answer' THEN
      v_lead.email_status := 'sin_respuesta';
    WHEN 'email_bounced' THEN
      v_lead.email_status := 'rebotado';
      INSERT INTO public.growth_suppressions (email, reason, lead_id)
      VALUES (v_lead.email, 'rebote', v_lead.id)
      ON CONFLICT DO NOTHING;
    WHEN 'visit_registered' THEN
      v_lead.visit_status := 'hecha';
      IF v_lead.stage NOT IN ('registrado', 'descartado') THEN v_lead.stage := 'conversando'; END IF;
    WHEN 'visit_interested' THEN
      v_lead.visit_status := 'interesado';
      v_lead.revisit_at := p_revisit_at;
      IF v_lead.stage NOT IN ('registrado', 'descartado') THEN v_lead.stage := 'conversando'; END IF;
    WHEN 'visit_absent' THEN
      v_lead.visit_status := 'no_estaba';
      v_lead.visit_attempts := v_lead.visit_attempts + 1;
      v_lead.revisit_at := p_revisit_at;
    WHEN 'visit_closed' THEN
      v_lead.visit_status := 'cerrado';
      v_lead.stage := 'descartado';
      v_lead.drop_reason := 'cerrado';
    WHEN 'visit_stuck' THEN
      NULL;
    WHEN 'not_interested', 'unsubscribed' THEN
      v_lead.stage := 'descartado';
      v_lead.drop_reason := CASE WHEN p_outcome = 'unsubscribed' THEN 'baja' ELSE coalesce(nullif(p_payload->>'reason', ''), 'rechazo') END;
      IF v_lead.phone_e164 IS NOT NULL THEN
        INSERT INTO public.growth_suppressions (phone_e164, reason, lead_id)
        VALUES (v_lead.phone_e164, CASE WHEN p_outcome = 'unsubscribed' THEN 'opt_out' ELSE 'rechazo' END, v_lead.id)
        ON CONFLICT DO NOTHING;
      END IF;
      IF v_lead.email IS NOT NULL THEN
        INSERT INTO public.growth_suppressions (email, reason, lead_id)
        VALUES (v_lead.email, CASE WHEN p_outcome = 'unsubscribed' THEN 'opt_out' ELSE 'rechazo' END, v_lead.id)
        ON CONFLICT DO NOTHING;
      END IF;
    ELSE
      RAISE EXCEPTION 'UNKNOWN_OUTCOME';
  END CASE;

  v_lead.reserved_until := NULL;
  v_lead.reserved_kind := NULL;
  v_next := public.growth_next_channel(v_lead);
  v_lead.next_channel := v_next;

  -- A channel that failed with nothing left to try puts the lead to sleep.
  IF v_next = 'ninguno' AND v_lead.stage IN ('nuevo', 'contactado', 'caliente') THEN
    IF v_lead.stage = 'nuevo' THEN
      v_lead.stage := 'sin_contacto';
    ELSE
      v_lead.stage := 'sin_respuesta';
      v_lead.snoozed_until := now() + interval '60 days';
    END IF;
  END IF;

  UPDATE public.growth_leads SET
    phone_status = v_lead.phone_status,
    email_status = v_lead.email_status,
    visit_status = v_lead.visit_status,
    stage = v_lead.stage,
    next_channel = v_lead.next_channel,
    whatsapp_attempts = v_lead.whatsapp_attempts,
    visit_attempts = v_lead.visit_attempts,
    last_whatsapp_at = v_lead.last_whatsapp_at,
    revisit_at = v_lead.revisit_at,
    snoozed_until = v_lead.snoozed_until,
    reserved_until = NULL,
    reserved_kind = NULL,
    drop_reason = v_lead.drop_reason,
    last_activity_at = now(),
    updated_at = now()
  WHERE id = v_lead.id
  RETURNING * INTO v_lead;

  INSERT INTO public.growth_lead_events (lead_id, type, channel, actor, template_id, payload)
  VALUES (v_lead.id, p_outcome, v_channel, coalesce(p_actor, 'operator'), p_template_id, coalesce(p_payload, '{}'::jsonb));

  RETURN v_lead;
END;
$$;

-- growth_reserve_batch: from 20261029000001_growth_leads.sql
CREATE OR REPLACE FUNCTION public.growth_reserve_batch(
  p_kind text,
  p_municipio text DEFAULT NULL,
  p_giro text DEFAULT NULL,
  p_limit integer DEFAULT 10,
  p_minutes integer DEFAULT 180
)
RETURNS SETOF public.growth_leads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_kind NOT IN ('whatsapp', 'seguimiento') THEN
    RAISE EXCEPTION 'UNKNOWN_BATCH_KIND';
  END IF;

  RETURN QUERY
  WITH picked AS (
    SELECT g.id
    FROM public.growth_leads g
    WHERE g.next_channel = 'whatsapp'
      AND (g.reserved_until IS NULL OR g.reserved_until < now())
      AND (g.snoozed_until IS NULL OR g.snoozed_until < now())
      AND (p_municipio IS NULL OR g.municipio = p_municipio)
      AND (p_giro IS NULL OR g.giro = p_giro)
      AND NOT public.growth_is_suppressed(g.phone_e164, NULL)
      AND (
        (p_kind = 'whatsapp' AND g.phone_status = 'desconocido' AND g.stage IN ('nuevo', 'sin_contacto'))
        OR (p_kind = 'seguimiento' AND g.phone_status = 'enviado' AND g.whatsapp_attempts = 1
            AND g.stage IN ('contactado', 'caliente') AND g.last_whatsapp_at < now() - interval '3 days')
      )
    ORDER BY g.colonia NULLS LAST, g.created_at, g.id
    LIMIT greatest(1, least(p_limit, 25))
    FOR UPDATE SKIP LOCKED
  ),
  reserved AS (
    UPDATE public.growth_leads g
    SET reserved_until = now() + make_interval(mins => greatest(5, p_minutes)),
        reserved_kind = p_kind
    FROM picked
    WHERE g.id = picked.id
    RETURNING g.*
  )
  SELECT * FROM reserved;
END;
$$;

-- growth_sweep_remaining: from 20261029000005_growth_formal_copy_and_sweep.sql
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

-- growth_nearby_leads: from 20261029000001_growth_leads.sql
CREATE OR REPLACE FUNCTION public.growth_nearby_leads(p_lat double precision, p_lng double precision, p_limit integer DEFAULT 10)
RETURNS TABLE (
  id uuid,
  business_name text,
  giro text,
  colonia text,
  address text,
  municipio text,
  lat double precision,
  lng double precision,
  phone_e164 text,
  visit_status text,
  revisit_at date,
  distance_m integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT g.id, g.business_name, g.giro, g.colonia, g.address, g.municipio, g.lat, g.lng, g.phone_e164,
         g.visit_status, g.revisit_at,
         round(6371000 * 2 * asin(sqrt(
           power(sin(radians(g.lat - p_lat) / 2), 2)
           + cos(radians(p_lat)) * cos(radians(g.lat)) * power(sin(radians(g.lng - p_lng) / 2), 2)
         )))::integer AS distance_m
  FROM public.growth_leads g
  WHERE g.lat BETWEEN p_lat - 0.02 AND p_lat + 0.02
    AND g.lng BETWEEN p_lng - 0.02 AND p_lng + 0.02
    AND g.stage NOT IN ('registrado', 'descartado')
    AND g.visit_status IN ('pendiente', 'no_estaba', 'interesado')
    AND g.visit_attempts < 3
    AND (g.revisit_at IS NULL OR g.revisit_at <= (now() AT TIME ZONE 'America/Mexico_City')::date)
  ORDER BY (g.revisit_at IS NOT NULL) DESC, distance_m
  LIMIT greatest(1, least(p_limit, 25));
$$;

-- growth_follow_up: from 20261030000002_growth_follow_up.sql
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

-- growth_update_lead_phone: from 20261029000004_growth_copy_and_phone.sql
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

-- growth_pipeline_counts: from 20261030000002_growth_follow_up.sql
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

-- growth_save_template_version: from 20261029000001_growth_leads.sql
CREATE OR REPLACE FUNCTION public.growth_save_template_version(
  p_channel text,
  p_giro text,
  p_step text,
  p_variant text,
  p_subject text,
  p_body text,
  p_created_by uuid
)
RETURNS public.growth_templates
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next integer;
  v_row public.growth_templates;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('growth_template:' || p_channel || ':' || coalesce(p_giro, '') || ':' || p_step || ':' || p_variant));

  SELECT coalesce(max(t.version), 0) + 1 INTO v_next
  FROM public.growth_templates t
  WHERE t.channel = p_channel AND coalesce(t.giro, '') = coalesce(p_giro, '') AND t.step = p_step AND t.variant = p_variant;

  UPDATE public.growth_templates t SET status = 'archived'
  WHERE t.channel = p_channel AND coalesce(t.giro, '') = coalesce(p_giro, '') AND t.step = p_step
    AND t.variant = p_variant AND t.status <> 'archived';

  INSERT INTO public.growth_templates (channel, giro, step, variant, version, subject, body, status, created_by)
  VALUES (p_channel, nullif(p_giro, ''), p_step, p_variant, v_next, nullif(p_subject, ''), p_body, 'active', p_created_by)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

-- growth_enroll_email_leads: from 20261029000002_growth_outreach.sql
CREATE OR REPLACE FUNCTION public.growth_enroll_email_leads(p_limit integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_weights jsonb;
  v_a numeric;
  v_b numeric;
  v_total numeric;
  v_count integer;
BEGIN
  SELECT email_variant_weights INTO v_weights FROM public.growth_settings WHERE id;
  v_a := greatest(coalesce((v_weights->>'A')::numeric, 0), 0);
  v_b := greatest(coalesce((v_weights->>'B')::numeric, 0), 0);
  v_total := greatest(v_a + v_b + greatest(coalesce((v_weights->>'C')::numeric, 0), 0), 1);

  WITH picked AS (
    SELECT g.id, random() * v_total AS roll
    FROM public.growth_leads g
    WHERE g.next_channel = 'correo'
      AND g.email IS NOT NULL
      AND g.email_status = 'desconocido'
      AND g.stage NOT IN ('registrado', 'descartado', 'conversando')
      AND (g.snoozed_until IS NULL OR g.snoozed_until < now())
      AND NOT EXISTS (SELECT 1 FROM public.growth_enrollments e WHERE e.lead_id = g.id)
      AND NOT public.growth_is_suppressed(NULL, g.email)
    ORDER BY CASE g.giro WHEN 'materiales' THEN 0 WHEN 'veterinaria' THEN 1 WHEN 'cafeteria' THEN 2 ELSE 3 END, g.created_at, g.id
    LIMIT greatest(0, least(p_limit, 200))
  ),
  inserted AS (
    INSERT INTO public.growth_enrollments (lead_id, variant)
    SELECT picked.id, CASE WHEN picked.roll < v_a THEN 'A' WHEN picked.roll < v_a + v_b THEN 'B' ELSE 'C' END
    FROM picked
    ON CONFLICT (lead_id) DO NOTHING
    RETURNING 1
  )
  SELECT count(*)::integer INTO v_count FROM inserted;
  RETURN v_count;
END;
$$;

-- growth_funnel: from 20261029000001_growth_leads.sql
CREATE OR REPLACE FUNCTION public.growth_funnel(p_from timestamptz, p_to timestamptz)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ev AS (
    SELECT * FROM public.growth_lead_events WHERE created_at >= p_from AND created_at < p_to
  ),
  acq AS (
    SELECT * FROM public.tenant_acquisitions WHERE captured_at >= p_from AND captured_at < p_to
  )
  SELECT jsonb_build_object(
    'contacted', (SELECT count(DISTINCT lead_id) FROM ev WHERE type IN ('whatsapp_sent', 'email_sent', 'visit_registered', 'visit_interested', 'visit_absent', 'visit_closed', 'not_interested')),
    'valid_channel', (SELECT count(DISTINCT lead_id) FROM ev WHERE type IN ('whatsapp_sent', 'email_sent', 'visit_registered', 'visit_interested', 'not_interested'))
                     - (SELECT count(DISTINCT lead_id) FROM ev WHERE type IN ('no_whatsapp', 'wrong_number', 'email_bounced')),
    'replied', (SELECT count(DISTINCT lead_id) FROM ev WHERE type IN ('whatsapp_replied', 'email_replied', 'visit_interested', 'visit_registered')),
    'viewed', (SELECT count(DISTINCT lead_id) FROM ev WHERE type = 'para_viewed'),
    'claimed', (SELECT count(DISTINCT lead_id) FROM ev WHERE type = 'claim_clicked'),
    'registered_engine', (SELECT count(*) FROM acq WHERE bucket = 'engine'),
    'registered_assisted', (SELECT count(*) FROM acq WHERE bucket = 'assisted'),
    'registered_self', (SELECT count(*) FROM acq WHERE bucket = 'self'),
    'by_channel', coalesce((SELECT jsonb_object_agg(coalesce(channel, 'otro'), n) FROM (SELECT channel, count(*) AS n FROM acq WHERE bucket <> 'self' GROUP BY channel) c), '{}'::jsonb),
    'drop_reasons', jsonb_build_object(
      'sin_whatsapp', (SELECT count(*) FROM ev WHERE type = 'no_whatsapp'),
      'equivocado', (SELECT count(*) FROM ev WHERE type = 'wrong_number'),
      'rebote', (SELECT count(*) FROM ev WHERE type = 'email_bounced'),
      'no_estaba', (SELECT count(*) FROM ev WHERE type = 'visit_absent'),
      'cerrado', (SELECT count(*) FROM ev WHERE type = 'visit_closed'),
      'no_le_interesa', (SELECT count(*) FROM ev WHERE type = 'not_interested' AND coalesce(payload->>'reason', 'rechazo') = 'rechazo'),
      'ya_usa_otra', (SELECT count(*) FROM ev WHERE type = 'not_interested' AND payload->>'reason' = 'competencia'),
      'baja', (SELECT count(*) FROM ev WHERE type = 'unsubscribed'),
      'sin_respuesta', (SELECT count(*) FROM ev WHERE type IN ('whatsapp_no_answer', 'email_no_answer'))
    ),
    'by_municipio', coalesce((
      SELECT jsonb_object_agg(municipio, jsonb_build_object('contacted', contacted, 'registered', registered))
      FROM (
        SELECT g.municipio,
               count(DISTINCT ev.lead_id) FILTER (WHERE ev.type IN ('whatsapp_sent', 'email_sent', 'visit_registered', 'visit_interested', 'visit_absent')) AS contacted,
               count(DISTINCT ev.lead_id) FILTER (WHERE ev.type = 'registered') AS registered
        FROM ev JOIN public.growth_leads g ON g.id = ev.lead_id
        GROUP BY g.municipio
      ) m
    ), '{}'::jsonb),
    'by_template', coalesce((
      SELECT jsonb_agg(jsonb_build_object('template_id', t.id, 'channel', t.channel, 'giro', t.giro, 'step', t.step,
             'variant', t.variant, 'version', t.version, 'sent', s.sent, 'replied', s.replied, 'rejected', s.rejected, 'registered', s.registered)
             ORDER BY s.sent DESC)
      FROM (
        SELECT sent_ev.template_id,
               count(DISTINCT sent_ev.lead_id) AS sent,
               count(DISTINCT r.lead_id) FILTER (WHERE r.type IN ('whatsapp_replied', 'email_replied')) AS replied,
               count(DISTINCT r.lead_id) FILTER (WHERE r.type IN ('not_interested', 'unsubscribed')) AS rejected,
               count(DISTINCT r.lead_id) FILTER (WHERE r.type = 'registered') AS registered
        FROM ev sent_ev
        LEFT JOIN public.growth_lead_events r ON r.lead_id = sent_ev.lead_id AND r.created_at >= sent_ev.created_at
        WHERE sent_ev.template_id IS NOT NULL AND sent_ev.type IN ('whatsapp_sent', 'email_sent')
        GROUP BY sent_ev.template_id
      ) s
      JOIN public.growth_templates t ON t.id = s.template_id
    ), '[]'::jsonb)
  );
$$;

-- growth_link_registration: from 20261029000001_growth_leads.sql
CREATE OR REPLACE FUNCTION public.growth_link_registration(
  p_tenant_id uuid,
  p_email text,
  p_phone text,
  p_token_hash text DEFAULT NULL,
  p_heard_from text DEFAULT NULL,
  p_utm jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (bucket text, lead_id uuid, channel text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead_id uuid;
  v_bucket text := 'self';
  v_channel text;
BEGIN
  IF EXISTS (SELECT 1 FROM public.tenant_acquisitions a WHERE a.tenant_id = p_tenant_id) THEN
    RETURN QUERY SELECT a.bucket, a.lead_id, a.channel FROM public.tenant_acquisitions a WHERE a.tenant_id = p_tenant_id;
    RETURN;
  END IF;

  IF p_token_hash IS NOT NULL THEN
    SELECT l.lead_id, coalesce(l.channel, 'para') INTO v_lead_id, v_channel
    FROM public.growth_lead_links l
    WHERE l.token_hash = p_token_hash AND l.purpose = 'para';
    IF v_lead_id IS NOT NULL THEN
      v_bucket := 'engine';
    END IF;
  END IF;

  IF v_lead_id IS NULL THEN
    SELECT g.id INTO v_lead_id
    FROM public.growth_leads g
    WHERE g.stage NOT IN ('nuevo', 'sin_contacto', 'registrado')
      AND g.last_activity_at > now() - interval '30 days'
      AND ((p_phone IS NOT NULL AND g.phone_e164 = p_phone) OR (p_email IS NOT NULL AND lower(g.email) = lower(p_email)))
    ORDER BY g.last_activity_at DESC
    LIMIT 1;
    IF v_lead_id IS NOT NULL THEN
      v_bucket := 'assisted';
      SELECT e.channel INTO v_channel
      FROM public.growth_lead_events e
      WHERE e.lead_id = v_lead_id AND e.channel IS NOT NULL
      ORDER BY e.created_at DESC
      LIMIT 1;
    ELSIF p_heard_from = 'saul' THEN
      v_bucket := 'assisted';
      v_channel := 'declarado';
    END IF;
  END IF;

  INSERT INTO public.tenant_acquisitions (tenant_id, bucket, lead_id, channel, heard_from, utm)
  VALUES (p_tenant_id, v_bucket, v_lead_id, v_channel, nullif(p_heard_from, ''), coalesce(p_utm, '{}'::jsonb))
  ON CONFLICT (tenant_id) DO NOTHING;

  IF v_lead_id IS NOT NULL THEN
    UPDATE public.growth_leads SET
      stage = 'registrado',
      next_channel = 'ninguno',
      registered_tenant_id = p_tenant_id,
      reserved_until = NULL,
      last_activity_at = now(),
      updated_at = now()
    WHERE id = v_lead_id;
    INSERT INTO public.growth_lead_events (lead_id, type, channel, actor, payload)
    VALUES (v_lead_id, 'registered', v_channel, 'prospect', jsonb_build_object('tenant_id', p_tenant_id, 'bucket', v_bucket));
  END IF;

  RETURN QUERY SELECT v_bucket, v_lead_id, v_channel;
END;
$$;

DO $$
DECLARE
  v_fn text;
BEGIN
  FOREACH v_fn IN ARRAY ARRAY[
    'public.growth_is_suppressed(text, text)',
    'public.growth_next_channel(public.growth_leads)',
    'public.growth_upsert_leads(jsonb)',
    'public.growth_record_outcome(uuid, text, text, jsonb, date, uuid)',
    'public.growth_reserve_batch(text, text, text, integer, integer)',
    'public.growth_sweep_remaining(text, text, text)',
    'public.growth_nearby_leads(double precision, double precision, integer)',
    'public.growth_follow_up(uuid, text, timestamptz, text)',
    'public.growth_update_lead_phone(uuid, text)',
    'public.growth_pipeline_counts(text, text)',
    'public.growth_save_template_version(text, text, text, text, text, text, uuid)',
    'public.growth_enroll_email_leads(integer)',
    'public.growth_funnel(timestamptz, timestamptz)',
    'public.growth_link_registration(uuid, text, text, text, text, jsonb)'
  ]
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', v_fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', v_fn);
  END LOOP;
END $$;

COMMIT;
