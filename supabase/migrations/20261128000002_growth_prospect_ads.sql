-- Prospect ads: four gift ads per prospect instead of a sample store.
--   * growth_leads.ad_edits / ad_seed: what the owner changed in «Para ti» and which backgrounds they get.
--   * growth_ad_backgrounds + bucket growth-ads: AI backgrounds per giro, used only once approved.
--   * growth_zone_counts / growth_zone_points: same-giro businesses around a point, counts and dots only.
--   * growth_track_link: new «Para ti» events (edit, download, share, zone, signup).
--   * growth_remove_prospect_data: «¿No es suyo? Quitar mis datos».
--   * growth_bot_inbox: replies forwarded to the bot until the operator says whose they are.
--   * WhatsApp copy: first message A (no link) / B (link), reply, follow-up and last message.
-- Reverse: supabase/snippets/growth_prospect_ads_rollback.sql

-- ── 1. Edits and background choice per prospect ─────────────────────────────
ALTER TABLE public.growth_leads
  ADD COLUMN IF NOT EXISTS ad_edits jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ad_seed integer NOT NULL DEFAULT 0;

ALTER TABLE public.growth_leads DROP CONSTRAINT IF EXISTS growth_leads_ad_edits_object;
ALTER TABLE public.growth_leads ADD CONSTRAINT growth_leads_ad_edits_object CHECK (jsonb_typeof(ad_edits) = 'object');

-- ── 2. AI background library ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.growth_ad_backgrounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  giro text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('giro', 'producto')),
  storage_path text NOT NULL UNIQUE,
  prompt text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS growth_ad_backgrounds_pick_idx ON public.growth_ad_backgrounds (giro, kind, status, created_at);
