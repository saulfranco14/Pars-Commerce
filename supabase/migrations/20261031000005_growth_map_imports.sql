-- =============================================================================
-- GROWTH: map, imports from the DENUE API and results by giro and by person.
--   * growth_map_points: prospects inside a map box that the member may see,
--     worked ones first, with the total in the box
--   * growth_imports: one row per import job, with a cursor per municipio and
--     SCIAN class so a long import continues across requests and cron ticks
--   * growth_funnel gains by_giro and by_member
-- Growth objects only. Reverted by supabase/snippets/growth_map_imports_rollback.sql.
-- =============================================================================

-- ── 1. Map points ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.growth_map_points(
  p_workspace_id uuid,
  p_actor_id uuid,
  p_min_lat double precision,
  p_min_lng double precision,
  p_max_lat double precision,
  p_max_lng double precision,
  p_giro text DEFAULT NULL,
  p_owner text DEFAULT NULL,
  p_limit integer DEFAULT 2000
)
RETURNS TABLE (
  id uuid,
  business_name text,
  giro text,
  municipio text,
  colonia text,
  lat double precision,
  lng double precision,
  stage text,
  owner_user_id uuid,
  has_phone boolean,
  total bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text := public.growth_member_role(p_workspace_id, p_actor_id);
  v_zones jsonb;
  v_owner uuid := CASE WHEN p_owner ~ '^[0-9a-f-]{36}$' THEN p_owner::uuid END;
BEGIN
  IF v_role IS NULL THEN
    RAISE EXCEPTION 'NOT_A_MEMBER';
  END IF;
  SELECT m.zones INTO v_zones FROM public.growth_members m WHERE m.workspace_id = p_workspace_id AND m.user_id = p_actor_id;

  RETURN QUERY
  SELECT g.id, g.business_name, g.giro, g.municipio, g.colonia, g.lat, g.lng, g.stage, g.owner_user_id,
         g.phone_e164 IS NOT NULL, count(*) OVER ()
  FROM public.growth_leads g
  WHERE g.workspace_id = p_workspace_id
    AND g.lat BETWEEN p_min_lat AND p_max_lat
    AND g.lng BETWEEN p_min_lng AND p_max_lng
    AND (p_giro IS NULL OR g.giro = p_giro)
    AND (v_role = 'coordinador' OR g.owner_user_id = p_actor_id
         OR (g.owner_user_id IS NULL AND public.growth_in_zones(g.municipio, g.colonia, v_zones)))
    AND (p_owner IS NULL OR p_owner = 'all'
         OR (p_owner = 'me' AND g.owner_user_id = p_actor_id)
         OR (p_owner = 'none' AND g.owner_user_id IS NULL)
         OR (v_owner IS NOT NULL AND g.owner_user_id = v_owner))
  -- Worked prospects first, then a stable sample of the rest.
  ORDER BY (g.stage NOT IN ('nuevo', 'sin_contacto')) DESC, hashtext(g.id::text)
  LIMIT greatest(1, least(p_limit, 3000));
END;
$$;

REVOKE ALL ON FUNCTION public.growth_map_points(uuid, uuid, double precision, double precision, double precision, double precision, text, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.growth_map_points(uuid, uuid, double precision, double precision, double precision, double precision, text, text, integer) TO service_role;

-- ── 2. Import jobs ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.growth_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.growth_workspaces(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'denue' CHECK (source IN ('denue', 'csv')),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'done', 'failed')),
  municipios text[] NOT NULL DEFAULT ARRAY[]::text[],
  giros text[] NOT NULL DEFAULT ARRAY[]::text[],
  only_with_contact boolean NOT NULL DEFAULT true,
  assign_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  -- [{"area": "15031", "clase": "467111", "giro": "materiales", "municipio": "Chimalhuacán", "next": 1, "done": false}]
  cursors jsonb NOT NULL DEFAULT '[]'::jsonb,
  found integer NOT NULL DEFAULT 0,
  imported integer NOT NULL DEFAULT 0,
  updated integer NOT NULL DEFAULT 0,
  skipped integer NOT NULL DEFAULT 0,
  error text,
  locked_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

CREATE INDEX IF NOT EXISTS growth_imports_workspace_idx ON public.growth_imports (workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS growth_imports_pending_idx ON public.growth_imports (status) WHERE status IN ('queued', 'running');

ALTER TABLE public.growth_imports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "growth: service role" ON public.growth_imports;
CREATE POLICY "growth: service role" ON public.growth_imports FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- One worker per job at a time: the request that starts it and the cron tick never overlap.
CREATE OR REPLACE FUNCTION public.growth_claim_import(p_import_id uuid, p_seconds integer DEFAULT 60)
RETURNS public.growth_imports
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.growth_imports;
BEGIN
  UPDATE public.growth_imports i
  SET locked_until = now() + make_interval(secs => greatest(10, p_seconds)), status = 'running'
  WHERE i.id = p_import_id AND i.status IN ('queued', 'running') AND (i.locked_until IS NULL OR i.locked_until < now())
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.growth_claim_import(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.growth_claim_import(uuid, integer) TO service_role;

-- ── 3. Funnel by giro and by person ─────────────────────────────────────────
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
    'by_giro', coalesce((
      SELECT jsonb_agg(jsonb_build_object('giro', giro, 'contacted', contacted, 'replied', replied, 'viewed', viewed, 'registered', registered) ORDER BY contacted DESC)
      FROM (
        SELECT g.giro,
               count(DISTINCT ev.lead_id) FILTER (WHERE ev.type IN ('whatsapp_sent', 'email_sent', 'visit_registered', 'visit_interested', 'visit_absent')) AS contacted,
               count(DISTINCT ev.lead_id) FILTER (WHERE ev.type IN ('whatsapp_replied', 'email_replied', 'visit_interested', 'visit_registered')) AS replied,
               count(DISTINCT ev.lead_id) FILTER (WHERE ev.type = 'para_viewed') AS viewed,
               count(DISTINCT ev.lead_id) FILTER (WHERE ev.type = 'registered') AS registered
        FROM ev JOIN public.growth_leads g ON g.id = ev.lead_id
        GROUP BY g.giro
      ) x
      WHERE contacted > 0
    ), '[]'::jsonb),
    'by_member', coalesce((
      SELECT jsonb_agg(jsonb_build_object('user_id', member, 'contacted', contacted, 'replied', replied, 'registered', registered) ORDER BY contacted DESC)
      FROM (
        SELECT m.member,
               (SELECT count(DISTINCT ev.lead_id) FROM ev WHERE ev.actor_user_id = m.member AND ev.type IN ('whatsapp_sent', 'visit_registered', 'visit_interested', 'visit_absent')) AS contacted,
               (SELECT count(DISTINCT ev.lead_id) FROM ev JOIN public.growth_leads g ON g.id = ev.lead_id
                 WHERE g.owner_user_id = m.member AND ev.type IN ('whatsapp_replied', 'email_replied', 'visit_interested', 'visit_registered')) AS replied,
               (SELECT count(*) FROM acq WHERE acq.acquired_by = m.member) AS registered
        FROM (SELECT DISTINCT ev.actor_user_id AS member FROM ev WHERE ev.actor_user_id IS NOT NULL
              UNION SELECT DISTINCT acq.acquired_by FROM acq WHERE acq.acquired_by IS NOT NULL) m
      ) x
    ), '[]'::jsonb),
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
