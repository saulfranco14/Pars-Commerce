-- Lets a starter catalog ship items hidden from the public site (cigarettes in
-- the grocery template). Existing template rows stay public.
ALTER TABLE public.catalog_template_items
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;

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
      i.track_stock, i.is_public, i.image_url, sc.id
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
