-- Add commission_amount field to products table

ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS commission_amount decimal(12, 2);

COMMENT ON COLUMN public.products.commission_amount IS 'Comisión fija por unidad vendida (opcional)';
