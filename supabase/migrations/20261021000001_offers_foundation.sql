-- Offers foundation (Fase 0). Additive only: every new column is nullable or
-- defaults to today's behavior, so existing carts, promotions and orders keep
-- their meaning and the currently deployed code keeps working.
-- Pre-checks and rollback: supabase/snippets/offers_foundation_{prechecks,rollback}.sql

-- ── promotions: lifecycle and new mechanics ─────────────────────────────────
ALTER TABLE public.promotions
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS template_key text,
  ADD COLUMN IF NOT EXISTS applies_to text NOT NULL DEFAULT 'products',
  ADD COLUMN IF NOT EXISTS buy_quantity integer,
  ADD COLUMN IF NOT EXISTS pay_quantity integer,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

ALTER TABLE public.promotions DROP CONSTRAINT IF EXISTS promotions_status_check;
ALTER TABLE public.promotions
  ADD CONSTRAINT promotions_status_check
  CHECK (status IN ('draft', 'active', 'paused', 'archived'));

ALTER TABLE public.promotions DROP CONSTRAINT IF EXISTS promotions_applies_to_check;
ALTER TABLE public.promotions
  ADD CONSTRAINT promotions_applies_to_check
  CHECK (applies_to IN ('products', 'subcatalogs', 'all'));

ALTER TABLE public.promotions DROP CONSTRAINT IF EXISTS promotions_nxm_check;
ALTER TABLE public.promotions
  ADD CONSTRAINT promotions_nxm_check
  CHECK (
    type <> 'nxm'
    OR (buy_quantity BETWEEN 2 AND 10 AND pay_quantity >= 1 AND pay_quantity < buy_quantity)
  );

-- NOT VALID first so a legacy row outside the list never blocks the deploy;
-- the prechecks snippet must report zero such rows before validating.
ALTER TABLE public.promotions DROP CONSTRAINT IF EXISTS promotions_type_check;
ALTER TABLE public.promotions
  ADD CONSTRAINT promotions_type_check
  CHECK (type IN ('percentage', 'fixed_amount', 'bundle_price', 'fixed_price', 'event_badge', 'nxm'))
  NOT VALID;
ALTER TABLE public.promotions VALIDATE CONSTRAINT promotions_type_check;

CREATE INDEX IF NOT EXISTS promotions_tenant_status_idx
  ON public.promotions (tenant_id, status);

-- A paused or archived promotion must disappear from the public store.
DROP POLICY IF EXISTS "Promotions: public read when store enabled" ON public.promotions;
CREATE POLICY "Promotions: public read when store enabled" ON public.promotions
  FOR SELECT USING (
    promotions.status = 'active'
    AND EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.id = promotions.tenant_id AND t.public_store_enabled = true
    )
  );

-- ── public_cart_items: packs travel as one group ────────────────────────────
ALTER TABLE public.public_cart_items
  ADD COLUMN IF NOT EXISTS group_id uuid,
  ADD COLUMN IF NOT EXISTS group_unit_quantity integer,
  ADD COLUMN IF NOT EXISTS list_unit_price numeric(12, 2);

ALTER TABLE public.public_cart_items DROP CONSTRAINT IF EXISTS public_cart_items_group_unit_quantity_check;
ALTER TABLE public.public_cart_items
  ADD CONSTRAINT public_cart_items_group_unit_quantity_check
  CHECK (group_unit_quantity IS NULL OR group_unit_quantity >= 1);

-- The unique key keeps its three columns here so the cart code already in
-- production (upsert ON CONFLICT cart_id,product_id,product_variant_id) keeps
-- working. 20261023000001_cart_group_key widens it after the new code ships.

CREATE INDEX IF NOT EXISTS public_cart_items_group_idx
  ON public.public_cart_items (cart_id, group_id)
  WHERE group_id IS NOT NULL;

-- ── order_items: keep what the buyer saw ────────────────────────────────────
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS list_unit_price numeric(12, 2),
  ADD COLUMN IF NOT EXISTS offer_group_id uuid;

