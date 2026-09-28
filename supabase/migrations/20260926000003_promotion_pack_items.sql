-- Packs need their own quantities: "2 cafés + 1 pan" cannot be represented
-- by the old array of product ids and one global quantity.
CREATE TABLE IF NOT EXISTS public.promotion_items (
  -- This project uses pgcrypto's UUID generator. uuid-ossp is not enabled
  -- in every Supabase project, so uuid_generate_v4() is not portable here.
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id uuid NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0 AND quantity <= 999),
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (promotion_id, product_id)
);

CREATE INDEX IF NOT EXISTS promotion_items_promotion_position_idx
  ON public.promotion_items (promotion_id, position);

ALTER TABLE public.promotion_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Promotion_items: tenant members" ON public.promotion_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.promotions p
      JOIN public.tenant_memberships m ON m.tenant_id = p.tenant_id
      WHERE p.id = promotion_items.promotion_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Promotion_items: public read when store enabled" ON public.promotion_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.promotions p
      JOIN public.tenants t ON t.id = p.tenant_id
      WHERE p.id = promotion_items.promotion_id AND t.public_store_enabled = true
    )
  );
