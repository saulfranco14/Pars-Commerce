-- Add wholesale_savings to order_items for displaying customer savings

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS wholesale_savings decimal(12, 2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.order_items.wholesale_savings IS 'Monto ahorrado al aplicar precio mayoreo (precio retail - precio mayoreo) x cantidad';