-- ── save_promotion: promotion + pack items in one transaction ───────────────
-- Called only from the service role after the API checked promotions.write.
CREATE OR REPLACE FUNCTION public.save_promotion(p_promotion jsonb, p_items jsonb DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid := NULLIF(p_promotion->>'id', '')::uuid;
  v_tenant uuid := (p_promotion->>'tenant_id')::uuid;
BEGIN
  IF v_tenant IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED' USING ERRCODE = 'P0001';
  END IF;

  IF v_id IS NULL THEN
    INSERT INTO public.promotions (
      tenant_id, name, slug, description, image_url, type, value, min_amount,
      product_ids, subcatalog_ids, bundle_product_ids, quantity, badge_label,
      valid_from, valid_until, status, template_key, applies_to, buy_quantity, pay_quantity
    ) VALUES (
      v_tenant,
      p_promotion->>'name',
      NULLIF(p_promotion->>'slug', ''),
      NULLIF(p_promotion->>'description', ''),
      NULLIF(p_promotion->>'image_url', ''),
      p_promotion->>'type',
      COALESCE((p_promotion->>'value')::numeric, 0),
      NULLIF(p_promotion->>'min_amount', '')::numeric,
      CASE WHEN p_promotion ? 'product_ids' THEN ARRAY(SELECT jsonb_array_elements_text(p_promotion->'product_ids'))::uuid[] END,
      CASE WHEN p_promotion ? 'subcatalog_ids' THEN ARRAY(SELECT jsonb_array_elements_text(p_promotion->'subcatalog_ids'))::uuid[] END,
      CASE WHEN p_promotion ? 'bundle_product_ids' THEN ARRAY(SELECT jsonb_array_elements_text(p_promotion->'bundle_product_ids'))::uuid[] END,
      NULLIF(p_promotion->>'quantity', '')::integer,
      NULLIF(p_promotion->>'badge_label', ''),
      NULLIF(p_promotion->>'valid_from', '')::timestamptz,
      NULLIF(p_promotion->>'valid_until', '')::timestamptz,
      COALESCE(NULLIF(p_promotion->>'status', ''), 'active'),
      NULLIF(p_promotion->>'template_key', ''),
      COALESCE(NULLIF(p_promotion->>'applies_to', ''), 'products'),
      NULLIF(p_promotion->>'buy_quantity', '')::integer,
      NULLIF(p_promotion->>'pay_quantity', '')::integer
    )
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.promotions SET
      name = COALESCE(p_promotion->>'name', name),
      slug = CASE WHEN p_promotion ? 'slug' THEN NULLIF(p_promotion->>'slug', '') ELSE slug END,
      description = CASE WHEN p_promotion ? 'description' THEN NULLIF(p_promotion->>'description', '') ELSE description END,
      image_url = CASE WHEN p_promotion ? 'image_url' THEN NULLIF(p_promotion->>'image_url', '') ELSE image_url END,
      type = COALESCE(p_promotion->>'type', type),
      value = COALESCE((p_promotion->>'value')::numeric, value),
      min_amount = CASE WHEN p_promotion ? 'min_amount' THEN NULLIF(p_promotion->>'min_amount', '')::numeric ELSE min_amount END,
      product_ids = CASE WHEN p_promotion ? 'product_ids' THEN ARRAY(SELECT jsonb_array_elements_text(p_promotion->'product_ids'))::uuid[] ELSE product_ids END,
      subcatalog_ids = CASE WHEN p_promotion ? 'subcatalog_ids' THEN ARRAY(SELECT jsonb_array_elements_text(p_promotion->'subcatalog_ids'))::uuid[] ELSE subcatalog_ids END,
      bundle_product_ids = CASE WHEN p_promotion ? 'bundle_product_ids' THEN ARRAY(SELECT jsonb_array_elements_text(p_promotion->'bundle_product_ids'))::uuid[] ELSE bundle_product_ids END,
      quantity = CASE WHEN p_promotion ? 'quantity' THEN NULLIF(p_promotion->>'quantity', '')::integer ELSE quantity END,
      badge_label = CASE WHEN p_promotion ? 'badge_label' THEN NULLIF(p_promotion->>'badge_label', '') ELSE badge_label END,
      valid_from = CASE WHEN p_promotion ? 'valid_from' THEN NULLIF(p_promotion->>'valid_from', '')::timestamptz ELSE valid_from END,
      valid_until = CASE WHEN p_promotion ? 'valid_until' THEN NULLIF(p_promotion->>'valid_until', '')::timestamptz ELSE valid_until END,
      status = COALESCE(NULLIF(p_promotion->>'status', ''), status),
      template_key = CASE WHEN p_promotion ? 'template_key' THEN NULLIF(p_promotion->>'template_key', '') ELSE template_key END,
      applies_to = COALESCE(NULLIF(p_promotion->>'applies_to', ''), applies_to),
      buy_quantity = CASE WHEN p_promotion ? 'buy_quantity' THEN NULLIF(p_promotion->>'buy_quantity', '')::integer ELSE buy_quantity END,
      pay_quantity = CASE WHEN p_promotion ? 'pay_quantity' THEN NULLIF(p_promotion->>'pay_quantity', '')::integer ELSE pay_quantity END,
      archived_at = CASE WHEN p_promotion->>'status' = 'archived' THEN COALESCE(archived_at, now()) ELSE archived_at END,
      updated_at = now()
    WHERE id = v_id AND tenant_id = v_tenant;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'PROMOTION_NOT_FOUND' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  -- NULL means "leave the pack as it is"; an array (even empty) replaces it.
  IF p_items IS NOT NULL THEN
    DELETE FROM public.promotion_items WHERE promotion_id = v_id;
    INSERT INTO public.promotion_items (promotion_id, product_id, quantity, position)
    SELECT v_id, (item->>'product_id')::uuid, (item->>'quantity')::integer, ordinality - 1
    FROM jsonb_array_elements(p_items) WITH ORDINALITY AS t(item, ordinality);
  END IF;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.save_promotion(jsonb, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.save_promotion(jsonb, jsonb) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_promotion(jsonb, jsonb) TO service_role;
