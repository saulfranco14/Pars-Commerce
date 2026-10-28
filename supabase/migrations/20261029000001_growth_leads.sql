-- =============================================================================
-- GROWTH ENGINE (sprint oriente): prospects with per-channel state, outcomes,
-- private "Para ti" links, suppressions, registration attribution, editable
-- outreach templates and the Telegram operator chats. Additive only:
--   * new tables: growth_settings, growth_leads, growth_lead_events,
--     growth_lead_links, growth_suppressions, growth_templates,
--     growth_operator_chats, tenant_acquisitions
--   * no existing table or function is altered
-- Every table is service-role only. Reverted by supabase/snippets/growth_rollback.sql.
-- =============================================================================

-- ── 1. Engine settings (single row) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.growth_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  paused boolean NOT NULL DEFAULT false,
  paused_reason text,
  timezone text NOT NULL DEFAULT 'America/Mexico_City',
  send_days smallint[] NOT NULL DEFAULT ARRAY[1, 2, 3, 4, 5, 6]::smallint[],
  send_start_hour smallint NOT NULL DEFAULT 9 CHECK (send_start_hour BETWEEN 0 AND 23),
  send_end_hour smallint NOT NULL DEFAULT 18 CHECK (send_end_hour BETWEEN 1 AND 24),
  signature text NOT NULL DEFAULT 'Saúl · Tlaco',
  visit_municipios text[] NOT NULL DEFAULT ARRAY['Chimalhuacán', 'Nezahualcóyotl']::text[],
  email_variant_weights jsonb NOT NULL DEFAULT '{"A": 34, "B": 33, "C": 33}'::jsonb,
  digest_hour smallint NOT NULL DEFAULT 20 CHECK (digest_hour BETWEEN 0 AND 23),
  last_digest_on date,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.growth_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

-- ── 2. Prospects ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.growth_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  denue_id text UNIQUE,
  business_name text NOT NULL CHECK (char_length(btrim(business_name)) BETWEEN 1 AND 160),
  legal_name text,
  giro text NOT NULL,
  catalog_template_key text,
  activity text,
  staff_range text,
  municipio text NOT NULL,
  colonia text,
  address text,
  postal_code text,
  lat double precision,
  lng double precision,
  phone_e164 text CHECK (phone_e164 IS NULL OR phone_e164 ~ '^\+52[0-9]{10}$'),
  email text,
  website text,
  source text NOT NULL DEFAULT 'denue',
  source_detail text,
  phone_status text NOT NULL DEFAULT 'desconocido'
    CHECK (phone_status IN ('desconocido', 'enviado', 'respondio', 'sin_respuesta', 'sin_whatsapp', 'equivocado')),
  email_status text NOT NULL DEFAULT 'desconocido'
    CHECK (email_status IN ('desconocido', 'enviado', 'respondio', 'sin_respuesta', 'rebotado')),
  visit_status text NOT NULL DEFAULT 'pendiente'
    CHECK (visit_status IN ('pendiente', 'no_estaba', 'interesado', 'cerrado', 'hecha')),
  stage text NOT NULL DEFAULT 'nuevo'
    CHECK (stage IN ('nuevo', 'contactado', 'conversando', 'caliente', 'registrado', 'sin_respuesta', 'descartado', 'sin_contacto')),
  next_channel text NOT NULL DEFAULT 'ninguno' CHECK (next_channel IN ('whatsapp', 'visita', 'correo', 'ninguno')),
  whatsapp_attempts integer NOT NULL DEFAULT 0,
  visit_attempts integer NOT NULL DEFAULT 0,
  last_whatsapp_at timestamptz,
  revisit_at date,
  snoozed_until timestamptz,
  reserved_until timestamptz,
  reserved_kind text,
  drop_reason text,
  registered_tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  last_activity_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- One contact per phone and per email: branches sharing a number are merged at import.
CREATE UNIQUE INDEX IF NOT EXISTS growth_leads_phone_key ON public.growth_leads (phone_e164) WHERE phone_e164 IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS growth_leads_email_key ON public.growth_leads (lower(email)) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS growth_leads_queue_idx ON public.growth_leads (next_channel, municipio, giro, stage);
CREATE INDEX IF NOT EXISTS growth_leads_geo_idx ON public.growth_leads (lat, lng);
CREATE INDEX IF NOT EXISTS growth_leads_stage_idx ON public.growth_leads (stage, last_activity_at DESC);

