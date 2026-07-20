-- Per-item origin table label.
--
-- When two tables merge into one bill, we still want to show which physical
-- table each product was ordered at ("Raúl · Mesa 2"). The device→table link
-- is lost on merge (devices are re-parented), so we snapshot the table label
-- onto each order_item at insert time and preserve it through the merge.

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS origin_table_label text;
