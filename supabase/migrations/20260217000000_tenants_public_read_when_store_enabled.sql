-- Allow anonymous users to read tenants when public_store_enabled = true.
-- Needed for public-cart API: visitors (no auth) must verify tenant exists before adding to cart.
-- Existing "Tenants: members can read" allows members to read any tenant; this adds public read for enabled stores.
CREATE POLICY "Tenants: public read when store enabled"
  ON public.tenants
  FOR SELECT
  USING (public_store_enabled = true);
