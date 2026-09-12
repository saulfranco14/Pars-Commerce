-- Commercial catalog templates, demo portfolios and WhatsApp communication.
-- This migration intentionally keeps demos as normal tenants: `is_demo` is
-- metadata only; access still comes exclusively from tenant_memberships.

CREATE TABLE IF NOT EXISTS public.catalog_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  key text NOT NULL UNIQUE,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  business_type text NOT NULL,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.catalog_template_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id uuid NOT NULL REFERENCES public.catalog_templates(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  position smallint NOT NULL DEFAULT 0,
  UNIQUE(template_id, slug)
);

CREATE TABLE IF NOT EXISTS public.catalog_template_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id uuid NOT NULL REFERENCES public.catalog_templates(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.catalog_template_categories(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('product', 'service')),
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  unit text NOT NULL DEFAULT 'unit',
  track_stock boolean NOT NULL DEFAULT true,
  initial_stock integer NOT NULL DEFAULT 0 CHECK (initial_stock >= 0),
  image_url text,
  position smallint NOT NULL DEFAULT 0,
  UNIQUE(template_id, slug)
);

ALTER TABLE public.catalog_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_template_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_template_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "catalog templates: service role" ON public.catalog_templates
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "catalog categories: service role" ON public.catalog_template_categories
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "catalog items: service role" ON public.catalog_template_items
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS demo_key text,
  ADD COLUMN IF NOT EXISTS catalog_template_id uuid REFERENCES public.catalog_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS catalog_template_version integer,
  ADD COLUMN IF NOT EXISTS whatsapp_orders_enabled boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS tenants_demo_key_unique
  ON public.tenants(demo_key) WHERE demo_key IS NOT NULL;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS public_tracking_token uuid DEFAULT uuid_generate_v4(),
  ADD COLUMN IF NOT EXISTS whatsapp_request_key text;

CREATE UNIQUE INDEX IF NOT EXISTS orders_public_tracking_token_unique
  ON public.orders(public_tracking_token) WHERE public_tracking_token IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS orders_whatsapp_request_key_unique
  ON public.orders(whatsapp_request_key) WHERE whatsapp_request_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS orders_tenant_source_created_idx
  ON public.orders(tenant_id, source, created_at DESC);

CREATE TABLE IF NOT EXISTS public.communication_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('whatsapp')),
  entity_type text NOT NULL CHECK (entity_type IN ('order', 'loan', 'subscription', 'appointment')),
  entity_id uuid NOT NULL,
  event_type text NOT NULL,
  initiated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.communication_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "communication events: tenant members read" ON public.communication_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tenant_memberships m
      WHERE m.tenant_id = communication_events.tenant_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );
