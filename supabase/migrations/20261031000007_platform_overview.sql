-- =============================================================================
-- PLATFORM: operation dashboard without settlements, and store visits.
--   * storefront_daily_views: one row per store, day and anonymous visitor
--     (a server-side hash; no cookies), counting page views
--   * track_storefront_view: adds one view (upsert)
--   * platform_overview: registrations, published stores, Mercado Pago
--     connections, paid orders and sales, store visits, active users, the
--     activation funnel, top stores and alerts, for a date range
-- New objects only. Reverted by supabase/snippets/platform_overview_rollback.sql.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.storefront_daily_views (
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  day date NOT NULL,
  visitor_hash text NOT NULL CHECK (char_length(visitor_hash) BETWEEN 16 AND 128),
  views integer NOT NULL DEFAULT 1 CHECK (views > 0),
  PRIMARY KEY (tenant_id, day, visitor_hash)
);

CREATE INDEX IF NOT EXISTS storefront_daily_views_day_idx ON public.storefront_daily_views (day, tenant_id);

ALTER TABLE public.storefront_daily_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "storefront views: service role" ON public.storefront_daily_views;
CREATE POLICY "storefront views: service role" ON public.storefront_daily_views FOR ALL
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION public.track_storefront_view(p_tenant_id uuid, p_visitor_hash text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.storefront_daily_views (tenant_id, day, visitor_hash)
  VALUES (p_tenant_id, (now() AT TIME ZONE 'America/Mexico_City')::date, p_visitor_hash)
  ON CONFLICT (tenant_id, day, visitor_hash) DO UPDATE SET views = public.storefront_daily_views.views + 1;
$$;

CREATE OR REPLACE FUNCTION public.platform_overview(p_from timestamptz, p_to timestamptz)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH span AS (
    SELECT p_from AS f, p_to AS t, p_from - (p_to - p_from) AS prev_f,
           (p_from AT TIME ZONE 'America/Mexico_City')::date AS day_f, (p_to AT TIME ZONE 'America/Mexico_City')::date AS day_t
  ),
  paid AS (
    SELECT o.tenant_id, o.total, o.paid_at FROM public.orders o
    WHERE o.paid_at IS NOT NULL AND o.status <> 'cancelled'
  ),
  tenant_state AS (
    SELECT t.id, t.name, t.slug, t.created_at, t.public_store_enabled,
           t.settings->'onboarding'->>'status' = 'active' AS store_ready,
           EXISTS (SELECT 1 FROM public.payment_provider_connections c WHERE c.tenant_id = t.id AND c.provider = 'mercadopago' AND c.status = 'connected') AS mp_connected,
           EXISTS (SELECT 1 FROM public.payment_provider_connections c WHERE c.tenant_id = t.id AND c.provider = 'mercadopago' AND c.status IN ('expired', 'revoked', 'failed')) AS mp_problem,
           EXISTS (SELECT 1 FROM paid WHERE paid.tenant_id = t.id) AS sold,
           (SELECT count(*) FROM paid WHERE paid.tenant_id = t.id AND paid.paid_at > now() - interval '30 days') AS paid_30d
    FROM public.tenants t
  ),
  views AS (
    SELECT v.* FROM public.storefront_daily_views v, span WHERE v.day >= span.day_f AND v.day <= span.day_t
  )
  SELECT jsonb_build_object(
    'registrations', (SELECT count(*) FROM tenant_state, span WHERE created_at >= span.f AND created_at < span.t),
    'registrations_prev', (SELECT count(*) FROM tenant_state, span WHERE created_at >= span.prev_f AND created_at < span.f),
    'registrations_by_day', coalesce((
      SELECT jsonb_agg(jsonb_build_object('day', d.day, 'value', coalesce(r.n, 0)) ORDER BY d.day)
      FROM span, generate_series(span.day_f, span.day_t, interval '1 day') AS d(day)
      LEFT JOIN (SELECT (created_at AT TIME ZONE 'America/Mexico_City')::date AS day, count(*) AS n FROM tenant_state GROUP BY 1) r ON r.day = d.day::date
    ), '[]'::jsonb),
    'tenants', (SELECT count(*) FROM tenant_state),
    'stores_published', (SELECT count(*) FROM tenant_state WHERE public_store_enabled),
    'mp_connected', (SELECT count(*) FROM tenant_state WHERE mp_connected),
    'orders', (SELECT count(*) FROM paid, span WHERE paid.paid_at >= span.f AND paid.paid_at < span.t),
    'sales', (SELECT coalesce(sum(total), 0) FROM paid, span WHERE paid.paid_at >= span.f AND paid.paid_at < span.t),
    'visits', (SELECT coalesce(sum(views), 0) FROM views),
    'visitors', (SELECT count(*) FROM views),
    'visits_by_day', coalesce((
      SELECT jsonb_agg(jsonb_build_object('day', d.day, 'value', coalesce(v.n, 0)) ORDER BY d.day)
      FROM span, generate_series(span.day_f, span.day_t, interval '1 day') AS d(day)
      LEFT JOIN (SELECT day, sum(views) AS n FROM views GROUP BY day) v ON v.day = d.day::date
    ), '[]'::jsonb),
    'active_users_7d', (SELECT count(*) FROM auth.users u WHERE u.last_sign_in_at > now() - interval '7 days'),
    'funnel', jsonb_build_object(
      'registered', (SELECT count(*) FROM tenant_state),
      'store_ready', (SELECT count(*) FROM tenant_state WHERE store_ready OR mp_connected OR sold),
      'mp_connected', (SELECT count(*) FROM tenant_state WHERE mp_connected OR sold),
      'first_sale', (SELECT count(*) FROM tenant_state WHERE sold),
      'active', (SELECT count(*) FROM tenant_state WHERE paid_30d >= 5)
    ),
    'top_stores', coalesce((
      SELECT jsonb_agg(row_to_json(x) ORDER BY x.visits DESC)
      FROM (
        SELECT ts.id AS tenant_id, ts.name, ts.slug, sum(v.views) AS visits,
               (SELECT count(*) FROM paid, span WHERE paid.tenant_id = ts.id AND paid.paid_at >= span.f AND paid.paid_at < span.t) AS orders,
               ts.mp_connected
        FROM views v JOIN tenant_state ts ON ts.id = v.tenant_id
        GROUP BY ts.id, ts.name, ts.slug, ts.mp_connected
        ORDER BY sum(v.views) DESC
        LIMIT 8
      ) x
    ), '[]'::jsonb),
    'alerts', jsonb_build_object(
      'mp_problem', (SELECT count(*) FROM tenant_state WHERE mp_problem AND NOT mp_connected),
      'published_without_products', (
        SELECT count(*) FROM tenant_state ts
        WHERE ts.public_store_enabled
          AND NOT EXISTS (SELECT 1 FROM public.products p WHERE p.tenant_id = ts.id AND p.is_public AND p.deleted_at IS NULL)
      ),
      'open_settlements', (SELECT count(*) FROM public.settlements s WHERE s.status IN ('open', 'closed', 'transfer_pending', 'disputed'))
    ),
    'by_acquisition', coalesce((
      SELECT jsonb_object_agg(bucket, n) FROM (
        SELECT a.bucket, count(*) AS n FROM public.tenant_acquisitions a, span
        WHERE a.captured_at >= span.f AND a.captured_at < span.t GROUP BY a.bucket
      ) b
    ), '{}'::jsonb)
  );
$$;

REVOKE ALL ON FUNCTION public.track_storefront_view(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.platform_overview(timestamptz, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_storefront_view(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.platform_overview(timestamptz, timestamptz) TO service_role;
