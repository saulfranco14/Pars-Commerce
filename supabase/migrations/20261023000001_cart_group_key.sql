-- =============================================================================
-- CART GROUP KEY — contract step of the offers rollout.
-- Apply ONLY after the release whose cart code no longer upserts with
-- ON CONFLICT (cart_id, product_id, product_variant_id) is live; that code
-- (cartLineService) inserts and updates lines explicitly.
-- Same rule as before when group_id is NULL (every existing row); a product
-- may now also sit inside a pack without overwriting its standalone line.
-- Rollback: supabase/snippets/cart_group_key_rollback.sql
-- =============================================================================

ALTER TABLE public.public_cart_items
  DROP CONSTRAINT IF EXISTS public_cart_items_cart_product_variant_key;
ALTER TABLE public.public_cart_items
  ADD CONSTRAINT public_cart_items_cart_product_variant_key
  UNIQUE NULLS NOT DISTINCT (cart_id, product_id, product_variant_id, group_id);
