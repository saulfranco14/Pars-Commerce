-- Reverts 20261021000001_offers_foundation.sql. Run only if the release that
-- uses these columns is rolled back too. Grouped pack lines are collapsed back
-- to one line per product so the original unique key can be restored.

BEGIN;

DROP FUNCTION IF EXISTS public.save_promotion(jsonb, jsonb);

ALTER TABLE public.order_items
  DROP COLUMN IF EXISTS offer_group_id,
  DROP COLUMN IF EXISTS list_unit_price;

-- Keep the most recent line per (cart, product, variant) before restoring the old key.
DELETE FROM public.public_cart_items pci
USING public.public_cart_items newer
WHERE pci.cart_id = newer.cart_id
  AND pci.product_id = newer.product_id
  AND pci.product_variant_id IS NOT DISTINCT FROM newer.product_variant_id
  AND (pci.added_at, pci.id) < (newer.added_at, newer.id);

DROP INDEX IF EXISTS public.public_cart_items_group_idx;
ALTER TABLE public.public_cart_items DROP CONSTRAINT IF EXISTS public_cart_items_cart_product_variant_key;
ALTER TABLE public.public_cart_items DROP CONSTRAINT IF EXISTS public_cart_items_group_unit_quantity_check;
ALTER TABLE public.public_cart_items
  DROP COLUMN IF EXISTS list_unit_price,
  DROP COLUMN IF EXISTS group_unit_quantity,
  DROP COLUMN IF EXISTS group_id;
ALTER TABLE public.public_cart_items
  ADD CONSTRAINT public_cart_items_cart_product_variant_key
  UNIQUE NULLS NOT DISTINCT (cart_id, product_id, product_variant_id);

DROP POLICY IF EXISTS "Promotions: public read when store enabled" ON public.promotions;
CREATE POLICY "Promotions: public read when store enabled" ON public.promotions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.id = promotions.tenant_id AND t.public_store_enabled = true
    )
  );

DROP INDEX IF EXISTS public.promotions_tenant_status_idx;
-- Without `status` an archived promotion would show again, and an nxm one has
-- no columns left to price it: both go, as the old hard delete did. Paused
-- promotions become visible again; pause them by date range if needed.
DELETE FROM public.promotions WHERE type = 'nxm' OR status = 'archived';
ALTER TABLE public.promotions
  DROP CONSTRAINT IF EXISTS promotions_type_check,
  DROP CONSTRAINT IF EXISTS promotions_nxm_check,
  DROP CONSTRAINT IF EXISTS promotions_applies_to_check,
  DROP CONSTRAINT IF EXISTS promotions_status_check;
ALTER TABLE public.promotions
  DROP COLUMN IF EXISTS archived_at,
  DROP COLUMN IF EXISTS pay_quantity,
  DROP COLUMN IF EXISTS buy_quantity,
  DROP COLUMN IF EXISTS applies_to,
  DROP COLUMN IF EXISTS template_key,
  DROP COLUMN IF EXISTS status;

COMMIT;
