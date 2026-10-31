-- =============================================================================
-- PLATFORM: Usuarios as a real table, filtered, sorted and paged in SQL.
--   * platform_users_overview: every account with its business, how far the
--     business got (growth_activation_stage), Mercado Pago, plan and where it
--     came from (engine / assisted / self and who brought it)
-- Filters (jsonb): q, status, activation, mp ('connected' | 'not'), origin,
-- plan, registered_from, registered_to, idle_days.
-- New objects only. Reverted by supabase/snippets/platform_users_overview_rollback.sql.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.platform_users_overview(
  p_filters jsonb DEFAULT '{}'::jsonb,
  p_sort text DEFAULT 'created_at',
  p_desc boolean DEFAULT true,
  p_page integer DEFAULT 1,
  p_per_page integer DEFAULT 25
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_per integer := greatest(1, least(coalesce(p_per_page, 25), 5000));
  v_page integer := greatest(1, coalesce(p_page, 1));
  v_q text := nullif(lower(btrim(coalesce(p_filters->>'q', ''))), '');
  v_result jsonb;
BEGIN
  WITH base AS (
    SELECT u.id, coalesce(u.email, p.email, '') AS email,
           coalesce(nullif(p.display_name, ''), u.raw_user_meta_data->>'display_name', '') AS display_name,
           p.phone, u.email_confirmed_at, u.last_sign_in_at, u.created_at,
           CASE WHEN u.banned_until > now() THEN u.banned_until END AS banned_until,
           CASE WHEN u.banned_until > now() THEN 'suspended'
                WHEN p.email_verification_status = 'pending' THEN 'pending'
                ELSE 'active' END AS status,
           EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = u.id) AS is_platform_admin,
           (SELECT m.tenant_id FROM public.tenant_memberships m LEFT JOIN public.tenant_roles r ON r.id = m.role_id
            WHERE m.user_id = u.id ORDER BY (r.name = 'owner') DESC, m.created_at LIMIT 1) AS tenant_id
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
  ),
  enriched AS (
    SELECT b.*, t.name AS tenant_name, t.slug AS tenant_slug,
           CASE WHEN b.tenant_id IS NULL THEN 'sin_negocio' ELSE public.growth_activation_stage(b.tenant_id) END AS activation,
           EXISTS (SELECT 1 FROM public.payment_provider_connections c WHERE c.tenant_id = b.tenant_id AND c.provider = 'mercadopago' AND c.status = 'connected') AS mp_connected,
           ba.plan_code AS plan,
           a.bucket AS origin,
           (SELECT coalesce(gm.display_name, pr.display_name) FROM public.profiles pr
            LEFT JOIN public.growth_members gm ON gm.user_id = pr.id
            WHERE pr.id = a.acquired_by LIMIT 1) AS acquired_by_name
    FROM base b
    LEFT JOIN public.tenants t ON t.id = b.tenant_id
    LEFT JOIN public.tenant_billing_accounts ba ON ba.tenant_id = b.tenant_id
    LEFT JOIN public.tenant_acquisitions a ON a.tenant_id = b.tenant_id
  ),
  filtered AS (
    SELECT * FROM enriched e
    WHERE (v_q IS NULL OR lower(e.email || ' ' || e.display_name || ' ' || coalesce(e.phone, '') || ' ' || coalesce(e.tenant_name, '')) LIKE '%' || v_q || '%')
      AND (p_filters->>'status' IS NULL OR e.status = p_filters->>'status')
      AND (p_filters->>'activation' IS NULL OR e.activation = p_filters->>'activation'
           OR (p_filters->>'activation' = 'sin_mp' AND e.tenant_id IS NOT NULL AND NOT e.mp_connected))
      AND (p_filters->>'mp' IS NULL OR (p_filters->>'mp' = 'connected') = e.mp_connected)
      AND (p_filters->>'origin' IS NULL OR coalesce(e.origin, 'self') = p_filters->>'origin')
      AND (p_filters->>'plan' IS NULL OR e.plan = p_filters->>'plan')
      AND (p_filters->>'registered_from' IS NULL OR e.created_at >= (p_filters->>'registered_from')::timestamptz)
      AND (p_filters->>'registered_to' IS NULL OR e.created_at < (p_filters->>'registered_to')::timestamptz)
      AND (p_filters->>'idle_days' IS NULL OR coalesce(e.last_sign_in_at, e.created_at) < now() - make_interval(days => (p_filters->>'idle_days')::integer))
  ),
  page AS (
    SELECT * FROM filtered f
    ORDER BY
      CASE WHEN NOT p_desc THEN CASE p_sort WHEN 'name' THEN lower(f.display_name) WHEN 'email' THEN f.email WHEN 'activation' THEN f.activation END END ASC,
      CASE WHEN p_desc THEN CASE p_sort WHEN 'name' THEN lower(f.display_name) WHEN 'email' THEN f.email WHEN 'activation' THEN f.activation END END DESC,
      CASE WHEN NOT p_desc THEN CASE p_sort WHEN 'last_sign_in_at' THEN f.last_sign_in_at WHEN 'created_at' THEN f.created_at END END ASC NULLS LAST,
      CASE WHEN p_desc THEN CASE p_sort WHEN 'last_sign_in_at' THEN f.last_sign_in_at WHEN 'created_at' THEN f.created_at END END DESC NULLS LAST,
      f.created_at DESC, f.id
    LIMIT v_per OFFSET (v_page - 1) * v_per
  )
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM filtered),
    'stats', (SELECT jsonb_build_object(
      'total', count(*),
      'active', count(*) FILTER (WHERE status = 'active'),
      'pending', count(*) FILTER (WHERE status = 'pending'),
      'suspended', count(*) FILTER (WHERE status = 'suspended'),
      'without_business', count(*) FILTER (WHERE tenant_id IS NULL),
      'without_mp', count(*) FILTER (WHERE tenant_id IS NOT NULL AND NOT mp_connected),
      'from_engine', count(*) FILTER (WHERE origin IN ('engine', 'assisted'))
    ) FROM enriched),
    'rows', coalesce((SELECT jsonb_agg(jsonb_build_object(
      'id', pg.id, 'email', pg.email, 'display_name', pg.display_name, 'phone', pg.phone,
      'email_confirmed_at', pg.email_confirmed_at, 'last_sign_in_at', pg.last_sign_in_at, 'created_at', pg.created_at,
      'banned_until', pg.banned_until, 'status', pg.status, 'is_platform_admin', pg.is_platform_admin,
      'tenant', CASE WHEN pg.tenant_id IS NULL THEN NULL ELSE jsonb_build_object('id', pg.tenant_id, 'name', pg.tenant_name, 'slug', pg.tenant_slug) END,
      'activation', pg.activation, 'mp_connected', pg.mp_connected, 'plan', pg.plan,
      'origin', coalesce(pg.origin, 'self'), 'acquired_by_name', pg.acquired_by_name,
      'memberships', coalesce((
        SELECT jsonb_agg(jsonb_build_object('tenant_id', m.tenant_id, 'status', coalesce(m.status, 'active'),
               'tenant', jsonb_build_object('name', t.name, 'slug', t.slug), 'role', coalesce(r.name, 'member')))
        FROM public.tenant_memberships m
        LEFT JOIN public.tenants t ON t.id = m.tenant_id
        LEFT JOIN public.tenant_roles r ON r.id = m.role_id
        WHERE m.user_id = pg.id
      ), '[]'::jsonb)
    )) FROM page pg), '[]'::jsonb)
  ) INTO v_result;
  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.platform_users_overview(jsonb, text, boolean, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.platform_users_overview(jsonb, text, boolean, integer, integer) TO service_role;
