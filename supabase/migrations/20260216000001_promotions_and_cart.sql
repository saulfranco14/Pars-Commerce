-- Promotions enhancement: new columns, promotion_images, cart/order tracking

-- 1. promotions: new columns
ALTER TABLE public.promotions
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS badge_label text,
  ADD COLUMN IF NOT EXISTS subcatalog_ids uuid[],
  ADD COLUMN IF NOT EXISTS quantity integer,
  ADD COLUMN IF NOT EXISTS bundle_product_ids uuid[];

CREATE UNIQUE INDEX IF NOT EXISTS idx_promotions_tenant_slug
  ON public.promotions (tenant_id, slug)
  WHERE slug IS NOT NULL;

-- 2. promotion_images
CREATE TABLE IF NOT EXISTS public.promotion_images (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  promotion_id uuid NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  url text NOT NULL,
  position smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promotion_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Promotion_images: tenant members"
  ON public.promotion_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.promotions p
      JOIN public.tenant_memberships m ON m.tenant_id = p.tenant_id AND m.user_id = auth.uid()
      WHERE p.id = promotion_images.promotion_id
    )
  );

CREATE POLICY "Promotion_images: public read when store enabled"
  ON public.promotion_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.promotions p
      JOIN public.tenants t ON t.id = p.tenant_id
      WHERE p.id = promotion_images.promotion_id AND t.public_store_enabled = true
    )
  );

-- 3. orders: add pending_pickup status
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (
  status IN ('draft','assigned','in_progress','completed','pending_payment','pending_pickup','paid','cancelled')
);

-- 4. public_cart_items: promotion_id
ALTER TABLE public.public_cart_items ADD COLUMN IF NOT EXISTS promotion_id uuid REFERENCES public.promotions(id) ON DELETE SET NULL;

-- 5. order_items: promotion_id
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS promotion_id uuid REFERENCES public.promotions(id) ON DELETE SET NULL;
