-- Stable variant editing and atomic stock handling per size/color combination.

ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

ALTER TABLE public.inventory_movements
  ADD COLUMN IF NOT EXISTS product_variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL;

WITH ranked AS (
  SELECT id, (row_number() OVER (PARTITION BY product_id ORDER BY created_at, id) - 1)::integer AS position
  FROM public.product_variants
)
UPDATE public.product_variants variant
SET display_order = ranked.position
FROM ranked
WHERE variant.id = ranked.id
  AND variant.display_order = 0;

CREATE INDEX IF NOT EXISTS product_variants_active_order_idx
  ON public.product_variants(product_id, archived_at, display_order);

CREATE INDEX IF NOT EXISTS product_variants_stock_idx
  ON public.product_variants(product_id, is_active, stock)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS inventory_movements_variant_idx
  ON public.inventory_movements(product_variant_id, created_at DESC)
  WHERE product_variant_id IS NOT NULL;

-- A product may appear more than once in the same cart when each row points
-- to a different size/color. NULLS NOT DISTINCT keeps simple products unique.
ALTER TABLE public.public_cart_items
  DROP CONSTRAINT IF EXISTS public_cart_items_cart_id_product_id_key;
ALTER TABLE public.public_cart_items
  DROP CONSTRAINT IF EXISTS public_cart_items_cart_product_variant_key;
ALTER TABLE public.public_cart_items
  ADD CONSTRAINT public_cart_items_cart_product_variant_key
  UNIQUE NULLS NOT DISTINCT (cart_id, product_id, product_variant_id);

