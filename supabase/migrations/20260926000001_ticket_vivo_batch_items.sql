-- Ticket vivo writes a complete selection in one transaction.  Keeping this
-- in the database means a mobile reconnect cannot leave an order half-added.
CREATE OR REPLACE FUNCTION public.add_order_items_batch(
  p_order_id uuid,
  p_items jsonb
)
RETURNS TABLE (
  id uuid,
  product_id uuid,
  quantity integer,
  unit_price numeric,
  subtotal numeric
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_product public.products%ROWTYPE;
  v_inventory integer;
  v_quantity integer;
  v_retail numeric;
  v_unit_price numeric;
  v_is_wholesale boolean;
  v_savings numeric;
  v_item_id uuid;
  v_product_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Selecciona al menos un artículo';
  END IF;

  SELECT * INTO v_order
  FROM public.orders o
  WHERE o.id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orden no encontrada';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.tenant_memberships m
    WHERE m.tenant_id = v_order.tenant_id AND m.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF v_order.status NOT IN ('draft', 'assigned') THEN
    RAISE EXCEPTION 'La orden ya no permite agregar artículos';
  END IF;

  -- Aggregate repeated product ids before calculating stock and wholesale.
  FOR v_product_id, v_quantity IN
    SELECT
      (entry.value ->> 'product_id')::uuid,
      SUM((entry.value ->> 'quantity')::integer)::integer
    FROM jsonb_array_elements(p_items) AS entry(value)
    GROUP BY (entry.value ->> 'product_id')::uuid
  LOOP
    IF v_quantity IS NULL OR v_quantity < 1 OR v_quantity > 999 THEN
      RAISE EXCEPTION 'Cantidad inválida';
    END IF;

    SELECT * INTO v_product
    FROM public.products p
    WHERE p.id = v_product_id
      AND p.tenant_id = v_order.tenant_id
      AND p.deleted_at IS NULL
    FOR SHARE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Un artículo ya no está disponible';
    END IF;

    IF v_product.type = 'product' AND v_product.track_stock THEN
      SELECT pi.quantity INTO v_inventory
      FROM public.product_inventory pi
      WHERE pi.product_id = v_product.id
      FOR SHARE;
      IF COALESCE(v_inventory, 0) < v_quantity THEN
        RAISE EXCEPTION 'No hay existencias suficientes de %', v_product.name;
      END IF;
    END IF;

    v_retail := v_product.price;
    v_is_wholesale := v_product.wholesale_min_quantity IS NOT NULL
      AND v_product.wholesale_price IS NOT NULL
      AND v_quantity >= v_product.wholesale_min_quantity;
    v_unit_price := CASE WHEN v_is_wholesale THEN v_product.wholesale_price ELSE v_retail END;
    v_savings := CASE WHEN v_is_wholesale THEN (v_retail - v_unit_price) * v_quantity ELSE 0 END;

    INSERT INTO public.order_items (
      order_id, product_id, quantity, unit_price, subtotal, is_wholesale, wholesale_savings
    ) VALUES (
      v_order.id, v_product.id, v_quantity, v_unit_price,
      v_unit_price * v_quantity, v_is_wholesale, v_savings
    ) RETURNING order_items.id INTO v_item_id;

    id := v_item_id;
    product_id := v_product.id;
    quantity := v_quantity;
    unit_price := v_unit_price;
    subtotal := v_unit_price * v_quantity;
    RETURN NEXT;
  END LOOP;

  UPDATE public.orders o
  SET subtotal = COALESCE((SELECT SUM(oi.subtotal) FROM public.order_items oi WHERE oi.order_id = o.id), 0),
      total = GREATEST(0, COALESCE((SELECT SUM(oi.subtotal) FROM public.order_items oi WHERE oi.order_id = o.id), 0) - o.discount),
      updated_at = now()
  WHERE o.id = v_order.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_order_items_batch(uuid, jsonb) TO authenticated;
