-- =============================================================================
-- GROWTH: compare the «Para ti» designs. Each link's design comes from its token
-- hash (first 8 hex digits modulo 3, same as paraDesignFromHash in TypeScript),
-- so nothing new is stored. Only visits since the designs went live count.
-- Reverted by supabase/snippets/growth_para_design_stats_rollback.sql.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.growth_para_design_stats(
  p_workspace_id uuid,
  p_since timestamptz DEFAULT '2026-11-01 00:00:00-06'
)
RETURNS TABLE (design text, visitors integer, median_seconds integer, reached_store integer, claimed integer, registered integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH links AS (
    SELECT DISTINCT ON (l.lead_id)
      l.lead_id,
      (ARRAY['clasica', 'tienda', 'hazla'])[(('x' || substr(l.token_hash, 1, 8))::bit(32)::bigint % 3)::integer + 1] AS design
    FROM public.growth_lead_links l
    JOIN public.growth_leads g ON g.id = l.lead_id AND g.workspace_id = p_workspace_id
    WHERE l.purpose = 'para'
    ORDER BY l.lead_id, l.created_at DESC
  ),
  visited AS (
    SELECT
      k.design,
      k.lead_id,
      (SELECT max((e.payload->>'seconds')::numeric) FROM public.growth_lead_events e
        WHERE e.lead_id = k.lead_id AND e.type = 'para_left' AND e.created_at >= p_since) AS seconds,
      EXISTS (SELECT 1 FROM public.growth_lead_events e
        WHERE e.lead_id = k.lead_id AND e.type = 'para_left' AND e.created_at >= p_since AND e.payload->'sections' ? 'tienda') AS reached_store,
      EXISTS (SELECT 1 FROM public.growth_lead_events e
        WHERE e.lead_id = k.lead_id AND e.type = 'claim_clicked' AND e.created_at >= p_since) AS claimed,
      EXISTS (SELECT 1 FROM public.growth_leads g WHERE g.id = k.lead_id AND g.stage = 'registrado') AS registered
    FROM links k
    WHERE EXISTS (SELECT 1 FROM public.growth_lead_events e WHERE e.lead_id = k.lead_id AND e.type = 'para_viewed' AND e.created_at >= p_since)
  )
  SELECT
    v.design,
    count(*)::integer,
    coalesce(round(percentile_cont(0.5) WITHIN GROUP (ORDER BY v.seconds)), 0)::integer,
    count(*) FILTER (WHERE v.reached_store)::integer,
    count(*) FILTER (WHERE v.claimed)::integer,
    count(*) FILTER (WHERE v.registered)::integer
  FROM visited v
  GROUP BY v.design
  ORDER BY v.design;
$$;

REVOKE ALL ON FUNCTION public.growth_para_design_stats(uuid, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.growth_para_design_stats(uuid, timestamptz) TO service_role;