CREATE OR REPLACE FUNCTION public.save_product_commerce_details(
  p_product_id uuid,
  p_has_variants boolean,
  p_material_info text DEFAULT NULL,
  p_care_instructions text DEFAULT NULL,
  p_size_guide text DEFAULT NULL,
  p_variants jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
  v_variant jsonb;
  v_variant_id uuid;
  v_existing_variant_id uuid;
  v_size_group_id uuid;
  v_color_group_id uuid;
  v_size_value_id uuid;
  v_color_value_id uuid;
  v_size text;
  v_color text;
  v_sku text;
  v_selection_key text;
  v_seen_ids uuid[] := ARRAY[]::uuid[];
  v_position integer := 0;
  v_active_count integer;
  v_total_stock integer;
  v_min_price numeric(12,2);
BEGIN
  SELECT tenant_id
  INTO v_tenant_id
  FROM public.products
  WHERE id = p_product_id
    AND deleted_at IS NULL
  FOR UPDATE;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'PRODUCT_NOT_FOUND';
  END IF;

  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.tenant_memberships membership
    WHERE membership.tenant_id = v_tenant_id
      AND membership.user_id = auth.uid()
      AND membership.status = 'active'
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'PRODUCT_WRITE_FORBIDDEN';
  END IF;

  UPDATE public.products
  SET has_variants = COALESCE(p_has_variants, false),
      material_info = NULLIF(btrim(COALESCE(p_material_info, '')), ''),
      care_instructions = NULLIF(btrim(COALESCE(p_care_instructions, '')), ''),
      size_guide = CASE
        WHEN COALESCE(p_has_variants, false) THEN NULLIF(btrim(COALESCE(p_size_guide, '')), '')
        ELSE NULL
      END,
      updated_at = now()
  WHERE id = p_product_id;

  IF NOT COALESCE(p_has_variants, false) THEN
    UPDATE public.product_variants
    SET is_active = false,
        archived_at = COALESCE(archived_at, now()),
        updated_at = now()
    WHERE product_id = p_product_id
      AND archived_at IS NULL;

    RETURN jsonb_build_object('has_variants', false, 'variant_count', 0);
  END IF;

  IF jsonb_typeof(COALESCE(p_variants, '[]'::jsonb)) <> 'array'
     OR jsonb_array_length(COALESCE(p_variants, '[]'::jsonb)) = 0 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'VARIANTS_REQUIRED';
  END IF;

  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_variants) item
    WHERE btrim(COALESCE(item->>'size', '')) <> ''
  ) THEN
    INSERT INTO public.product_option_groups(product_id, name, display_order, updated_at)
    VALUES (p_product_id, 'Talla', 0, now())
    ON CONFLICT (product_id, name)
    DO UPDATE SET display_order = EXCLUDED.display_order, updated_at = now()
    RETURNING id INTO v_size_group_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_variants) item
    WHERE btrim(COALESCE(item->>'color', '')) <> ''
  ) THEN
    INSERT INTO public.product_option_groups(product_id, name, display_order, updated_at)
    VALUES (p_product_id, 'Color', 1, now())
    ON CONFLICT (product_id, name)
    DO UPDATE SET display_order = EXCLUDED.display_order, updated_at = now()
    RETURNING id INTO v_color_group_id;
  END IF;

  FOR v_variant IN SELECT value FROM jsonb_array_elements(p_variants)
  LOOP
    v_size := btrim(COALESCE(v_variant->>'size', ''));
    v_color := btrim(COALESCE(v_variant->>'color', ''));
    v_sku := NULLIF(btrim(COALESCE(v_variant->>'sku', '')), '');

    IF v_size = '' AND v_color = '' THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'VARIANT_OPTION_REQUIRED';
    END IF;

    IF COALESCE((v_variant->>'price')::numeric, -1) < 0
       OR COALESCE((v_variant->>'stock')::integer, -1) < 0 THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'VARIANT_PRICE_STOCK_INVALID';
    END IF;

    v_selection_key := concat_ws(
      ' / ',
      CASE WHEN v_size <> '' THEN 'Talla:' || v_size END,
      CASE WHEN v_color <> '' THEN 'Color:' || v_color END
    );

    IF EXISTS (
      SELECT 1
      FROM public.product_variants duplicate
      WHERE duplicate.product_id = p_product_id
        AND lower(duplicate.selection_key) = lower(v_selection_key)
        AND (
          NULLIF(v_variant->>'id', '') IS NULL
          OR duplicate.id <> (v_variant->>'id')::uuid
        )
        AND duplicate.id = ANY(v_seen_ids)
    ) THEN
      RAISE EXCEPTION USING ERRCODE = '23505', MESSAGE = 'VARIANT_DUPLICATE';
    END IF;

    v_variant_id := NULL;
    IF NULLIF(v_variant->>'id', '') IS NOT NULL THEN
      SELECT id INTO v_variant_id
      FROM public.product_variants
      WHERE id = (v_variant->>'id')::uuid
        AND product_id = p_product_id;

      IF v_variant_id IS NULL THEN
        RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'VARIANT_NOT_FOUND';
      END IF;
    ELSE
      SELECT id INTO v_existing_variant_id
      FROM public.product_variants
      WHERE product_id = p_product_id
        AND lower(selection_key) = lower(v_selection_key)
      LIMIT 1;
      v_variant_id := v_existing_variant_id;
    END IF;

    IF v_sku IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.product_variants existing
      WHERE existing.product_id = p_product_id
        AND lower(existing.sku) = lower(v_sku)
        AND existing.id IS DISTINCT FROM v_variant_id
    ) THEN
      RAISE EXCEPTION USING ERRCODE = '23505', MESSAGE = 'VARIANT_SKU_DUPLICATE';
    END IF;

    IF v_variant_id IS NULL THEN
      INSERT INTO public.product_variants(
        product_id, sku, price, stock, track_stock, image_url,
        is_active, selection_key, display_order, archived_at
      ) VALUES (
        p_product_id,
        v_sku,
        (v_variant->>'price')::numeric,
        (v_variant->>'stock')::integer,
        true,
        NULLIF(btrim(COALESCE(v_variant->>'image_url', '')), ''),
        COALESCE((v_variant->>'is_active')::boolean, true),
        v_selection_key,
        v_position,
        NULL
      )
      RETURNING id INTO v_variant_id;
    ELSE
      UPDATE public.product_variants
      SET sku = v_sku,
          price = (v_variant->>'price')::numeric,
          stock = (v_variant->>'stock')::integer,
          track_stock = true,
          image_url = NULLIF(btrim(COALESCE(v_variant->>'image_url', '')), ''),
          is_active = COALESCE((v_variant->>'is_active')::boolean, true),
          selection_key = v_selection_key,
          display_order = v_position,
          archived_at = NULL,
          updated_at = now()
      WHERE id = v_variant_id;
    END IF;

    DELETE FROM public.product_variant_values
    WHERE variant_id = v_variant_id;

    IF v_size <> '' THEN
      SELECT id INTO v_size_value_id
      FROM public.product_option_values
      WHERE option_group_id = v_size_group_id
        AND lower(label) = lower(v_size)
      LIMIT 1;

      IF v_size_value_id IS NULL THEN
        INSERT INTO public.product_option_values(option_group_id, label, display_order)
        VALUES (v_size_group_id, v_size, v_position)
        RETURNING id INTO v_size_value_id;
      END IF;

      INSERT INTO public.product_variant_values(variant_id, option_value_id)
      VALUES (v_variant_id, v_size_value_id);
    END IF;

    IF v_color <> '' THEN
      SELECT id INTO v_color_value_id
      FROM public.product_option_values
      WHERE option_group_id = v_color_group_id
        AND lower(label) = lower(v_color)
      LIMIT 1;

      IF v_color_value_id IS NULL THEN
        INSERT INTO public.product_option_values(option_group_id, label, display_order)
        VALUES (
          v_color_group_id,
          v_color,
          v_position
        )
        RETURNING id INTO v_color_value_id;
      END IF;

      INSERT INTO public.product_variant_values(variant_id, option_value_id)
      VALUES (v_variant_id, v_color_value_id);
    END IF;

    v_seen_ids := array_append(v_seen_ids, v_variant_id);
    v_position := v_position + 1;
  END LOOP;

  UPDATE public.product_variants
  SET is_active = false,
      archived_at = COALESCE(archived_at, now()),
      updated_at = now()
  WHERE product_id = p_product_id
    AND NOT (id = ANY(v_seen_ids));

  SELECT count(*), COALESCE(sum(stock), 0), min(price)
  INTO v_active_count, v_total_stock, v_min_price
  FROM public.product_variants
  WHERE product_id = p_product_id
    AND archived_at IS NULL
    AND is_active = true;

  IF v_active_count = 0 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'ACTIVE_VARIANT_REQUIRED';
  END IF;

  UPDATE public.products
  SET price = v_min_price,
      track_stock = true,
      updated_at = now()
  WHERE id = p_product_id;

  INSERT INTO public.product_inventory(product_id, quantity, updated_at)
  VALUES (p_product_id, v_total_stock, now())
  ON CONFLICT (product_id)
  DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = now();

  RETURN jsonb_build_object(
    'has_variants', true,
    'variant_count', v_active_count,
    'total_stock', v_total_stock,
    'minimum_price', v_min_price
  );
