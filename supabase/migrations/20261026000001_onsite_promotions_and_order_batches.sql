-- One promotion definition can serve the public store and every onsite sale.
-- Existing promotions intentionally start in both channels; a tenant-level
-- switch provides the requested emergency/global off control for onsite use.

ALTER TABLE public.promotions
  ADD COLUMN IF NOT EXISTS sales_channels text[] NOT NULL
    DEFAULT ARRAY['public_store', 'onsite']::text[];

UPDATE public.promotions
SET sales_channels = ARRAY['public_store', 'onsite']::text[]
WHERE sales_channels IS NULL OR cardinality(sales_channels) = 0;

ALTER TABLE public.promotions
  DROP CONSTRAINT IF EXISTS promotions_sales_channels_check;
ALTER TABLE public.promotions
  ADD CONSTRAINT promotions_sales_channels_check CHECK (
    cardinality(sales_channels) > 0
    AND sales_channels <@ ARRAY['public_store', 'onsite']::text[]
  );

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS onsite_promotions_enabled boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.order_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  device_id uuid REFERENCES public.order_devices(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'qr_table',
  customer_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT order_batches_customer_note_check CHECK (
    customer_note IS NULL OR char_length(customer_note) <= 500
  )
);

CREATE INDEX IF NOT EXISTS order_batches_order_created_idx
  ON public.order_batches(order_id, created_at);
CREATE INDEX IF NOT EXISTS order_batches_device_idx
  ON public.order_batches(device_id)
  WHERE device_id IS NOT NULL;

ALTER TABLE public.order_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Order batches: tenant members read"
  ON public.order_batches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_memberships membership
      WHERE membership.tenant_id = order_batches.tenant_id
        AND membership.user_id = auth.uid()
    )
  );

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS batch_id uuid
    REFERENCES public.order_batches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS order_items_batch_idx
  ON public.order_items(batch_id)
  WHERE batch_id IS NOT NULL;

