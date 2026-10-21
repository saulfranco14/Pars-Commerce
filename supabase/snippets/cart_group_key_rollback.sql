-- Reverts 20261023000001_cart_group_key.sql so code that upserts with
-- ON CONFLICT (cart_id, product_id, product_variant_id) works again. A product
-- that sits both standalone and inside a pack keeps only its newest line.

BEGIN;

DELETE FROM public.public_cart_items pci
USING public.public_cart_items newer
WHERE pci.cart_id = newer.cart_id
  AND pci.product_id = newer.product_id
  AND pci.product_variant_id IS NOT DISTINCT FROM newer.product_variant_id
  AND (pci.added_at, pci.id) < (newer.added_at, newer.id);

ALTER TABLE public.public_cart_items
  DROP CONSTRAINT IF EXISTS public_cart_items_cart_product_variant_key;
ALTER TABLE public.public_cart_items
  ADD CONSTRAINT public_cart_items_cart_product_variant_key
  UNIQUE NULLS NOT DISTINCT (cart_id, product_id, product_variant_id);

COMMIT;
