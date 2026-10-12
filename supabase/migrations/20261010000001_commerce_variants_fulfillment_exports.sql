-- Ecommerce catalogue variants, payment proof review, delivery tracking and report export audit.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS has_variants boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS size_guide text,
  ADD COLUMN IF NOT EXISTS care_instructions text,
  ADD COLUMN IF NOT EXISTS material_info text;

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS site_slug text;

UPDATE public.tenants
SET site_slug = slug
WHERE site_slug IS NULL;

ALTER TABLE public.tenants
  ALTER COLUMN site_slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS tenants_site_slug_unique
  ON public.tenants(site_slug);

-- The public address is independent from the commercial name and dashboard
-- slug. Existing stores retain their address; new stores gain a short stable
-- suffix so two businesses with the same name can coexist.
CREATE OR REPLACE FUNCTION public.assign_tenant_site_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  readable text;
BEGIN
  IF NEW.site_slug IS NULL OR btrim(NEW.site_slug) = '' THEN
    readable := COALESCE(NULLIF(NEW.slug, ''), 'negocio');
    NEW.site_slug := lower(regexp_replace(readable, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(replace(NEW.id::text, '-', '') FROM 1 FOR 4);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS tenants_assign_site_slug ON public.tenants;
CREATE TRIGGER tenants_assign_site_slug
  BEFORE INSERT ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.assign_tenant_site_slug();

CREATE TABLE IF NOT EXISTS public.product_option_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 48),
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, name)
);

CREATE TABLE IF NOT EXISTS public.product_option_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  option_group_id uuid NOT NULL REFERENCES public.product_option_groups(id) ON DELETE CASCADE,
  label text NOT NULL CHECK (char_length(trim(label)) BETWEEN 1 AND 64),
  swatch_hex text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(option_group_id, label),
  CHECK (swatch_hex IS NULL OR swatch_hex ~ '^#[0-9A-Fa-f]{6}$')
);

CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku text,
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  track_stock boolean NOT NULL DEFAULT true,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  selection_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, selection_key),
  UNIQUE(product_id, sku)
);

CREATE TABLE IF NOT EXISTS public.product_variant_values (
  variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  option_value_id uuid NOT NULL REFERENCES public.product_option_values(id) ON DELETE RESTRICT,
  PRIMARY KEY(variant_id, option_value_id)
);

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS product_variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS variant_snapshot jsonb;

-- A cart line must remember the selected combination before it becomes an
-- immutable order item. The same blouse in black/S and arena/M remains two
-- independent lines in one cart.
ALTER TABLE public.public_cart_items
  ADD COLUMN IF NOT EXISTS product_variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS public_cart_items_variant_idx
  ON public.public_cart_items(cart_id, product_variant_id);

CREATE TABLE IF NOT EXISTS public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  order_item_id uuid NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text CHECK (char_length(comment) <= 1500),
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  UNIQUE(order_item_id)
);

CREATE TABLE IF NOT EXISTS public.tenant_fulfillment_settings (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  delivery_enabled boolean NOT NULL DEFAULT false,
  delivery_fee numeric(12,2) NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
  delivery_area_label text,
  pickup_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (NOT delivery_enabled OR length(trim(COALESCE(delivery_area_label, ''))) > 0)
);