-- The API computes prices from live catalog and promotion data, then this RPC
-- commits the participant, batch, lines and totals in one transaction. It is
-- service-role only: browsers can never submit their own prices directly.
CREATE OR REPLACE FUNCTION public.submit_table_order_v2(
  p_qr_token text,
  p_device_fingerprint text,
  p_display_name text,
  p_priced_items jsonb,
  p_customer_note text DEFAULT NULL
)
RETURNS TABLE(order_id uuid, device_id uuid, batch_id uuid, added_items integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_qr public.qr_codes%ROWTYPE;
  v_order public.orders%ROWTYPE;
  v_order_id uuid;
  v_device_id uuid;
  v_batch_id uuid;
  v_device_index integer;
  v_participant_count integer;
  v_is_new_contributor boolean;
  v_item jsonb;
  v_product public.products%ROWTYPE;
  v_product_id uuid;
  v_quantity integer;
  v_unit_price numeric(12,2);
  v_list_unit_price numeric(12,2);
  v_promotion_id uuid;
  v_offer_group_id uuid;
  v_added_total numeric(12,2) := 0;
  v_added_items integer := 0;
  v_note text := NULLIF(btrim(coalesce(p_customer_note, '')), '');
  v_now timestamptz := now();
BEGIN
  IF nullif(trim(p_qr_token), '') IS NULL
    OR nullif(trim(p_device_fingerprint), '') IS NULL
    OR nullif(trim(p_display_name), '') IS NULL
    OR jsonb_typeof(p_priced_items) <> 'array'
    OR jsonb_array_length(p_priced_items) = 0 THEN
    RAISE EXCEPTION 'table order requires token, device, name and priced items';
  END IF;
  IF char_length(trim(p_display_name)) > 40 THEN
    RAISE EXCEPTION 'display name is too long';
  END IF;
  IF v_note IS NOT NULL AND char_length(v_note) > 500 THEN
    RAISE EXCEPTION 'customer note is too long';
  END IF;

  SELECT * INTO v_qr
  FROM public.qr_codes
  WHERE token = p_qr_token
    AND kind = 'table'
    AND is_active = true
    AND archived_at IS NULL
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'table QR is not available'; END IF;

  v_order_id := v_qr.current_order_id;
  IF v_order_id IS NOT NULL THEN
    SELECT * INTO v_order FROM public.orders WHERE id = v_order_id FOR UPDATE;
    IF NOT FOUND OR v_order.status IN ('paid', 'cancelled') THEN
      v_order_id := NULL;
    ELSIF v_order.status = 'pending_payment' THEN
      RAISE EXCEPTION 'table order no longer accepts new items';
    END IF;
  END IF;

  IF v_order_id IS NULL THEN
    INSERT INTO public.orders (
      tenant_id, status, subtotal, total, discount, paid_total, balance_due,
      source, order_type, qr_code_id, table_label, diner_count
    ) VALUES (
      v_qr.tenant_id, 'draft', 0, 0, 0, 0, 0,
      'qr_table', 'dine_in', v_qr.id, v_qr.label, 0
    ) RETURNING * INTO v_order;
    v_order_id := v_order.id;
    UPDATE public.qr_codes SET current_order_id = v_order_id, updated_at = v_now
    WHERE id = v_qr.id;
    INSERT INTO public.order_activity_log(order_id, actor_type, actor_label, action, payload)
    VALUES (v_order_id, 'system', 'sistema', 'order.created',
      jsonb_build_object('qr_code_id', v_qr.id, 'table_label', v_qr.label));
  END IF;

  SELECT d.id INTO v_device_id
  FROM public.order_devices d
  WHERE d.order_id = v_order_id AND d.device_fingerprint = p_device_fingerprint
  FOR UPDATE;

  v_is_new_contributor := v_device_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.order_items i
    WHERE i.order_id = v_order_id AND i.added_by_device_id = v_device_id
  );
  IF v_is_new_contributor AND v_qr.table_capacity IS NOT NULL THEN
    SELECT count(*) INTO v_participant_count
    FROM public.order_devices d
    WHERE d.order_id = v_order_id AND EXISTS (
      SELECT 1 FROM public.order_items i
      WHERE i.order_id = v_order_id AND i.added_by_device_id = d.id
    );
    IF v_participant_count >= v_qr.table_capacity THEN
      RAISE EXCEPTION 'table is full';
    END IF;
  END IF;

  IF v_device_id IS NULL THEN
    SELECT count(*) INTO v_device_index FROM public.order_devices d
    WHERE d.order_id = v_order_id;
    INSERT INTO public.order_devices(
      order_id, device_fingerprint, display_name, color_hex,
      joined_at, last_seen_at, created_at, updated_at, is_owner
    ) VALUES (
      v_order_id, p_device_fingerprint, trim(p_display_name),
      (ARRAY['#8b5cf6','#10b981','#f59e0b','#84cc16','#0891b2','#3b82f6'])[(v_device_index % 6) + 1],
      v_now, v_now, v_now, v_now, false
    ) RETURNING id INTO v_device_id;
  ELSE
    UPDATE public.order_devices
    SET display_name = trim(p_display_name), last_seen_at = v_now, updated_at = v_now
    WHERE id = v_device_id;
  END IF;

  INSERT INTO public.order_batches(tenant_id, order_id, device_id, source, customer_note)
  VALUES (v_qr.tenant_id, v_order_id, v_device_id, 'qr_table', v_note)
  RETURNING id INTO v_batch_id;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_priced_items)
  LOOP
    BEGIN
      v_product_id := (v_item->>'product_id')::uuid;
      v_quantity := (v_item->>'quantity')::integer;
      v_unit_price := (v_item->>'unit_price')::numeric;
      v_list_unit_price := (v_item->>'list_unit_price')::numeric;
      v_promotion_id := NULLIF(v_item->>'promotion_id', '')::uuid;
      v_offer_group_id := NULLIF(v_item->>'offer_group_id', '')::uuid;
    EXCEPTION WHEN others THEN
      RAISE EXCEPTION 'invalid priced table item';
    END;
    IF v_quantity IS NULL OR v_quantity <= 0 OR v_unit_price < 0
      OR v_list_unit_price < v_unit_price THEN
      RAISE EXCEPTION 'invalid priced table item values';
    END IF;

    SELECT * INTO v_product FROM public.products p
    WHERE p.id = v_product_id AND p.tenant_id = v_qr.tenant_id
      AND p.deleted_at IS NULL;
    IF NOT FOUND THEN RAISE EXCEPTION 'product is not available for this table'; END IF;
    IF abs(v_list_unit_price - v_product.price) >= 0.005 THEN
      RAISE EXCEPTION 'table item list price changed';
    END IF;
    IF v_promotion_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.promotions promotion
      JOIN public.tenants tenant ON tenant.id = promotion.tenant_id
      WHERE promotion.id = v_promotion_id
        AND promotion.tenant_id = v_qr.tenant_id
        AND promotion.status = 'active'
        AND 'onsite' = ANY(promotion.sales_channels)
        AND tenant.onsite_promotions_enabled = true
        AND (promotion.valid_from IS NULL OR promotion.valid_from <= v_now)
        AND (promotion.valid_until IS NULL OR promotion.valid_until >= v_now)
    ) THEN
      RAISE EXCEPTION 'table promotion is no longer available';
    END IF;

    INSERT INTO public.order_items(
      order_id, product_id, quantity, unit_price, list_unit_price, subtotal,
      promotion_id, offer_group_id, batch_id, added_by_device_id,
      added_by_member_id, is_shared, origin_table_label
    ) VALUES (
      v_order_id, v_product_id, v_quantity, v_unit_price, v_list_unit_price,
      round(v_unit_price * v_quantity, 2), v_promotion_id, v_offer_group_id,
      v_batch_id, v_device_id, NULL,
      coalesce((v_item->>'is_shared')::boolean, false), v_qr.label
    );
    v_added_total := v_added_total + round(v_unit_price * v_quantity, 2);
    v_added_items := v_added_items + 1;
  END LOOP;

  UPDATE public.orders
  SET status = 'in_progress',
      subtotal = coalesce(subtotal, 0) + v_added_total,
      total = coalesce(total, 0) + v_added_total,
      balance_due = coalesce(balance_due, 0) + v_added_total,
      diner_count = (
        SELECT count(*) FROM public.order_devices d
        WHERE d.order_id = v_order_id AND EXISTS (
          SELECT 1 FROM public.order_items i
          WHERE i.order_id = v_order_id AND i.added_by_device_id = d.id
        )
      ),
      updated_at = v_now
  WHERE id = v_order_id;

  INSERT INTO public.order_activity_log(order_id, actor_type, actor_id, actor_label, action, payload)
  VALUES (v_order_id, 'device', v_device_id, trim(p_display_name), 'item.added',
    jsonb_build_object('count', v_added_items, 'subtotal', v_added_total,
      'batch_id', v_batch_id, 'has_note', v_note IS NOT NULL));

  RETURN QUERY SELECT v_order_id, v_device_id, v_batch_id, v_added_items;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_table_order_v2(text, text, text, jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_table_order_v2(text, text, text, jsonb, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_table_order_v2(text, text, text, jsonb, text) TO service_role;

-- Keep the mature promotion/items transaction and add channel persistence in
-- the same database transaction. The legacy RPC remains available during the
-- rollout for older application versions.
CREATE OR REPLACE FUNCTION public.save_promotion_v2(
  p_promotion jsonb,
  p_items jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_channels text[];
BEGIN
  v_id := public.save_promotion(p_promotion, p_items);

  IF p_promotion ? 'sales_channels' THEN
    SELECT array_agg(DISTINCT channel ORDER BY channel)
    INTO v_channels
    FROM jsonb_array_elements_text(p_promotion->'sales_channels') AS channel;

    IF v_channels IS NULL OR cardinality(v_channels) = 0
      OR NOT (v_channels <@ ARRAY['public_store', 'onsite']::text[]) THEN
      RAISE EXCEPTION 'PROMOTION_CHANNELS_INVALID' USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.promotions
    SET sales_channels = v_channels, updated_at = now()
    WHERE id = v_id;
  END IF;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.save_promotion_v2(jsonb, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.save_promotion_v2(jsonb, jsonb) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_promotion_v2(jsonb, jsonb) TO service_role;