END;
$$;

REVOKE ALL ON FUNCTION public.save_product_commerce_details(uuid, boolean, text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_product_commerce_details(uuid, boolean, text, text, text, jsonb) TO authenticated;

-- Keep the existing simple-product inventory path, but use the selected
-- variant as the authoritative stock row whenever an order item has one.
CREATE OR REPLACE FUNCTION public.handle_order_inventory()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item RECORD;
  v_available integer;
BEGIN
  -- Inventory belongs to the financial confirmation, not to the operational
  -- stage. A verified bank transfer remains pending acceptance, but it has
  -- already been paid and must reserve/decrement the exact variant once.
  IF (NEW.status = 'paid' OR NEW.payment_verification_status = 'approved')
     AND NOT (OLD.status = 'paid' OR OLD.payment_verification_status = 'approved') THEN
    FOR v_item IN
      SELECT oi.product_id, oi.product_variant_id, oi.quantity, p.track_stock, p.type, p.name
      FROM public.order_items oi
      JOIN public.products p ON p.id = oi.product_id
      WHERE oi.order_id = NEW.id
        AND p.track_stock = true
        AND p.type = 'product'
    LOOP
      IF v_item.product_variant_id IS NOT NULL THEN
        UPDATE public.product_variants
        SET stock = stock - v_item.quantity,
            updated_at = now()
        WHERE id = v_item.product_variant_id
          AND product_id = v_item.product_id
          AND stock >= v_item.quantity
        RETURNING stock INTO v_available;

        IF NOT FOUND THEN
          RAISE EXCEPTION USING
            ERRCODE = 'P0001',
            MESSAGE = 'STOCK_INSUFFICIENT',
            DETAIL = format('product_id=%s; variant_id=%s; product=%s; requested=%s', v_item.product_id, v_item.product_variant_id, v_item.name, v_item.quantity);
        END IF;

        UPDATE public.product_inventory
        SET quantity = (
              SELECT COALESCE(sum(stock), 0)
              FROM public.product_variants
              WHERE product_id = v_item.product_id
                AND archived_at IS NULL
                AND is_active = true
            ),
            updated_at = now()
        WHERE product_id = v_item.product_id;
      ELSE
        UPDATE public.product_inventory
        SET quantity = quantity - v_item.quantity,
            updated_at = now()
        WHERE product_id = v_item.product_id
          AND quantity >= v_item.quantity
        RETURNING quantity INTO v_available;

        IF NOT FOUND THEN
          RAISE EXCEPTION USING
            ERRCODE = 'P0001',
            MESSAGE = 'STOCK_INSUFFICIENT',
            DETAIL = format('product_id=%s; product=%s; requested=%s', v_item.product_id, v_item.name, v_item.quantity);
        END IF;
      END IF;

      INSERT INTO public.inventory_movements(
        product_id, product_variant_id, type, quantity, reference, reference_id, created_by
      ) VALUES (
        v_item.product_id, v_item.product_variant_id, 'sale', -v_item.quantity, 'order', NEW.id, NEW.completed_by
      );
    END LOOP;
  END IF;

  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled'
     AND (OLD.status = 'paid' OR OLD.payment_verification_status = 'approved') THEN
    FOR v_item IN
      SELECT oi.product_id, oi.product_variant_id, oi.quantity, p.track_stock, p.type
      FROM public.order_items oi
      JOIN public.products p ON p.id = oi.product_id
      WHERE oi.order_id = NEW.id
        AND p.track_stock = true
        AND p.type = 'product'
    LOOP
      IF v_item.product_variant_id IS NOT NULL THEN
        UPDATE public.product_variants
        SET stock = stock + v_item.quantity,
            updated_at = now()
        WHERE id = v_item.product_variant_id
          AND product_id = v_item.product_id;

        UPDATE public.product_inventory
        SET quantity = (
              SELECT COALESCE(sum(stock), 0)
              FROM public.product_variants
              WHERE product_id = v_item.product_id
                AND archived_at IS NULL
                AND is_active = true
            ),
            updated_at = now()
        WHERE product_id = v_item.product_id;
      ELSE
        UPDATE public.product_inventory
        SET quantity = quantity + v_item.quantity,
            updated_at = now()
        WHERE product_id = v_item.product_id;
      END IF;

      INSERT INTO public.inventory_movements(
        product_id, product_variant_id, type, quantity, reference, reference_id, created_by
      ) VALUES (
        v_item.product_id, v_item.product_variant_id, 'cancelled_sale', v_item.quantity, 'order', NEW.id, auth.uid()
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS order_inventory_trigger ON public.orders;
CREATE TRIGGER order_inventory_trigger
  AFTER UPDATE OF status, payment_verification_status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_order_inventory();
