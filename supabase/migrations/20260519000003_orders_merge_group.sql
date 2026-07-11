-- Linked tables (shared bill).
--
-- Instead of absorbing one table into another, linked tables each keep their
-- own live order and QR (both stay OCCUPIED) but share one combined bill.
-- All orders in the same group carry the same merge_group_id. Reads (bill,
-- pay) aggregate across the group; unlinking just clears the column.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS merge_group_id uuid;

CREATE INDEX IF NOT EXISTS idx_orders_merge_group
  ON public.orders (merge_group_id)
  WHERE merge_group_id IS NOT NULL;
