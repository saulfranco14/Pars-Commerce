-- Add cost_price column to products table

ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS cost_price decimal(12, 2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.products.cost_price IS 'Costo real del producto para calcular ganancias';