CREATE TABLE IF NOT EXISTS public.tenant_pickup_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  address_text text NOT NULL,
  reference text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  instructions text,
  is_primary boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS tenant_pickup_points_one_primary
  ON public.tenant_pickup_points(tenant_id) WHERE is_primary AND is_active;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS fulfillment_method text,
  ADD COLUMN IF NOT EXISTS delivery_fee numeric(12,2) NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
  ADD COLUMN IF NOT EXISTS transfer_payment_method_id uuid REFERENCES public.tenant_payment_methods(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_verification_status text NOT NULL DEFAULT 'not_required';

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_fulfillment_method_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_fulfillment_method_check
  CHECK (fulfillment_method IS NULL OR fulfillment_method IN ('delivery', 'pickup'));
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_verification_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_verification_status_check
  CHECK (payment_verification_status IN ('not_required', 'proof_required', 'proof_submitted', 'approved', 'rejected'));

CREATE TABLE IF NOT EXISTS public.order_delivery_details (
  order_id uuid PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
  pickup_point_id uuid REFERENCES public.tenant_pickup_points(id) ON DELETE SET NULL,
  recipient_name text,
  recipient_phone text,
  address_text text,
  reference text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  mapbox_feature_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_transfer_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_method_id uuid NOT NULL REFERENCES public.tenant_payment_methods(id) ON DELETE RESTRICT,
  storage_path text NOT NULL,
  file_type text NOT NULL,
  amount_claimed numeric(12,2),
  status text NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_delivery_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('out_for_delivery', 'delivered', 'pickup_completed')),
  note text,
  photo_path text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (type <> 'delivered' OR photo_path IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.report_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  requested_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  report_type text NOT NULL CHECK (report_type IN ('sales', 'commissions')),
  format text NOT NULL CHECK (format IN ('pdf', 'xlsx')),
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  row_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_variants_product_active_idx ON public.product_variants(product_id, is_active);
CREATE INDEX IF NOT EXISTS product_reviews_public_idx ON public.product_reviews(product_id, created_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS order_transfer_proofs_pending_idx ON public.order_transfer_proofs(created_at DESC) WHERE status = 'pending_review';
CREATE INDEX IF NOT EXISTS order_delivery_events_order_idx ON public.order_delivery_events(order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS report_exports_tenant_idx ON public.report_exports(tenant_id, created_at DESC);

ALTER TABLE public.product_option_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_option_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variant_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_fulfillment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_pickup_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_delivery_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_transfer_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_delivery_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_exports ENABLE ROW LEVEL SECURITY;

-- Tenant members use the service/API layer for writes; public reads are intentionally narrow.
CREATE POLICY "product reviews public read" ON public.product_reviews FOR SELECT USING (status = 'published');
CREATE POLICY "product reviews tenant read" ON public.product_reviews FOR SELECT USING (EXISTS (SELECT 1 FROM public.tenant_memberships m WHERE m.tenant_id = product_reviews.tenant_id AND m.user_id = auth.uid() AND m.status = 'active'));
CREATE POLICY "fulfillment settings tenant member" ON public.tenant_fulfillment_settings FOR ALL USING (EXISTS (SELECT 1 FROM public.tenant_memberships m WHERE m.tenant_id = tenant_fulfillment_settings.tenant_id AND m.user_id = auth.uid() AND m.status = 'active')) WITH CHECK (EXISTS (SELECT 1 FROM public.tenant_memberships m WHERE m.tenant_id = tenant_fulfillment_settings.tenant_id AND m.user_id = auth.uid() AND m.status = 'active'));
CREATE POLICY "pickup points tenant member" ON public.tenant_pickup_points FOR ALL USING (EXISTS (SELECT 1 FROM public.tenant_memberships m WHERE m.tenant_id = tenant_pickup_points.tenant_id AND m.user_id = auth.uid() AND m.status = 'active')) WITH CHECK (EXISTS (SELECT 1 FROM public.tenant_memberships m WHERE m.tenant_id = tenant_pickup_points.tenant_id AND m.user_id = auth.uid() AND m.status = 'active'));
CREATE POLICY "report exports tenant member" ON public.report_exports FOR SELECT USING (EXISTS (SELECT 1 FROM public.tenant_memberships m WHERE m.tenant_id = report_exports.tenant_id AND m.user_id = auth.uid() AND m.status = 'active'));

INSERT INTO storage.buckets (id, name, public)
VALUES ('order-payment-proofs', 'order-payment-proofs', false), ('order-delivery-proofs', 'order-delivery-proofs', false)
ON CONFLICT (id) DO NOTHING;