CREATE POLICY "communication events: service role" ON public.communication_events
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE INDEX IF NOT EXISTS communication_events_tenant_created_idx
  ON public.communication_events(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS communication_events_entity_created_idx
  ON public.communication_events(entity_type, entity_id, created_at DESC);

-- Atomically creates a tenant and copies an active commercial catalog. Client
-- code cannot call this directly: API routes authenticate and authorize first.
CREATE OR REPLACE FUNCTION public.create_tenant_with_catalog(
  p_owner_user_id uuid,
  p_name text,
  p_slug text,
  p_business_type text,
  p_catalog_template_key text DEFAULT NULL,
  p_site_template_id uuid DEFAULT NULL,
  p_is_demo boolean DEFAULT false,
  p_demo_key text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  products_created integer,
  services_created integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
  v_owner_role_id uuid;
  v_template public.catalog_templates%ROWTYPE;
  v_products_created integer := 0;
  v_services_created integer := 0;
BEGIN
  IF p_name IS NULL OR btrim(p_name) = '' OR p_slug IS NULL OR btrim(p_slug) = '' THEN
    RAISE EXCEPTION 'name and slug are required';
  END IF;

  IF p_is_demo AND (p_demo_key IS NULL OR btrim(p_demo_key) = '') THEN
    RAISE EXCEPTION 'demo_key is required for demo tenants';
  END IF;

  IF p_demo_key IS NOT NULL THEN
    SELECT t.id INTO v_tenant_id FROM public.tenants t WHERE t.demo_key = p_demo_key;
    IF v_tenant_id IS NOT NULL THEN
      SELECT r.id INTO v_owner_role_id FROM public.tenant_roles r
        WHERE r.tenant_id = v_tenant_id AND r.name = 'owner' LIMIT 1;
      INSERT INTO public.tenant_memberships(user_id, tenant_id, role_id, accepted_at, status)
      VALUES (p_owner_user_id, v_tenant_id, v_owner_role_id, now(), 'active')
      ON CONFLICT (user_id, tenant_id) DO UPDATE SET status = 'active', accepted_at = COALESCE(tenant_memberships.accepted_at, now());
      RETURN QUERY SELECT t.id, t.name, t.slug, 0, 0 FROM public.tenants t WHERE t.id = v_tenant_id;
      RETURN;
    END IF;
  END IF;

  IF p_catalog_template_key IS NOT NULL THEN
    SELECT * INTO v_template FROM public.catalog_templates
      WHERE key = p_catalog_template_key AND is_active = true;
    IF NOT FOUND THEN RAISE EXCEPTION 'Catalog template not found'; END IF;
    IF v_template.business_type <> p_business_type THEN
      RAISE EXCEPTION 'Catalog template does not match business type';
    END IF;
  END IF;

  INSERT INTO public.tenants(
    name, slug, business_type, site_template_id, is_demo, demo_key,
    catalog_template_id, catalog_template_version, public_store_enabled,
    accepting_orders
  ) VALUES (
    btrim(p_name), p_slug, p_business_type, p_site_template_id, p_is_demo, p_demo_key,
    v_template.id, v_template.version, p_is_demo, NOT p_is_demo
  ) RETURNING tenants.id INTO v_tenant_id;

  SELECT r.id INTO v_owner_role_id FROM public.tenant_roles r
    WHERE r.tenant_id = v_tenant_id AND r.name = 'owner' LIMIT 1;
  IF v_owner_role_id IS NULL THEN RAISE EXCEPTION 'Owner role was not created'; END IF;

  INSERT INTO public.tenant_memberships(user_id, tenant_id, role_id, accepted_at, status)
  VALUES (p_owner_user_id, v_tenant_id, v_owner_role_id, now(), 'active');

  IF p_catalog_template_key IS NOT NULL THEN
    INSERT INTO public.product_subcatalogs(tenant_id, name, slug)
    SELECT v_tenant_id, c.name, c.slug
    FROM public.catalog_template_categories c
    WHERE c.template_id = v_template.id
    ORDER BY c.position;

    INSERT INTO public.products(
      tenant_id, name, slug, description, price, unit, type, track_stock,
      is_public, image_url, subcatalog_id
    )
    SELECT
      v_tenant_id, i.name, i.slug, i.description, i.price, i.unit, i.type,
      i.track_stock, true, i.image_url, sc.id
    FROM public.catalog_template_items i
    LEFT JOIN public.catalog_template_categories c ON c.id = i.category_id
    LEFT JOIN public.product_subcatalogs sc ON sc.tenant_id = v_tenant_id AND sc.slug = c.slug
    WHERE i.template_id = v_template.id
    ORDER BY i.position;

    INSERT INTO public.product_inventory(product_id, quantity)
    SELECT p.id, i.initial_stock
    FROM public.products p
    JOIN public.catalog_template_items i ON i.template_id = v_template.id AND i.slug = p.slug
    WHERE p.tenant_id = v_tenant_id AND p.track_stock = true
    ON CONFLICT (product_id) DO NOTHING;

    INSERT INTO public.product_images(product_id, url, alt_text)
    SELECT p.id, p.image_url, p.name
    FROM public.products p
    WHERE p.tenant_id = v_tenant_id AND p.image_url IS NOT NULL;

    SELECT count(*) FILTER (WHERE type = 'product'), count(*) FILTER (WHERE type = 'service')
    INTO v_products_created, v_services_created
    FROM public.catalog_template_items WHERE template_id = v_template.id;
  END IF;

  RETURN QUERY SELECT t.id, t.name, t.slug, v_products_created, v_services_created
  FROM public.tenants t WHERE t.id = v_tenant_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_tenant_with_catalog(uuid, text, text, text, text, uuid, boolean, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_tenant_with_catalog(uuid, text, text, text, text, uuid, boolean, text) TO service_role;
