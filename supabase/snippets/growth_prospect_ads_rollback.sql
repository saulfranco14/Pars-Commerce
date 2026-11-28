-- Reverts 20261128000002_growth_prospect_ads.sql. Growth objects only.
-- Deploy the code without the ads page first: it reads ad_edits and calls the new functions.
-- Background images stay in the growth-ads bucket; empty it from Storage if you want them gone.
BEGIN;

-- The copy goes back to the newest version each step and variant had before the ads route.
DO $$
DECLARE
  r record;
BEGIN
  UPDATE public.growth_templates t SET status = 'archived'
  WHERE t.workspace_id = '00000000-0000-4000-8000-000000000001' AND t.channel = 'whatsapp' AND t.status <> 'archived'
    AND t.step IN ('m1', 'si', 'seguimiento', 'ultimo')
    AND (t.body LIKE '%{saludo_negocio}%' OR t.body LIKE '%{zona}%' OR t.body LIKE '%{promo}%'
         OR t.body = '¡Gracias! Ya se los dejé con su precio. Aquí los descarga y hace más, son suyos: {link}');
  FOR r IN
    SELECT DISTINCT ON (coalesce(t.giro, ''), t.step, t.variant) t.id
    FROM public.growth_templates t
    WHERE t.workspace_id = '00000000-0000-4000-8000-000000000001' AND t.channel = 'whatsapp'
      AND t.step IN ('m1', 'si', 'seguimiento', 'ultimo')
      AND t.body NOT LIKE '%{saludo_negocio}%' AND t.body NOT LIKE '%{zona}%' AND t.body NOT LIKE '%{promo}%'
      AND t.body <> '¡Gracias! Ya se los dejé con su precio. Aquí los descarga y hace más, son suyos: {link}'
    ORDER BY coalesce(t.giro, ''), t.step, t.variant, t.version DESC
  LOOP
    UPDATE public.growth_templates SET status = 'active' WHERE id = r.id;
  END LOOP;
END;
$$;

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

  INSERT INTO public.growth_lead_events (lead_id, type, channel, actor, template_id, payload)
  VALUES (v_lead.id, p_event, v_link.channel, 'prospect', v_link.template_id,
          jsonb_strip_nulls(coalesce(p_payload, '{}'::jsonb) || jsonb_build_object('seconds', p_seconds, 'view_count', v_link.view_count)));

  RETURN QUERY SELECT v_lead.id, v_lead.business_name, v_lead.municipio, v_link.view_count, v_hot;
END;
$$;

DROP TABLE IF EXISTS public.growth_bot_inbox;
DROP FUNCTION IF EXISTS public.growth_remove_prospect_data(text);
DROP FUNCTION IF EXISTS public.growth_zone_points(double precision, double precision, text, uuid, uuid);
DROP FUNCTION IF EXISTS public.growth_zone_counts(double precision, double precision, text, uuid, uuid);
DROP TABLE IF EXISTS public.growth_ad_backgrounds;
ALTER TABLE public.growth_leads DROP CONSTRAINT IF EXISTS growth_leads_ad_edits_object;
ALTER TABLE public.growth_leads DROP COLUMN IF EXISTS ad_seed;
ALTER TABLE public.growth_leads DROP COLUMN IF EXISTS ad_edits;

COMMIT;
