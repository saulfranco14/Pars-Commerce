-- Product-led registration, catalog acceptance evidence and private preview links.

-- Historical showcase tenants are retained for reporting, but can no longer
-- be opened as public stores or receive orders.
UPDATE public.tenants
SET public_store_enabled = false,
    accepting_orders = false,
    settings = COALESCE(settings, '{}'::jsonb) || jsonb_build_object(
      'archived_showcase', true,
      'archived_at', now()
    ),
    updated_at = now()
WHERE is_demo = true;

UPDATE public.billing_plans
SET entitlements = entitlements || jsonb_build_object(
  'business_limit',
  CASE code
    WHEN 'free' THEN 1
    WHEN 'operation' THEN 2
    WHEN 'growth' THEN 3
    WHEN 'scale' THEN 12
  END
), updated_at = now()
WHERE code IN ('free', 'operation', 'growth', 'scale');

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS catalog_review_status text NOT NULL DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS catalog_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS catalog_approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

DO $$ BEGIN
  ALTER TABLE public.tenants ADD CONSTRAINT tenants_catalog_review_status_check
    CHECK (catalog_review_status IN ('not_required', 'pending', 'approved', 'changes_requested'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.tenant_catalog_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  catalog_template_id uuid REFERENCES public.catalog_templates(id) ON DELETE SET NULL,
  catalog_template_version integer,
  accepted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  acceptance_source text NOT NULL CHECK (acceptance_source IN ('dashboard', 'whatsapp', 'call')),
  note text,
  item_count integer NOT NULL DEFAULT 0,
  price_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  accepted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tenant_catalog_approvals_tenant_created_idx
  ON public.tenant_catalog_approvals(tenant_id, accepted_at DESC);

CREATE TABLE IF NOT EXISTS public.tenant_preview_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  last_viewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tenant_preview_links_tenant_active_idx
  ON public.tenant_preview_links(tenant_id, expires_at DESC)
  WHERE revoked_at IS NULL;

ALTER TABLE public.tenant_catalog_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_preview_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "catalog approvals: members read" ON public.tenant_catalog_approvals;
CREATE POLICY "catalog approvals: members read" ON public.tenant_catalog_approvals
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.tenant_memberships membership
    WHERE membership.tenant_id = tenant_catalog_approvals.tenant_id
      AND membership.user_id = auth.uid()
      AND membership.status = 'active'
  ));
DROP POLICY IF EXISTS "catalog approvals: service role" ON public.tenant_catalog_approvals;
CREATE POLICY "catalog approvals: service role" ON public.tenant_catalog_approvals
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
DROP POLICY IF EXISTS "preview links: service role" ON public.tenant_preview_links;
CREATE POLICY "preview links: service role" ON public.tenant_preview_links
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION public.approve_initial_catalog(
  p_tenant_id uuid,
  p_actor_id uuid,
  p_acceptance_source text DEFAULT 'dashboard',
  p_note text DEFAULT NULL
)
RETURNS TABLE (tenant_id uuid, tenant_slug text, item_count integer, approved_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant public.tenants%ROWTYPE;
  v_count integer;
  v_snapshot jsonb;
  v_is_owner boolean;
  v_is_platform_admin boolean;
BEGIN
  IF p_acceptance_source NOT IN ('dashboard', 'whatsapp', 'call') THEN
    RAISE EXCEPTION 'Invalid acceptance source';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.tenant_memberships membership
    JOIN public.tenant_roles role ON role.id = membership.role_id
    WHERE membership.tenant_id = p_tenant_id
      AND membership.user_id = p_actor_id
      AND membership.status = 'active'
      AND role.name = 'owner'
  ) INTO v_is_owner;
  SELECT EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = p_actor_id)
    INTO v_is_platform_admin;

  IF NOT v_is_owner AND NOT v_is_platform_admin THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF p_acceptance_source <> 'dashboard' AND NOT v_is_platform_admin THEN
    RAISE EXCEPTION 'Only a platform operator can record off-platform acceptance';
  END IF;

  SELECT * INTO v_tenant FROM public.tenants WHERE id = p_tenant_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tenant not found'; END IF;

  SELECT count(*), COALESCE(jsonb_agg(jsonb_build_object(
    'product_id', product.id,
    'name', product.name,
    'price', product.price,
    'type', product.type
  ) ORDER BY product.name), '[]'::jsonb)
  INTO v_count, v_snapshot
  FROM public.products product
  WHERE product.tenant_id = p_tenant_id AND product.deleted_at IS NULL;

  IF v_tenant.catalog_review_status <> 'approved' THEN
    INSERT INTO public.tenant_catalog_approvals(
      tenant_id, catalog_template_id, catalog_template_version, accepted_by,
      acceptance_source, note, item_count, price_snapshot
    ) VALUES (
      p_tenant_id, v_tenant.catalog_template_id, v_tenant.catalog_template_version,
      p_actor_id, p_acceptance_source, NULLIF(btrim(p_note), ''), v_count, v_snapshot
    );

    UPDATE public.tenants
    SET catalog_review_status = 'approved',
        catalog_approved_at = now(),
        catalog_approved_by = p_actor_id,
        public_store_enabled = true,
        accepting_orders = false,
        updated_at = now()
    WHERE id = p_tenant_id;
  END IF;

  RETURN QUERY
    SELECT tenant.id, tenant.slug, v_count, tenant.catalog_approved_at
    FROM public.tenants tenant WHERE tenant.id = p_tenant_id;
END;
$$;

REVOKE ALL ON FUNCTION public.approve_initial_catalog(uuid, uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_initial_catalog(uuid, uuid, text, text) TO service_role;
