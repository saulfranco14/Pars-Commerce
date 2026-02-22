-- Promotions: buy_x_get_y_free, apply_automatically, priority, trigger/free fields
-- Cart: quantity_free for items that are free with purchase

ALTER TABLE public.promotions
  ADD COLUMN IF NOT EXISTS apply_automatically boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS priority smallint NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS trigger_product_ids uuid[],
  ADD COLUMN IF NOT EXISTS trigger_quantity integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS free_quantity_per_trigger integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS free_quantity_max integer;

COMMENT ON COLUMN public.promotions.apply_automatically IS 'Si true, al agregar producto desde catálogo se aplica esta promo si el producto está en ella';
COMMENT ON COLUMN public.promotions.priority IS 'Menor = mayor prioridad cuando varias promos aplican al mismo producto (default 100)';
COMMENT ON COLUMN public.promotions.trigger_product_ids IS 'Para buy_x_get_y_free: productos que deben estar en carrito para dar el regalo';
COMMENT ON COLUMN public.promotions.trigger_quantity IS 'Cantidad mínima del trigger por cada "unidad" de beneficio (ej. 1 Vodka = 1 free)';
COMMENT ON COLUMN public.promotions.free_quantity_per_trigger IS 'Unidades gratis por cada trigger cumplido';
COMMENT ON COLUMN public.promotions.free_quantity_max IS 'Límite total de unidades gratis en la transacción';

ALTER TABLE public.public_cart_items
  ADD COLUMN IF NOT EXISTS quantity_free integer NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'public_cart_items_quantity_free_check'
  ) THEN
    ALTER TABLE public.public_cart_items
      ADD CONSTRAINT public_cart_items_quantity_free_check
      CHECK (quantity_free >= 0 AND quantity_free <= quantity);
  END IF;
END $$;

COMMENT ON COLUMN public.public_cart_items.quantity_free IS 'Unidades de las quantity que son gratis (resto se cobra a price_snapshot)';

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS quantity_free integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.order_items.quantity_free IS 'Unidades gratis en este item para mostrar en ticket';
