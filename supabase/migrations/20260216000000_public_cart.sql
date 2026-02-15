-- public_carts: carritos de compra del sitio público (anon/guest)
CREATE TABLE IF NOT EXISTS public.public_carts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  fingerprint_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_public_carts_tenant_fingerprint
  ON public.public_carts (tenant_id, fingerprint_id);

ALTER TABLE public.public_carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_carts: anon all"
  ON public.public_carts FOR ALL
  USING (true)
  WITH CHECK (true);

-- public_cart_items: items del carrito
CREATE TABLE IF NOT EXISTS public.public_cart_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id uuid NOT NULL REFERENCES public.public_carts(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity >= 1),
  price_snapshot decimal(12, 2) NOT NULL,
  promotion_id uuid REFERENCES public.promotions(id) ON DELETE SET NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cart_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_public_cart_items_cart_id
  ON public.public_cart_items (cart_id);

ALTER TABLE public.public_cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_cart_items: anon all"
  ON public.public_cart_items FOR ALL
  USING (true)
  WITH CHECK (true);
