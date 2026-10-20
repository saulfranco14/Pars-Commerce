-- `submit_table_order` returns `order_id`, which shares a namespace with
-- several table columns inside PL/pgSQL. The original function used
-- unqualified column references, so PostgreSQL raised "order_id is ambiguous"
-- when the public table-items endpoint sent its first real order.
--
-- This migration deliberately does not set any PostgreSQL runtime parameter.
-- Every conflicting reference is qualified with its table alias (`d.order_id`
-- or `i.order_id`), which works with the standard Supabase migration role.

CREATE OR REPLACE FUNCTION public.submit_table_order(
  p_qr_token text,
  p_device_fingerprint text,
  p_display_name text,
  p_items jsonb
)
RETURNS TABLE(order_id uuid, device_id uuid, added_items integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_qr public.qr_codes%ROWTYPE;
  v_order public.orders%ROWTYPE;
  v_order_id uuid;
  v_device_id uuid;
  v_device_index integer;
  v_participant_count integer;
  v_is_new_contributor boolean;
  v_item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_price numeric(12,2);
  v_added_subtotal numeric(12,2) := 0;
  v_added_items integer := 0;
  v_now timestamptz := now();
BEGIN
  IF nullif(trim(p_qr_token), '') IS NULL
    OR nullif(trim(p_device_fingerprint), '') IS NULL
    OR nullif(trim(p_display_name), '') IS NULL
    OR jsonb_typeof(p_items) <> 'array'
    OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'table order requires token, device, name and items';
  END IF;

  IF char_length(trim(p_display_name)) > 40 THEN
    RAISE EXCEPTION 'display name is too long';
  END IF;

  SELECT * INTO v_qr
  FROM public.qr_codes
  WHERE token = p_qr_token
    AND kind = 'table'
    AND is_active = true
    AND archived_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'table QR is not available';
  END IF;

  v_order_id := v_qr.current_order_id;
  IF v_order_id IS NOT NULL THEN
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = v_order_id
    FOR UPDATE;

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
    )
    RETURNING * INTO v_order;

    v_order_id := v_order.id;
    UPDATE public.qr_codes
    SET current_order_id = v_order_id, updated_at = v_now
    WHERE id = v_qr.id;

    INSERT INTO public.order_activity_log (
      order_id, actor_type, actor_label, action, payload
    ) VALUES (
      v_order_id, 'system', 'sistema', 'order.created',
      jsonb_build_object('qr_code_id', v_qr.id, 'table_label', v_qr.label)
    );
  END IF;

  SELECT d.id INTO v_device_id
  FROM public.order_devices AS d
  WHERE d.order_id = v_order_id
    AND d.device_fingerprint = p_device_fingerprint
  FOR UPDATE;

  v_is_new_contributor := v_device_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.order_items AS i
    WHERE i.order_id = v_order_id AND i.added_by_device_id = v_device_id
  );

  IF v_is_new_contributor AND v_qr.table_capacity IS NOT NULL THEN
    SELECT count(*) INTO v_participant_count
    FROM public.order_devices AS d
    WHERE d.order_id = v_order_id
      AND EXISTS (
        SELECT 1 FROM public.order_items AS i
        WHERE i.order_id = v_order_id AND i.added_by_device_id = d.id
      );

    IF v_participant_count >= v_qr.table_capacity THEN
      RAISE EXCEPTION 'table is full';
    END IF;
  END IF;

  IF v_device_id IS NULL THEN
    SELECT count(*) INTO v_device_index
    FROM public.order_devices AS d
    WHERE d.order_id = v_order_id;

    INSERT INTO public.order_devices (
      order_id, device_fingerprint, display_name, color_hex,
      joined_at, last_seen_at, created_at, updated_at, is_owner
    ) VALUES (
      v_order_id,
      p_device_fingerprint,
      trim(p_display_name),
      (ARRAY['#8b5cf6', '#10b981', '#f59e0b', '#84cc16', '#0891b2', '#3b82f6'])[(v_device_index % 6) + 1],
      v_now, v_now, v_now, v_now, false
    )
    RETURNING id INTO v_device_id;
  ELSE
    UPDATE public.order_devices
    SET display_name = trim(p_display_name), last_seen_at = v_now, updated_at = v_now
    WHERE id = v_device_id;
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    BEGIN
      v_product_id := (v_item ->> 'product_id')::uuid;
      v_quantity := (v_item ->> 'quantity')::integer;
    EXCEPTION WHEN others THEN
      RAISE EXCEPTION 'invalid table item';
    END;

    IF v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'invalid table item quantity';
    END IF;

    SELECT price INTO v_price
    FROM public.products
    WHERE id = v_product_id
      AND tenant_id = v_qr.tenant_id
      AND deleted_at IS NULL;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'product is not available for this table';
    END IF;

    INSERT INTO public.order_items (
      order_id, product_id, quantity, unit_price, subtotal,
      added_by_device_id, added_by_member_id, is_shared, origin_table_label
    ) VALUES (
      v_order_id, v_product_id, v_quantity, v_price, v_price * v_quantity,
      v_device_id, NULL, coalesce((v_item ->> 'is_shared')::boolean, false), v_qr.label
    );

    v_added_subtotal := v_added_subtotal + (v_price * v_quantity);
    v_added_items := v_added_items + 1;
  END LOOP;

  UPDATE public.orders
  SET status = 'in_progress',
      subtotal = coalesce(subtotal, 0) + v_added_subtotal,
      total = coalesce(total, 0) + v_added_subtotal,
      balance_due = coalesce(balance_due, 0) + v_added_subtotal,
      diner_count = (
        SELECT count(*) FROM public.order_devices AS d
        WHERE d.order_id = v_order_id
          AND EXISTS (
            SELECT 1 FROM public.order_items AS i
            WHERE i.order_id = v_order_id AND i.added_by_device_id = d.id
          )
      ),
      updated_at = v_now
  WHERE id = v_order_id;

  INSERT INTO public.order_activity_log (
    order_id, actor_type, actor_id, actor_label, action, payload
  ) VALUES (
    v_order_id, 'device', v_device_id, trim(p_display_name), 'item.added',
    jsonb_build_object('count', v_added_items, 'subtotal', v_added_subtotal)
  );

  RETURN QUERY SELECT v_order_id, v_device_id, v_added_items;
END;
$$;
