-- Run BEFORE applying 20261021000001_offers_foundation.sql. Read-only.
-- Every query must return zero rows for the migration to be safe.

-- 1. Promotion types outside the new CHECK list.
SELECT type, count(*) AS rows
FROM public.promotions
WHERE type NOT IN ('percentage', 'fixed_amount', 'bundle_price', 'fixed_price', 'event_badge', 'nxm')
GROUP BY type;

-- 2. Cart lines that would break the new unique key (must already be unique today).
SELECT cart_id, product_id, product_variant_id, count(*) AS rows
FROM public.public_cart_items
GROUP BY cart_id, product_id, product_variant_id
HAVING count(*) > 1;

-- 3. Columns the migration adds must not exist with a different type.
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'promotions' AND column_name IN ('status', 'template_key', 'applies_to', 'buy_quantity', 'pay_quantity', 'archived_at'))
    OR (table_name = 'public_cart_items' AND column_name IN ('group_id', 'group_unit_quantity', 'list_unit_price'))
    OR (table_name = 'order_items' AND column_name IN ('list_unit_price', 'offer_group_id'))
  );

-- Informational (not a blocker): what the store shows today.
SELECT count(*) AS promotions_total FROM public.promotions;
SELECT count(*) AS cart_lines_total FROM public.public_cart_items;
