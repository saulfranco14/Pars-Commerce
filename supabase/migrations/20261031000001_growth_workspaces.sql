-- =============================================================================
-- GROWTH: prospecting workspaces, team members and lead owners.
--   * new tables: growth_workspaces (Tlaco is the first one), growth_members
--   * workspace_id on leads, suppressions, templates, settings, mailboxes and
--     operator chats (existing rows go to Tlaco); uniqueness is per workspace
--   * owner_user_id on leads, actor_user_id on events, acquired_by on acquisitions
--   * ownership rule in SQL: a prospector acts on own leads or on unowned leads
--     inside their zones; a coordinator acts on every lead of the workspace;
--     the first operator action on an unowned lead makes it theirs
--   * new RPCs: growth_add_lead, growth_assign_leads, growth_contact_owner,
--     growth_update_lead_email, growth_can_act
-- Growth objects only. Reverted by supabase/snippets/growth_workspaces_rollback.sql.
-- =============================================================================

-- ── 1. Workspaces and members ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.growth_workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]{2,60}$'),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 80),
  -- NULL = the platform's own workspace (Tlaco); a tenant gets at most one.
  tenant_id uuid UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.growth_workspaces (id, slug, name)
VALUES ('00000000-0000-4000-8000-000000000001', 'tlaco', 'Tlaco')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.growth_members (
  workspace_id uuid NOT NULL REFERENCES public.growth_workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'prospector' CHECK (role IN ('coordinador', 'prospector')),
  status text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'suspended')),
  display_name text NOT NULL CHECK (char_length(btrim(display_name)) BETWEEN 2 AND 80),
  signature text CHECK (signature IS NULL OR char_length(btrim(signature)) BETWEEN 2 AND 80),
  whatsapp_e164 text CHECK (whatsapp_e164 IS NULL OR whatsapp_e164 ~ '^\+52[0-9]{10}$'),
  -- [{"municipio": "Ecatepec de Morelos", "colonias": ["Ciudad Azteca"]}]; no colonias = the whole municipio.
  zones jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(zones) = 'array'),
  daily_goal integer NOT NULL DEFAULT 20 CHECK (daily_goal BETWEEN 1 AND 200),
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at timestamptz NOT NULL DEFAULT now(),
  joined_at timestamptz,
  PRIMARY KEY (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS growth_members_user_idx ON public.growth_members (user_id);

ALTER TABLE public.growth_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "growth: service role" ON public.growth_workspaces;
CREATE POLICY "growth: service role" ON public.growth_workspaces FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
DROP POLICY IF EXISTS "growth: service role" ON public.growth_members;
CREATE POLICY "growth: service role" ON public.growth_members FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ── 2. workspace_id on the scoped tables (existing rows are Tlaco's) ─────────
ALTER TABLE public.growth_leads ADD COLUMN IF NOT EXISTS workspace_id uuid NOT NULL
  DEFAULT '00000000-0000-4000-8000-000000000001' REFERENCES public.growth_workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.growth_suppressions ADD COLUMN IF NOT EXISTS workspace_id uuid NOT NULL
  DEFAULT '00000000-0000-4000-8000-000000000001' REFERENCES public.growth_workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.growth_templates ADD COLUMN IF NOT EXISTS workspace_id uuid NOT NULL
  DEFAULT '00000000-0000-4000-8000-000000000001' REFERENCES public.growth_workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.growth_mailboxes ADD COLUMN IF NOT EXISTS workspace_id uuid NOT NULL
  DEFAULT '00000000-0000-4000-8000-000000000001' REFERENCES public.growth_workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.growth_operator_chats ADD COLUMN IF NOT EXISTS workspace_id uuid NOT NULL
  DEFAULT '00000000-0000-4000-8000-000000000001' REFERENCES public.growth_workspaces(id) ON DELETE CASCADE;

ALTER TABLE public.growth_settings ADD COLUMN IF NOT EXISTS workspace_id uuid
  DEFAULT '00000000-0000-4000-8000-000000000001' REFERENCES public.growth_workspaces(id) ON DELETE CASCADE;
UPDATE public.growth_settings SET workspace_id = '00000000-0000-4000-8000-000000000001' WHERE workspace_id IS NULL;
ALTER TABLE public.growth_settings DROP CONSTRAINT IF EXISTS growth_settings_pkey;
ALTER TABLE public.growth_settings DROP COLUMN IF EXISTS id;
ALTER TABLE public.growth_settings ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE public.growth_settings ADD PRIMARY KEY (workspace_id);
INSERT INTO public.growth_settings (workspace_id) VALUES ('00000000-0000-4000-8000-000000000001') ON CONFLICT DO NOTHING;

ALTER TABLE public.growth_leads DROP CONSTRAINT IF EXISTS growth_leads_denue_id_key;
DROP INDEX IF EXISTS public.growth_leads_phone_key;
DROP INDEX IF EXISTS public.growth_leads_email_key;
CREATE UNIQUE INDEX IF NOT EXISTS growth_leads_denue_key ON public.growth_leads (workspace_id, denue_id);
CREATE UNIQUE INDEX IF NOT EXISTS growth_leads_phone_key ON public.growth_leads (workspace_id, phone_e164) WHERE phone_e164 IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS growth_leads_email_key ON public.growth_leads (workspace_id, lower(email)) WHERE email IS NOT NULL;

DROP INDEX IF EXISTS public.growth_suppressions_phone_key;
DROP INDEX IF EXISTS public.growth_suppressions_email_key;
CREATE UNIQUE INDEX IF NOT EXISTS growth_suppressions_phone_key ON public.growth_suppressions (workspace_id, phone_e164) WHERE phone_e164 IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS growth_suppressions_email_key ON public.growth_suppressions (workspace_id, lower(email)) WHERE email IS NOT NULL;

DROP INDEX IF EXISTS public.growth_templates_version_key;
DROP INDEX IF EXISTS public.growth_templates_live_key;
CREATE UNIQUE INDEX IF NOT EXISTS growth_templates_version_key
  ON public.growth_templates (workspace_id, channel, coalesce(giro, ''), step, variant, version);
CREATE UNIQUE INDEX IF NOT EXISTS growth_templates_live_key
  ON public.growth_templates (workspace_id, channel, coalesce(giro, ''), step, variant) WHERE status <> 'archived';

DROP INDEX IF EXISTS public.growth_mailboxes_address_key;
CREATE UNIQUE INDEX IF NOT EXISTS growth_mailboxes_address_key ON public.growth_mailboxes (workspace_id, lower(address));

-- ── 3. Owners and actors ─────────────────────────────────────────────────────
ALTER TABLE public.growth_leads
  ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS owned_at timestamptz,
  ADD COLUMN IF NOT EXISTS reserved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.growth_lead_events ADD COLUMN IF NOT EXISTS actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.tenant_acquisitions ADD COLUMN IF NOT EXISTS acquired_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS growth_leads_owner_idx ON public.growth_leads (workspace_id, owner_user_id, stage);

-- Every platform admin coordinates Tlaco; the first one owns what was already worked.
INSERT INTO public.growth_members (workspace_id, user_id, role, status, display_name, signature, joined_at)
SELECT '00000000-0000-4000-8000-000000000001', pa.user_id, 'coordinador', 'active',
       coalesce(nullif(btrim(p.display_name), ''), split_part(coalesce(p.email, 'Coordinador'), '@', 1)),
       (SELECT s.signature FROM public.growth_settings s WHERE s.workspace_id = '00000000-0000-4000-8000-000000000001'),
       now()
FROM public.platform_admins pa
LEFT JOIN public.profiles p ON p.id = pa.user_id
ON CONFLICT DO NOTHING;

UPDATE public.growth_leads g SET owner_user_id = first_admin.user_id, owned_at = coalesce(g.last_activity_at, now())
FROM (SELECT pa.user_id FROM public.platform_admins pa ORDER BY pa.created_at, pa.user_id LIMIT 1) first_admin
WHERE g.owner_user_id IS NULL AND g.stage NOT IN ('nuevo', 'sin_contacto');

UPDATE public.tenant_acquisitions a SET acquired_by = g.owner_user_id
FROM public.growth_leads g
WHERE a.lead_id = g.id AND a.acquired_by IS NULL;

-- ── 4. Who may act on a lead ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.growth_member_role(p_workspace_id uuid, p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  SELECT m.role INTO v_role FROM public.growth_members m
  WHERE m.workspace_id = p_workspace_id AND m.user_id = p_user_id AND m.status IN ('invited', 'active');
  IF v_role IS NOT NULL THEN
    RETURN v_role;
  END IF;
  -- Platform admins coordinate the platform workspace even without a member row.
  IF EXISTS (SELECT 1 FROM public.growth_workspaces w WHERE w.id = p_workspace_id AND w.tenant_id IS NULL)
     AND EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = p_user_id) THEN
    RETURN 'coordinador';
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.growth_in_zones(p_municipio text, p_colonia text, p_zones jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM jsonb_array_elements(coalesce(p_zones, '[]'::jsonb)) z
    WHERE z->>'municipio' = p_municipio
      AND (coalesce(jsonb_array_length(z->'colonias'), 0) = 0
           OR lower(btrim(coalesce(p_colonia, ''))) IN (SELECT lower(btrim(c)) FROM jsonb_array_elements_text(z->'colonias') c))
  );
$$;

-- p_actor_id NULL means the engine itself (cron, inbox, attribution).
CREATE OR REPLACE FUNCTION public.growth_can_act(p_lead public.growth_leads, p_actor_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_zones jsonb;
BEGIN
  IF p_actor_id IS NULL THEN
    RETURN true;
  END IF;
  v_role := public.growth_member_role(p_lead.workspace_id, p_actor_id);
  IF v_role = 'coordinador' THEN
    RETURN true;
  END IF;
  IF v_role IS NULL THEN
    RETURN false;
  END IF;
  IF p_lead.owner_user_id = p_actor_id THEN
    RETURN true;
  END IF;
  SELECT m.zones INTO v_zones FROM public.growth_members m WHERE m.workspace_id = p_lead.workspace_id AND m.user_id = p_actor_id;
  RETURN p_lead.owner_user_id IS NULL AND public.growth_in_zones(p_lead.municipio, p_lead.colonia, v_zones);
END;
$$;

-- Same rule for TypeScript paths that write a lead directly (giro correction).
CREATE OR REPLACE FUNCTION public.growth_can_act_on(p_lead_id uuid, p_actor_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce((SELECT public.growth_can_act(g, p_actor_id) FROM public.growth_leads g WHERE g.id = p_lead_id), false);
$$;

-- Locks the lead, checks access and claims it when nobody owns it yet.
CREATE OR REPLACE FUNCTION public.growth_lock_for_actor(p_lead_id uuid, p_actor_id uuid)
RETURNS public.growth_leads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead public.growth_leads;
BEGIN
  SELECT * INTO v_lead FROM public.growth_leads WHERE id = p_lead_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'LEAD_NOT_FOUND';
  END IF;
  IF NOT public.growth_can_act(v_lead, p_actor_id) THEN
    RAISE EXCEPTION 'NOT_YOUR_LEAD';
  END IF;
  IF p_actor_id IS NOT NULL AND v_lead.owner_user_id IS NULL THEN
    UPDATE public.growth_leads g SET owner_user_id = p_actor_id, owned_at = now()
    WHERE g.id = p_lead_id RETURNING * INTO v_lead;
  END IF;
  RETURN v_lead;
END;
$$;

-- ── 5. Suppressions and channel cascade per workspace ───────────────────────
DROP FUNCTION IF EXISTS public.growth_is_suppressed(text, text);
CREATE OR REPLACE FUNCTION public.growth_is_suppressed(
  p_phone text,
  p_email text,
  p_workspace_id uuid DEFAULT '00000000-0000-4000-8000-000000000001'
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.growth_suppressions s
    WHERE s.workspace_id = p_workspace_id
      AND ((p_phone IS NOT NULL AND s.phone_e164 = p_phone)
        OR (p_email IS NOT NULL AND lower(s.email) = lower(p_email)))
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
  IF p_lead.stage = 'cita' THEN
    RETURN 'visita';
  END IF;
  SELECT visit_municipios INTO v_visit_zones FROM public.growth_settings WHERE workspace_id = p_lead.workspace_id;

  IF p_lead.phone_e164 IS NOT NULL
     AND p_lead.phone_status IN ('desconocido', 'enviado', 'respondio')
     AND NOT public.growth_is_suppressed(p_lead.phone_e164, NULL, p_lead.workspace_id) THEN
    RETURN 'whatsapp';
  END IF;
  -- Email runs on its own, so it goes before visits; routes still include every open lead.
  IF p_lead.email IS NOT NULL
     AND p_lead.email_status IN ('desconocido', 'enviado', 'respondio')
     AND NOT public.growth_is_suppressed(NULL, p_lead.email, p_lead.workspace_id) THEN
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

-- ── 6. Import per workspace ──────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.growth_upsert_leads(jsonb);
CREATE OR REPLACE FUNCTION public.growth_upsert_leads(
  p_rows jsonb,
  p_workspace_id uuid DEFAULT '00000000-0000-4000-8000-000000000001'
)
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
      SELECT 1 FROM public.growth_leads g
      WHERE g.workspace_id = p_workspace_id AND g.phone_e164 = v_phone AND g.denue_id IS DISTINCT FROM v_denue
    ) THEN
      v_phone := NULL;
      v_merged := v_merged + 1;
    END IF;
    IF v_email IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.growth_leads g
      WHERE g.workspace_id = p_workspace_id AND lower(g.email) = v_email AND g.denue_id IS DISTINCT FROM v_denue
    ) THEN
      v_email := NULL;
      v_merged := v_merged + 1;
    END IF;

    INSERT INTO public.growth_leads AS g (
      workspace_id, denue_id, business_name, legal_name, giro, catalog_template_key, activity, staff_range,
      municipio, colonia, address, postal_code, lat, lng, phone_e164, email, website, source, source_detail
    ) VALUES (
      p_workspace_id,
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
    ON CONFLICT (workspace_id, denue_id) DO UPDATE SET
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

-- ── 7. Outcomes: access, claim and per-workspace suppressions ────────────────
DROP FUNCTION IF EXISTS public.growth_record_outcome(uuid, text, text, jsonb, date, uuid);
CREATE OR REPLACE FUNCTION public.growth_record_outcome(
  p_lead_id uuid,
  p_outcome text,
  p_actor text DEFAULT 'operator',
  p_payload jsonb DEFAULT '{}'::jsonb,
  p_revisit_at date DEFAULT NULL,
  p_template_id uuid DEFAULT NULL,
  p_actor_id uuid DEFAULT NULL
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
  v_lead := public.growth_lock_for_actor(p_lead_id, p_actor_id);

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
      INSERT INTO public.growth_suppressions (workspace_id, phone_e164, reason, lead_id)
      VALUES (v_lead.workspace_id, v_lead.phone_e164, 'equivocado', v_lead.id)
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
      INSERT INTO public.growth_suppressions (workspace_id, email, reason, lead_id)
      VALUES (v_lead.workspace_id, v_lead.email, 'rebote', v_lead.id)
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
        INSERT INTO public.growth_suppressions (workspace_id, phone_e164, reason, lead_id)
        VALUES (v_lead.workspace_id, v_lead.phone_e164, CASE WHEN p_outcome = 'unsubscribed' THEN 'opt_out' ELSE 'rechazo' END, v_lead.id)
        ON CONFLICT DO NOTHING;
      END IF;
      IF v_lead.email IS NOT NULL THEN
        INSERT INTO public.growth_suppressions (workspace_id, email, reason, lead_id)
        VALUES (v_lead.workspace_id, v_lead.email, CASE WHEN p_outcome = 'unsubscribed' THEN 'opt_out' ELSE 'rechazo' END, v_lead.id)
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

  INSERT INTO public.growth_lead_events (lead_id, type, channel, actor, actor_user_id, template_id, payload)
  VALUES (v_lead.id, p_outcome, v_channel, coalesce(p_actor, 'operator'), p_actor_id, p_template_id, coalesce(p_payload, '{}'::jsonb));

  RETURN v_lead;
END;
$$;

-- ── 8. Batches only hand out what the member may work ────────────────────────
DROP FUNCTION IF EXISTS public.growth_reserve_batch(text, text, text, integer, integer);
CREATE OR REPLACE FUNCTION public.growth_reserve_batch(
  p_kind text,
  p_municipio text DEFAULT NULL,
  p_giro text DEFAULT NULL,
  p_limit integer DEFAULT 10,
  p_minutes integer DEFAULT 180,
  p_workspace_id uuid DEFAULT '00000000-0000-4000-8000-000000000001',
  p_actor_id uuid DEFAULT NULL
)
RETURNS SETOF public.growth_leads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text := public.growth_member_role(p_workspace_id, p_actor_id);
  v_zones jsonb;
BEGIN
  IF p_kind NOT IN ('whatsapp', 'seguimiento') THEN
    RAISE EXCEPTION 'UNKNOWN_BATCH_KIND';
  END IF;
  IF p_actor_id IS NOT NULL AND v_role IS NULL THEN
    RAISE EXCEPTION 'NOT_A_MEMBER';
  END IF;
  SELECT m.zones INTO v_zones FROM public.growth_members m WHERE m.workspace_id = p_workspace_id AND m.user_id = p_actor_id;

  RETURN QUERY
  WITH picked AS (
    SELECT g.id
    FROM public.growth_leads g
    WHERE g.workspace_id = p_workspace_id
      AND g.next_channel = 'whatsapp'
      AND (g.reserved_until IS NULL OR g.reserved_until < now())
      AND (g.snoozed_until IS NULL OR g.snoozed_until < now())
      AND (p_municipio IS NULL OR g.municipio = p_municipio)
      AND (p_giro IS NULL OR g.giro = p_giro)
      AND (p_actor_id IS NULL OR g.owner_user_id = p_actor_id
           OR (g.owner_user_id IS NULL AND (v_role = 'coordinador' OR public.growth_in_zones(g.municipio, g.colonia, v_zones))))
      AND NOT public.growth_is_suppressed(g.phone_e164, NULL, p_workspace_id)
      AND (
        (p_kind = 'whatsapp' AND g.phone_status = 'desconocido' AND g.stage IN ('nuevo', 'sin_contacto'))
        OR (p_kind = 'seguimiento' AND g.phone_status = 'enviado' AND g.whatsapp_attempts = 1
            AND g.stage IN ('contactado', 'caliente') AND g.last_whatsapp_at < now() - interval '3 days')
      )
    ORDER BY (g.owner_user_id IS NULL), g.colonia NULLS LAST, g.created_at, g.id
    LIMIT greatest(1, least(p_limit, 25))
    FOR UPDATE SKIP LOCKED
  ),
  reserved AS (
    UPDATE public.growth_leads g
    SET reserved_until = now() + make_interval(mins => greatest(5, p_minutes)),
        reserved_kind = p_kind,
        reserved_by = p_actor_id
    FROM picked
    WHERE g.id = picked.id
    RETURNING g.*
  )
  SELECT * FROM reserved;
END;
$$;

DROP FUNCTION IF EXISTS public.growth_sweep_remaining(text, text, text);
CREATE OR REPLACE FUNCTION public.growth_sweep_remaining(
  p_kind text,
  p_municipio text DEFAULT NULL,
  p_giro text DEFAULT NULL,
  p_workspace_id uuid DEFAULT '00000000-0000-4000-8000-000000000001',
  p_actor_id uuid DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text := public.growth_member_role(p_workspace_id, p_actor_id);
  v_zones jsonb;
  v_count integer;
BEGIN
  SELECT m.zones INTO v_zones FROM public.growth_members m WHERE m.workspace_id = p_workspace_id AND m.user_id = p_actor_id;
  SELECT count(*)::integer INTO v_count
  FROM public.growth_leads g
  WHERE g.workspace_id = p_workspace_id
    AND g.next_channel = 'whatsapp'
    -- Skipped cards and other kinds' batches are out; this sweep's own cards still count.
    AND (g.reserved_until IS NULL OR g.reserved_until < now() OR g.reserved_kind = p_kind)
    AND (g.snoozed_until IS NULL OR g.snoozed_until < now())
    AND (p_municipio IS NULL OR g.municipio = p_municipio)
    AND (p_giro IS NULL OR g.giro = p_giro)
    AND (p_actor_id IS NULL OR g.owner_user_id = p_actor_id
         OR (g.owner_user_id IS NULL AND (v_role = 'coordinador' OR public.growth_in_zones(g.municipio, g.colonia, v_zones))))
    AND (
      (p_kind = 'whatsapp' AND g.phone_status = 'desconocido' AND g.stage IN ('nuevo', 'sin_contacto'))
      OR (p_kind = 'seguimiento' AND g.phone_status = 'enviado' AND g.whatsapp_attempts = 1
          AND g.stage IN ('contactado', 'caliente') AND g.last_whatsapp_at < now() - interval '3 days')
    );
  RETURN v_count;
END;
$$;

DROP FUNCTION IF EXISTS public.growth_nearby_leads(double precision, double precision, integer);
CREATE OR REPLACE FUNCTION public.growth_nearby_leads(
  p_lat double precision,
  p_lng double precision,
  p_limit integer DEFAULT 10,
  p_workspace_id uuid DEFAULT '00000000-0000-4000-8000-000000000001',
  p_actor_id uuid DEFAULT NULL
)
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
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text := public.growth_member_role(p_workspace_id, p_actor_id);
  v_zones jsonb;
BEGIN
  SELECT m.zones INTO v_zones FROM public.growth_members m WHERE m.workspace_id = p_workspace_id AND m.user_id = p_actor_id;
  RETURN QUERY
  SELECT g.id, g.business_name, g.giro, g.colonia, g.address, g.municipio, g.lat, g.lng, g.phone_e164,
         g.visit_status, g.revisit_at,
         round(6371000 * 2 * asin(sqrt(
           power(sin(radians(g.lat - p_lat) / 2), 2)
           + cos(radians(p_lat)) * cos(radians(g.lat)) * power(sin(radians(g.lng - p_lng) / 2), 2)
         )))::integer AS distance_m
  FROM public.growth_leads g
  WHERE g.workspace_id = p_workspace_id
    AND g.lat BETWEEN p_lat - 0.02 AND p_lat + 0.02
    AND g.lng BETWEEN p_lng - 0.02 AND p_lng + 0.02
    AND g.stage NOT IN ('registrado', 'descartado')
    AND g.visit_status IN ('pendiente', 'no_estaba', 'interesado')
    AND g.visit_attempts < 3
    AND (g.revisit_at IS NULL OR g.revisit_at <= (now() AT TIME ZONE 'America/Mexico_City')::date)
    AND (p_actor_id IS NULL OR g.owner_user_id = p_actor_id
         OR (g.owner_user_id IS NULL AND (v_role = 'coordinador' OR public.growth_in_zones(g.municipio, g.colonia, v_zones))))
  ORDER BY (g.revisit_at IS NOT NULL) DESC, distance_m
  LIMIT greatest(1, least(p_limit, 25));
END;
$$;

-- ── 9. Follow-up and corrections check access too ───────────────────────────
DROP FUNCTION IF EXISTS public.growth_follow_up(uuid, text, timestamptz, text);
CREATE OR REPLACE FUNCTION public.growth_follow_up(
  p_lead_id uuid,
  p_action text,
  p_at timestamptz DEFAULT NULL,
  p_note text DEFAULT NULL,
  p_actor_id uuid DEFAULT NULL
)
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
  v_lead := public.growth_lock_for_actor(p_lead_id, p_actor_id);
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

  INSERT INTO public.growth_lead_events (lead_id, type, actor, actor_user_id, payload)
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
          p_actor_id,
          jsonb_strip_nulls(jsonb_build_object('at', p_at, 'note', v_note)));

  RETURN v_lead;
END;
$$;

DROP FUNCTION IF EXISTS public.growth_update_lead_phone(uuid, text);
CREATE OR REPLACE FUNCTION public.growth_update_lead_phone(p_lead_id uuid, p_phone text, p_actor_id uuid DEFAULT NULL)
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
  v_lead := public.growth_lock_for_actor(p_lead_id, p_actor_id);
  IF v_lead.phone_e164 IS NOT DISTINCT FROM p_phone THEN
    RETURN v_lead;
  END IF;
  IF EXISTS (SELECT 1 FROM public.growth_leads g WHERE g.workspace_id = v_lead.workspace_id AND g.phone_e164 = p_phone AND g.id <> p_lead_id) THEN
    RAISE EXCEPTION 'PHONE_TAKEN';
  END IF;
  IF public.growth_is_suppressed(p_phone, NULL, v_lead.workspace_id) THEN
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

  INSERT INTO public.growth_lead_events (lead_id, type, channel, actor, actor_user_id, payload)
  VALUES (p_lead_id, 'phone_corrected', 'whatsapp', 'operator', p_actor_id, jsonb_build_object('previous', v_previous));

  RETURN v_lead;
END;
$$;

CREATE OR REPLACE FUNCTION public.growth_update_lead_email(p_lead_id uuid, p_email text, p_actor_id uuid DEFAULT NULL)
RETURNS public.growth_leads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead public.growth_leads;
  v_email text := lower(nullif(btrim(coalesce(p_email, '')), ''));
  v_previous text;
BEGIN
  IF v_email IS NULL OR v_email !~ '^[^@\s]+@[^@\s]+\.[a-z]{2,}$' THEN
    RAISE EXCEPTION 'INVALID_EMAIL';
  END IF;
  v_lead := public.growth_lock_for_actor(p_lead_id, p_actor_id);
  IF lower(coalesce(v_lead.email, '')) = v_email THEN
    RETURN v_lead;
  END IF;
  IF EXISTS (SELECT 1 FROM public.growth_leads g WHERE g.workspace_id = v_lead.workspace_id AND lower(g.email) = v_email AND g.id <> p_lead_id) THEN
    RAISE EXCEPTION 'EMAIL_TAKEN';
  END IF;
  IF public.growth_is_suppressed(NULL, v_email, v_lead.workspace_id) THEN
    RAISE EXCEPTION 'EMAIL_SUPPRESSED';
  END IF;

  v_previous := v_lead.email;
  UPDATE public.growth_leads g
  SET email = v_email,
      email_status = 'desconocido',
      stage = CASE WHEN g.stage = 'sin_contacto' THEN 'nuevo' ELSE g.stage END,
      last_activity_at = now(),
      updated_at = now()
  WHERE g.id = p_lead_id;

  UPDATE public.growth_leads g
  SET next_channel = public.growth_next_channel(g)
  WHERE g.id = p_lead_id
  RETURNING * INTO v_lead;

  INSERT INTO public.growth_lead_events (lead_id, type, channel, actor, actor_user_id, payload)
  VALUES (p_lead_id, 'email_corrected', 'correo', 'operator', p_actor_id, jsonb_strip_nulls(jsonb_build_object('previous', v_previous)));

  RETURN v_lead;
END;
$$;

-- ── 10. Who already works a phone or an email (no other data leaks) ──────────
CREATE OR REPLACE FUNCTION public.growth_contact_owner(p_workspace_id uuid, p_phone text, p_email text)
RETURNS TABLE (lead_id uuid, owner_name text, stage text, since timestamptz, suppressed boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT g.id,
         coalesce(m.display_name, nullif(btrim(p.display_name), '')),
         g.stage,
         coalesce(g.owned_at, g.created_at),
         public.growth_is_suppressed(g.phone_e164, g.email, g.workspace_id)
  FROM public.growth_leads g
  LEFT JOIN public.growth_members m ON m.workspace_id = g.workspace_id AND m.user_id = g.owner_user_id
  LEFT JOIN public.profiles p ON p.id = g.owner_user_id
  WHERE g.workspace_id = p_workspace_id
    AND ((p_phone IS NOT NULL AND g.phone_e164 = p_phone) OR (p_email IS NOT NULL AND lower(g.email) = lower(p_email)))
  ORDER BY (g.phone_e164 = p_phone) DESC NULLS LAST
  LIMIT 1;
$$;

-- ── 11. A prospect added by hand belongs to whoever added it ─────────────────
CREATE OR REPLACE FUNCTION public.growth_add_lead(p_workspace_id uuid, p_actor_id uuid, p_row jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone text := nullif(btrim(coalesce(p_row->>'phone_e164', '')), '');
  v_email text := lower(nullif(btrim(coalesce(p_row->>'email', '')), ''));
  v_name text := btrim(coalesce(p_row->>'business_name', ''));
  v_owner record;
  v_lead public.growth_leads;
BEGIN
  IF public.growth_member_role(p_workspace_id, p_actor_id) IS NULL THEN
    RAISE EXCEPTION 'NOT_A_MEMBER';
  END IF;
  IF char_length(v_name) NOT BETWEEN 2 AND 160 THEN
    RAISE EXCEPTION 'INVALID_NAME';
  END IF;
  IF v_phone IS NULL AND v_email IS NULL THEN
    RAISE EXCEPTION 'CONTACT_REQUIRED';
  END IF;
  IF v_phone IS NOT NULL AND v_phone !~ '^\+52[0-9]{10}$' THEN
    RAISE EXCEPTION 'INVALID_PHONE';
  END IF;
  IF v_email IS NOT NULL AND v_email !~ '^[^@\s]+@[^@\s]+\.[a-z]{2,}$' THEN
    RAISE EXCEPTION 'INVALID_EMAIL';
  END IF;
  IF nullif(btrim(coalesce(p_row->>'giro', '')), '') IS NULL OR nullif(btrim(coalesce(p_row->>'municipio', '')), '') IS NULL THEN
    RAISE EXCEPTION 'GIRO_AND_MUNICIPIO_REQUIRED';
  END IF;

  -- Serializes two people saving the same contact at the same time.
  PERFORM pg_advisory_xact_lock(hashtext('growth_contact:' || p_workspace_id || ':' || coalesce(v_phone, '') || ':' || coalesce(v_email, '')));

  SELECT * INTO v_owner FROM public.growth_contact_owner(p_workspace_id, v_phone, v_email);
  IF FOUND THEN
    RETURN jsonb_build_object('status', 'conflict', 'lead_id', v_owner.lead_id, 'owner_name', v_owner.owner_name,
      'stage', v_owner.stage, 'since', v_owner.since, 'suppressed', v_owner.suppressed);
  END IF;
  IF public.growth_is_suppressed(v_phone, v_email, p_workspace_id) THEN
    RETURN jsonb_build_object('status', 'suppressed');
  END IF;

  INSERT INTO public.growth_leads (
    workspace_id, business_name, giro, catalog_template_key, municipio, colonia, address,
    lat, lng, phone_e164, email, source, source_detail, owner_user_id, owned_at, last_activity_at
  ) VALUES (
    p_workspace_id, v_name, btrim(p_row->>'giro'), nullif(btrim(coalesce(p_row->>'giro', '')), ''),
    btrim(p_row->>'municipio'), nullif(btrim(coalesce(p_row->>'colonia', '')), ''), nullif(btrim(coalesce(p_row->>'address', '')), ''),
    (nullif(p_row->>'lat', ''))::double precision, (nullif(p_row->>'lng', ''))::double precision,
    v_phone, v_email, 'manual', nullif(left(btrim(coalesce(p_row->>'source_detail', '')), 40), ''),
    p_actor_id, now(), now()
  ) RETURNING * INTO v_lead;

  UPDATE public.growth_leads g
  SET next_channel = public.growth_next_channel(g),
      stage = CASE WHEN public.growth_next_channel(g) = 'ninguno' THEN 'sin_contacto' ELSE g.stage END
  WHERE g.id = v_lead.id;

  INSERT INTO public.growth_lead_events (lead_id, type, actor, actor_user_id, payload)
  VALUES (v_lead.id, 'lead_added', 'operator', p_actor_id,
          jsonb_strip_nulls(jsonb_build_object('source_detail', p_row->>'source_detail', 'note', nullif(left(btrim(coalesce(p_row->>'note', '')), 280), ''))));

  RETURN jsonb_build_object('status', 'created', 'lead_id', v_lead.id);
END;
$$;

-- ── 12. Coordinators hand leads to a member (or release them) ────────────────
CREATE OR REPLACE FUNCTION public.growth_assign_leads(p_workspace_id uuid, p_actor_id uuid, p_lead_ids uuid[], p_owner_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF public.growth_member_role(p_workspace_id, p_actor_id) IS DISTINCT FROM 'coordinador' THEN
    RAISE EXCEPTION 'COORDINATOR_ONLY';
  END IF;
  IF p_owner_id IS NOT NULL AND public.growth_member_role(p_workspace_id, p_owner_id) IS NULL THEN
    RAISE EXCEPTION 'NOT_A_MEMBER';
  END IF;

  WITH moved AS (
    UPDATE public.growth_leads g
    SET owner_user_id = p_owner_id,
        owned_at = CASE WHEN p_owner_id IS NULL THEN NULL ELSE now() END,
        reserved_until = NULL,
        reserved_kind = NULL,
        updated_at = now()
    WHERE g.workspace_id = p_workspace_id
      AND g.id = ANY (coalesce(p_lead_ids, ARRAY[]::uuid[]))
      AND g.owner_user_id IS DISTINCT FROM p_owner_id
    RETURNING g.id, g.owner_user_id
  ),
  logged AS (
    INSERT INTO public.growth_lead_events (lead_id, type, actor, actor_user_id, payload)
    SELECT moved.id, 'assigned', 'operator', p_actor_id, jsonb_strip_nulls(jsonb_build_object('owner_user_id', p_owner_id))
    FROM moved
    RETURNING 1
  )
  SELECT count(*)::integer INTO v_count FROM logged;
  RETURN v_count;
END;
$$;

-- ── 13. Counts per workspace and, optionally, per owner ──────────────────────
DROP FUNCTION IF EXISTS public.growth_pipeline_counts(text, text);
CREATE OR REPLACE FUNCTION public.growth_pipeline_counts(
  p_municipio text DEFAULT NULL,
  p_giro text DEFAULT NULL,
  p_workspace_id uuid DEFAULT '00000000-0000-4000-8000-000000000001',
  p_owner_id uuid DEFAULT NULL
)
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
  WHERE g.workspace_id = p_workspace_id
    AND (p_owner_id IS NULL OR g.owner_user_id = p_owner_id)
    AND (p_municipio IS NULL OR g.municipio = p_municipio)
    AND (p_giro IS NULL OR g.giro = p_giro);
$$;

-- ── 14. Templates and email per workspace ────────────────────────────────────
DROP FUNCTION IF EXISTS public.growth_save_template_version(text, text, text, text, text, text, uuid);
CREATE OR REPLACE FUNCTION public.growth_save_template_version(
  p_channel text,
  p_giro text,
  p_step text,
  p_variant text,
  p_subject text,
  p_body text,
  p_created_by uuid,
  p_workspace_id uuid DEFAULT '00000000-0000-4000-8000-000000000001'
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
  PERFORM pg_advisory_xact_lock(hashtext('growth_template:' || p_workspace_id || ':' || p_channel || ':' || coalesce(p_giro, '') || ':' || p_step || ':' || p_variant));

  SELECT coalesce(max(t.version), 0) + 1 INTO v_next
  FROM public.growth_templates t
  WHERE t.workspace_id = p_workspace_id AND t.channel = p_channel AND coalesce(t.giro, '') = coalesce(p_giro, '')
    AND t.step = p_step AND t.variant = p_variant;

  UPDATE public.growth_templates t SET status = 'archived'
  WHERE t.workspace_id = p_workspace_id AND t.channel = p_channel AND coalesce(t.giro, '') = coalesce(p_giro, '')
    AND t.step = p_step AND t.variant = p_variant AND t.status <> 'archived';

  INSERT INTO public.growth_templates (workspace_id, channel, giro, step, variant, version, subject, body, status, created_by)
  VALUES (p_workspace_id, p_channel, nullif(p_giro, ''), p_step, p_variant, v_next, nullif(p_subject, ''), p_body, 'active', p_created_by)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

DROP FUNCTION IF EXISTS public.growth_enroll_email_leads(integer);
CREATE OR REPLACE FUNCTION public.growth_enroll_email_leads(
  p_limit integer,
  p_workspace_id uuid DEFAULT '00000000-0000-4000-8000-000000000001'
)
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
  SELECT email_variant_weights INTO v_weights FROM public.growth_settings WHERE workspace_id = p_workspace_id;
  v_a := greatest(coalesce((v_weights->>'A')::numeric, 0), 0);
  v_b := greatest(coalesce((v_weights->>'B')::numeric, 0), 0);
  v_total := greatest(v_a + v_b + greatest(coalesce((v_weights->>'C')::numeric, 0), 0), 1);

  WITH picked AS (
    SELECT g.id, random() * v_total AS roll
    FROM public.growth_leads g
    WHERE g.workspace_id = p_workspace_id
      AND g.next_channel = 'correo'
      AND g.email IS NOT NULL
      AND g.email_status = 'desconocido'
      AND g.stage NOT IN ('registrado', 'descartado', 'conversando', 'cita')
      AND (g.snoozed_until IS NULL OR g.snoozed_until < now())
      AND NOT EXISTS (SELECT 1 FROM public.growth_enrollments e WHERE e.lead_id = g.id)
      AND NOT public.growth_is_suppressed(NULL, g.email, p_workspace_id)
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

-- ── 15. Funnel per workspace ─────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.growth_funnel(timestamptz, timestamptz);
CREATE OR REPLACE FUNCTION public.growth_funnel(
  p_from timestamptz,
  p_to timestamptz,
  p_workspace_id uuid DEFAULT '00000000-0000-4000-8000-000000000001'
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ev AS (
    SELECT e.* FROM public.growth_lead_events e
    JOIN public.growth_leads g ON g.id = e.lead_id
    WHERE g.workspace_id = p_workspace_id AND e.created_at >= p_from AND e.created_at < p_to
  ),
  acq AS (
    SELECT a.* FROM public.tenant_acquisitions a
    WHERE a.captured_at >= p_from AND a.captured_at < p_to
      AND (a.lead_id IS NULL OR EXISTS (SELECT 1 FROM public.growth_leads g WHERE g.id = a.lead_id AND g.workspace_id = p_workspace_id))
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

-- ── 16. Attribution stays on Tlaco's workspace and credits the lead's owner ──
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
  v_platform uuid := (SELECT w.id FROM public.growth_workspaces w WHERE w.tenant_id IS NULL ORDER BY w.created_at LIMIT 1);
  v_lead_id uuid;
  v_owner uuid;
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
    JOIN public.growth_leads g ON g.id = l.lead_id
    WHERE l.token_hash = p_token_hash AND l.purpose = 'para' AND g.workspace_id = v_platform;
    IF v_lead_id IS NOT NULL THEN
      v_bucket := 'engine';
    END IF;
  END IF;

  IF v_lead_id IS NULL THEN
    SELECT g.id INTO v_lead_id
    FROM public.growth_leads g
    WHERE g.workspace_id = v_platform
      AND g.stage NOT IN ('nuevo', 'sin_contacto', 'registrado')
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

  SELECT g.owner_user_id INTO v_owner FROM public.growth_leads g WHERE g.id = v_lead_id;

  INSERT INTO public.tenant_acquisitions (tenant_id, bucket, lead_id, channel, heard_from, utm, acquired_by)
  VALUES (p_tenant_id, v_bucket, v_lead_id, v_channel, nullif(p_heard_from, ''), coalesce(p_utm, '{}'::jsonb), v_owner)
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

-- ── 17. Copy names whoever sends it: «Mi nombre es Saúl» → {nombre} ──────────
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT t.workspace_id, t.channel, t.giro, t.step, t.variant, t.subject, t.body, t.created_by
    FROM public.growth_templates t
    WHERE t.status <> 'archived' AND (t.body LIKE '%Mi nombre es Saúl%' OR t.body LIKE '%Soy Saúl%')
  LOOP
    PERFORM public.growth_save_template_version(r.channel, r.giro, r.step, r.variant, r.subject,
      replace(replace(r.body, 'Mi nombre es Saúl', 'Mi nombre es {nombre}'), 'Soy Saúl', 'Soy {nombre}'), r.created_by, r.workspace_id);
  END LOOP;
END;
$$;

-- ── 18. Grants: server-only, like every growth function ─────────────────────
DO $$
DECLARE
  v_fn text;
BEGIN
  FOREACH v_fn IN ARRAY ARRAY[
    'public.growth_member_role(uuid, uuid)',
    'public.growth_in_zones(text, text, jsonb)',
    'public.growth_can_act(public.growth_leads, uuid)',
    'public.growth_can_act_on(uuid, uuid)',
    'public.growth_lock_for_actor(uuid, uuid)',
    'public.growth_is_suppressed(text, text, uuid)',
    'public.growth_next_channel(public.growth_leads)',
    'public.growth_upsert_leads(jsonb, uuid)',
    'public.growth_record_outcome(uuid, text, text, jsonb, date, uuid, uuid)',
    'public.growth_reserve_batch(text, text, text, integer, integer, uuid, uuid)',
    'public.growth_sweep_remaining(text, text, text, uuid, uuid)',
    'public.growth_nearby_leads(double precision, double precision, integer, uuid, uuid)',
    'public.growth_follow_up(uuid, text, timestamptz, text, uuid)',
    'public.growth_update_lead_phone(uuid, text, uuid)',
    'public.growth_update_lead_email(uuid, text, uuid)',
    'public.growth_contact_owner(uuid, text, text)',
    'public.growth_add_lead(uuid, uuid, jsonb)',
    'public.growth_assign_leads(uuid, uuid, uuid[], uuid)',
    'public.growth_pipeline_counts(text, text, uuid, uuid)',
    'public.growth_save_template_version(text, text, text, text, text, text, uuid, uuid)',
    'public.growth_enroll_email_leads(integer, uuid)',
    'public.growth_funnel(timestamptz, timestamptz, uuid)',
    'public.growth_link_registration(uuid, text, text, text, text, jsonb)'
  ]
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', v_fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', v_fn);
  END LOOP;
END $$;