ALTER TABLE public.growth_ad_backgrounds ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.growth_ad_backgrounds FROM anon, authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('growth-ads', 'growth-ads', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ── 3. Same-giro businesses around a point ──────────────────────────────────
-- Straight-line distance over the DENUE base of the workspace; the box keeps it on the (lat, lng) index.
CREATE OR REPLACE FUNCTION public.growth_zone_counts(
  p_lat double precision,
  p_lng double precision,
  p_giro text,
  p_exclude uuid DEFAULT NULL,
  p_workspace_id uuid DEFAULT '00000000-0000-4000-8000-000000000001'
)
RETURNS TABLE (within_500 integer, within_1000 integer, nearest_m integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH near AS (
    SELECT 6371000 * 2 * asin(sqrt(
             power(sin(radians(g.lat - p_lat) / 2), 2)
             + cos(radians(p_lat)) * cos(radians(g.lat)) * power(sin(radians(g.lng - p_lng) / 2), 2)
           )) AS d
    FROM public.growth_leads g
    WHERE g.workspace_id = p_workspace_id
      AND g.giro = p_giro
      AND g.lat BETWEEN p_lat - 0.0095 AND p_lat + 0.0095
      AND g.lng BETWEEN p_lng - 0.0100 AND p_lng + 0.0100
      AND (p_exclude IS NULL OR g.id <> p_exclude)
  )
  SELECT count(*) FILTER (WHERE d <= 500)::integer,
         count(*) FILTER (WHERE d <= 1000)::integer,
         round(min(d))::integer
  FROM near
  WHERE d <= 1000;
$$;

-- Dots for the map: rounded position only, never the name or the phone.
CREATE OR REPLACE FUNCTION public.growth_zone_points(
  p_lat double precision,
  p_lng double precision,
  p_giro text,
  p_exclude uuid DEFAULT NULL,
  p_workspace_id uuid DEFAULT '00000000-0000-4000-8000-000000000001'
)
RETURNS TABLE (lat double precision, lng double precision, distance_m integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT round(g.lat::numeric, 4)::double precision,
         round(g.lng::numeric, 4)::double precision,
         round(6371000 * 2 * asin(sqrt(
           power(sin(radians(g.lat - p_lat) / 2), 2)
           + cos(radians(p_lat)) * cos(radians(g.lat)) * power(sin(radians(g.lng - p_lng) / 2), 2)
         )))::integer AS distance_m
  FROM public.growth_leads g
  WHERE g.workspace_id = p_workspace_id
    AND g.giro = p_giro
    AND g.lat BETWEEN p_lat - 0.0095 AND p_lat + 0.0095
    AND g.lng BETWEEN p_lng - 0.0100 AND p_lng + 0.0100
    AND (p_exclude IS NULL OR g.id <> p_exclude)
  ORDER BY distance_m
  LIMIT 300;
$$;

-- ── 4. «Para ti» events of the ads page ─────────────────────────────────────
-- Same signature and payload handling as 20261030000002; adds the ads events, which also warm the lead.
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
  IF p_event NOT IN ('para_viewed', 'para_seconds', 'para_left', 'claim_clicked', 'help_clicked', 'objection_chosen', 'visit_requested',
                     'ad_edited', 'ads_downloaded', 'ads_shared', 'zone_opened', 'signup_started') THEN
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
  IF p_event IN ('para_viewed', 'claim_clicked', 'visit_requested', 'ad_edited', 'ads_downloaded', 'ads_shared', 'signup_started')
     AND v_lead.stage IN ('nuevo', 'contactado') THEN
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

-- ── 5. «¿No es suyo? Quitar mis datos» ──────────────────────────────────────
-- A removal is a baja in every channel (growth_record_outcome), the page stops working and the edits are erased.
CREATE OR REPLACE FUNCTION public.growth_remove_prospect_data(p_token_hash text)
RETURNS TABLE (lead_id uuid, business_name text, municipio text, workspace_id uuid, owner_user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link public.growth_lead_links;
  v_lead public.growth_leads;
BEGIN
  SELECT * INTO v_link FROM public.growth_lead_links l
  WHERE l.token_hash = p_token_hash AND l.purpose = 'para' AND l.revoked_at IS NULL
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT * INTO v_lead FROM public.growth_leads g WHERE g.id = v_link.lead_id;
  IF v_lead.stage <> 'registrado' THEN
    PERFORM public.growth_record_outcome(v_lead.id, 'unsubscribed', 'prospect', jsonb_build_object('reason', 'quitar_datos'), NULL, NULL, NULL);
  END IF;
  UPDATE public.growth_leads g SET ad_edits = '{}'::jsonb, updated_at = now() WHERE g.id = v_lead.id;
  UPDATE public.growth_lead_links l SET revoked_at = now() WHERE l.lead_id = v_lead.id AND l.revoked_at IS NULL;

  RETURN QUERY SELECT v_lead.id, v_lead.business_name, v_lead.municipio, v_lead.workspace_id, v_lead.owner_user_id;
END;
$$;

-- ── 6. Replies forwarded to the bot ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.growth_bot_inbox (
  id bigserial PRIMARY KEY,
  chat_id bigint NOT NULL,
  workspace_id uuid NOT NULL REFERENCES public.growth_workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text text NOT NULL CHECK (char_length(text) BETWEEN 1 AND 2000),
  lead_id uuid REFERENCES public.growth_leads(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS growth_bot_inbox_chat_idx ON public.growth_bot_inbox (chat_id, created_at DESC);
ALTER TABLE public.growth_bot_inbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.growth_bot_inbox FROM anon, authenticated;

REVOKE ALL ON FUNCTION public.growth_zone_counts(double precision, double precision, text, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.growth_zone_points(double precision, double precision, text, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.growth_remove_prospect_data(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.growth_zone_counts(double precision, double precision, text, uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.growth_zone_points(double precision, double precision, text, uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.growth_remove_prospect_data(text) TO service_role;

-- ── 7. WhatsApp copy for the ads route (Tlaco workspace) ────────────────────
-- Giro-specific versions would win over these, so they are archived; old first-message variants too.
UPDATE public.growth_templates t SET status = 'archived'
WHERE t.workspace_id = '00000000-0000-4000-8000-000000000001'
  AND t.channel = 'whatsapp'
  AND t.status <> 'archived'
  AND ((t.step IN ('m1', 'si', 'seguimiento', 'ultimo') AND t.giro IS NOT NULL)
       OR (t.step = 'm1' AND t.variant NOT IN ('A', 'B'))
       OR (t.step IN ('si', 'seguimiento', 'ultimo') AND t.variant <> 'A'));

SELECT public.growth_save_template_version('whatsapp', NULL, 'm1', 'A', NULL,
$copy${saludo_negocio} Soy {nombre}, de Tlaco. Apoyamos a los negocios pequeños a digitalizarse y le hice sin costo estos anuncios para su Estado: así se vería una promoción y un producto suyo. No usé fotos de su local.

{pregunta_precio} Se lo dejo con su precio.

Si no le sirven, me dice y no le vuelvo a escribir.$copy$, NULL);

SELECT public.growth_save_template_version('whatsapp', NULL, 'm1', 'B', NULL,
$copy${saludo_negocio} Soy {nombre}, de Tlaco. Apoyamos a los negocios pequeños a digitalizarse y le hice sin costo estos anuncios para su Estado: así se vería una promoción y un producto suyo. No usé fotos de su local.

Aquí les pone su precio y los descarga, sin registrarse: {link}

Si no le sirven, me dice y no le vuelvo a escribir.$copy$, NULL);

SELECT public.growth_save_template_version('whatsapp', NULL, 'si', 'A', NULL,
$copy$¡Gracias! Ya se los dejé con su precio. Aquí los descarga y hace más, son suyos: {link}$copy$, NULL);

SELECT public.growth_save_template_version('whatsapp', NULL, 'seguimiento', 'A', NULL,
$copy${saludo}. Le saqué un dato de su zona: {zona}. Se lo dejé junto con sus anuncios y dos ideas para que lo elijan a usted, es gratis: {link}

Si no le interesa, me dice y no le vuelvo a escribir.$copy$, NULL);

SELECT public.growth_save_template_version('whatsapp', NULL, 'ultimo', 'A', NULL,
$copy${saludo}. Para la quincena le dejé lista esta promoción: {promo}. Si le sirve, se la pongo con su precio: {link}

Ando por {colonia} esta semana. Si gusta, paso y le dejo sus anuncios y su tienda funcionando en 15 minutos.$copy$, NULL);