CREATE TABLE IF NOT EXISTS public.growth_lead_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.growth_leads(id) ON DELETE CASCADE,
  type text NOT NULL,
  channel text,
  actor text NOT NULL DEFAULT 'system' CHECK (actor IN ('system', 'operator', 'prospect')),
  template_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS growth_lead_events_lead_idx ON public.growth_lead_events (lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS growth_lead_events_type_idx ON public.growth_lead_events (type, created_at DESC);
CREATE INDEX IF NOT EXISTS growth_lead_events_template_idx ON public.growth_lead_events (template_id) WHERE template_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.growth_lead_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.growth_leads(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  purpose text NOT NULL CHECK (purpose IN ('para', 'baja')),
  channel text,
  template_id uuid,
  view_count integer NOT NULL DEFAULT 0,
  last_viewed_at timestamptz,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS growth_lead_links_lead_idx ON public.growth_lead_links (lead_id);

CREATE TABLE IF NOT EXISTS public.growth_suppressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_e164 text,
  email text,
  reason text NOT NULL CHECK (reason IN ('opt_out', 'rechazo', 'rebote', 'equivocado', 'manual')),
  lead_id uuid REFERENCES public.growth_leads(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (phone_e164 IS NOT NULL OR email IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS growth_suppressions_phone_key ON public.growth_suppressions (phone_e164) WHERE phone_e164 IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS growth_suppressions_email_key ON public.growth_suppressions (lower(email)) WHERE email IS NOT NULL;

-- ── 3. Attribution of every new tenant ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tenant_acquisitions (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  bucket text NOT NULL CHECK (bucket IN ('engine', 'assisted', 'self')),
  lead_id uuid REFERENCES public.growth_leads(id) ON DELETE SET NULL,
  channel text,
  heard_from text,
  utm jsonb NOT NULL DEFAULT '{}'::jsonb,
  captured_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tenant_acquisitions_bucket_idx ON public.tenant_acquisitions (bucket, captured_at DESC);

-- ── 4. Editable outreach templates (immutable versions) ──────────────────────
CREATE TABLE IF NOT EXISTS public.growth_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL CHECK (channel IN ('whatsapp', 'email')),
  giro text,
  step text NOT NULL CHECK (step IN ('m1', 'seguimiento', 'si', 'd0', 'd3', 'd7')),
  variant text NOT NULL DEFAULT 'A' CHECK (variant IN ('A', 'B', 'C')),
  version integer NOT NULL DEFAULT 1 CHECK (version >= 1),
  subject text,
  body text NOT NULL CHECK (char_length(body) BETWEEN 10 AND 4000),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (channel = 'whatsapp' OR subject IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS growth_templates_version_key
  ON public.growth_templates (channel, coalesce(giro, ''), step, variant, version);
-- A paused version still blocks a second live one for the same slot.
CREATE UNIQUE INDEX IF NOT EXISTS growth_templates_live_key
  ON public.growth_templates (channel, coalesce(giro, ''), step, variant) WHERE status <> 'archived';

-- ── 5. Telegram operator chats ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.growth_operator_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_id bigint UNIQUE,
  link_code_hash text UNIQUE,
  link_expires_at timestamptz,
  linked_at timestamptz,
  notify boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── 6. RLS: service role only ────────────────────────────────────────────────
ALTER TABLE public.growth_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_lead_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_lead_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_suppressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_acquisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_operator_chats ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  v_table text;
BEGIN
  FOREACH v_table IN ARRAY ARRAY['growth_settings', 'growth_leads', 'growth_lead_events', 'growth_lead_links',
    'growth_suppressions', 'tenant_acquisitions', 'growth_templates', 'growth_operator_chats']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "growth: service role" ON public.%I', v_table);
    EXECUTE format('CREATE POLICY "growth: service role" ON public.%I FOR ALL USING (auth.role() = ''service_role'') WITH CHECK (auth.role() = ''service_role'')', v_table);
  END LOOP;
END $$;

-- ── 7. Channel cascade: WhatsApp → email → visit → nothing ───────────────────
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

-- ── 8. Bulk import with dedup ────────────────────────────────────────────────
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

-- ── 9. Outcomes: one transaction for state, cascade, suppressions and event ──
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

-- ── 10. Operator batches without repeats ─────────────────────────────────────
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

-- ── 11. Visit routes (no PostGIS: bounding box + haversine) ──────────────────
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

-- ── 12. "Para ti" link tracking ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.growth_track_link(p_token_hash text, p_event text, p_seconds integer DEFAULT NULL)
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
  IF p_event NOT IN ('para_viewed', 'para_seconds', 'claim_clicked', 'help_clicked') THEN
    RAISE EXCEPTION 'UNKNOWN_LINK_EVENT';
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

  INSERT INTO public.growth_lead_events (lead_id, type, channel, actor, template_id, payload)
  VALUES (v_lead.id, p_event, v_link.channel, 'prospect', v_link.template_id,
          jsonb_strip_nulls(jsonb_build_object('seconds', p_seconds, 'view_count', v_link.view_count)));

  RETURN QUERY SELECT v_lead.id, v_lead.business_name, v_lead.municipio, v_link.view_count, v_hot;
END;
$$;

-- ── 13. Registration attribution: prospect link > contacted match > self ─────
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

-- ── 14. Template versions: archive the live one and insert the next ──────────
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

-- ── 15. Funnel ───────────────────────────────────────────────────────────────
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

-- ── 16. Seed templates (owner edits them later from Plataforma) ──────────────
INSERT INTO public.growth_templates (channel, giro, step, variant, version, subject, body) VALUES
  ('whatsapp', NULL, 'm1', 'A', 1, NULL,
   E'{saludo}, ¿es {negocio}?\n\nSoy Saúl, {cercania}. Estoy ayudando a {giro_plural} de la zona a que sus clientes les pidan por celular y les paguen sin terminal.\n\nLe armé un ejemplo con {giro_linea}. ¿Se lo mando para que lo vea? No cuesta nada.'),
  ('whatsapp', NULL, 'm1', 'B', 1, NULL,
   E'{saludo}, ¿es {negocio}?\n\nSoy Saúl, {cercania}. Vi su negocio en {colonia} y le armé un ejemplo de cómo se vería para que sus clientes le pidan por celular y le paguen sin terminal:\n{link}\n\nSi le late, se activa gratis en 2 minutos. Y si prefiere, paso a su local y se la dejo lista.'),
  ('whatsapp', NULL, 'seguimiento', 'A', 1, NULL,
   E'{saludo}. ¿Pudo ver su tienda? Aquí está otra vez:\n{link}\n\nSi quiere, paso a su local y se la dejo lista en 15 minutos, sin costo.'),
  ('whatsapp', NULL, 'si', 'A', 1, NULL,
   E'¡Va! Aquí está: {link}\n\nAhí mismo la puede activar, es gratis. Si quiere, paso a su local en la semana y se la dejo funcionando. ¿Qué día le queda?'),
  ('email', NULL, 'd0', 'A', 1, '{negocio}: te armé tu tienda',
   E'Hola, equipo de {negocio}:\n\nSoy Saúl, de Tlaco, {cercania}. Vi {negocio} en {colonia} y te preparé una tienda con {giro_linea}.\n\nTus clientes la abren desde su celular, piden y pagan sin descargar nada y sin terminal.\n\nLa puedes ver aquí. Es privada, solo tú tienes el link:\n{link}\n\nSi te sirve, la activas gratis en 2 minutos.\n\n{firma}'),
  ('email', NULL, 'd0', 'B', 1, 'Una tienda para {negocio}',
   E'Hola, equipo de {negocio}:\n\nSoy Saúl, de Tlaco, {cercania}. Vi {negocio} en {colonia} y armé una tienda de prueba con {giro_linea}, para que tus clientes pidan y paguen desde su celular, sin app y sin terminal.\n\n¿Te mando el link para que la veas? Es gratis y no tienes que instalar nada.\n\n{firma}'),
  ('email', NULL, 'd0', 'C', 1, 'Pregunta rápida, {negocio}',
   E'Hola, equipo de {negocio}:\n\nUna pregunta rápida: {giro_pregunta}\n\nTe lo pregunto porque armé para {negocio} una tienda donde puedes {giro_beneficio}. La puedes ver aquí:\n{link}\n\n{firma}'),
  ('email', NULL, 'd3', 'A', 1, 'Re: {negocio}',
   E'Hola de nuevo.\n\nUna idea para {negocio}: {giro_beneficio}.\n\nTu tienda sigue lista en el mismo link:\n{link}\n\nSi quieres, paso a tu local y te la enseño en 15 minutos.\n\n{firma}'),
  ('email', NULL, 'd7', 'A', 1, 'Re: {negocio}',
   E'Es la última vez que te escribo sobre esto.\n\nTu tienda de prueba sigue aquí. Si la quieres, actívala con un clic y queda tal cual:\n{link}\n\nSi ahorita no es buen momento, no hay problema.\n\n{firma}')
ON CONFLICT DO NOTHING;

-- ── 17. Grants: everything above is server-only ─────────────────────────────
REVOKE ALL ON FUNCTION public.growth_is_suppressed(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.growth_next_channel(public.growth_leads) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.growth_upsert_leads(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.growth_record_outcome(uuid, text, text, jsonb, date, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.growth_reserve_batch(text, text, text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.growth_nearby_leads(double precision, double precision, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.growth_track_link(text, text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.growth_link_registration(uuid, text, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.growth_save_template_version(text, text, text, text, text, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.growth_funnel(timestamptz, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.growth_is_suppressed(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.growth_next_channel(public.growth_leads) TO service_role;
GRANT EXECUTE ON FUNCTION public.growth_upsert_leads(jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.growth_record_outcome(uuid, text, text, jsonb, date, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.growth_reserve_batch(text, text, text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.growth_nearby_leads(double precision, double precision, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.growth_track_link(text, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.growth_link_registration(uuid, text, text, text, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.growth_save_template_version(text, text, text, text, text, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.growth_funnel(timestamptz, timestamptz) TO service_role;
