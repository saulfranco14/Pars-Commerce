-- Add wholesale fields to products and order_items

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS wholesale_min_quantity integer,
  ADD COLUMN IF NOT EXISTS wholesale_price decimal(12, 2);

COMMENT ON COLUMN public.products.wholesale_min_quantity IS 'Cantidad mínima para aplicar precio mayoreo (opcional)';
COMMENT ON COLUMN public.products.wholesale_price IS 'Precio por unidad cuando aplica mayoreo (opcional)';

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS is_wholesale boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.order_items.is_wholesale IS 'Indica si se aplicó precio mayoreo en este item';
