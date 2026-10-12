-- Quick catalogue updates: receive stock, correct a physical count and change
-- a selling price without opening the full product editor.  Inventory changes
-- stay append-only in inventory_movements and price changes receive their own
-- audit record.

CREATE TABLE IF NOT EXISTS public.catalog_change_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('stock_received', 'stock_adjusted', 'price_changed')),
  stock_before integer,
  stock_after integer,
  price_before numeric(12, 2),
  price_after numeric(12, 2),
  note text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.catalog_change_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Catalog_change_events: tenant members read"
  ON public.catalog_change_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.tenant_memberships membership
      WHERE membership.tenant_id = catalog_change_events.tenant_id
        AND membership.user_id = auth.uid()
        AND membership.status = 'active'
    )
  );

CREATE INDEX IF NOT EXISTS catalog_change_events_product_created_idx
  ON public.catalog_change_events(product_id, created_at DESC);

CREATE INDEX IF NOT EXISTS catalog_change_events_tenant_created_idx
  ON public.catalog_change_events(tenant_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.apply_catalog_quick_update(
  p_product_id uuid,
  p_variant_id uuid DEFAULT NULL,
  p_stock_operation text DEFAULT 'receive',
  p_stock_quantity integer DEFAULT NULL,
  p_price numeric DEFAULT NULL,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
  v_has_variants boolean;
  v_track_stock boolean;
  v_current_stock integer;
  v_next_stock integer;
  v_current_price numeric(12, 2);
  v_next_price numeric(12, 2);
  v_stock_delta integer := 0;
  v_total_stock integer;
  v_min_price numeric(12, 2);
  v_event_type text;
  v_note text := NULLIF(btrim(COALESCE(p_note, '')), '');
BEGIN
  -- Lock the product first. It serializes a checkout stock change and a
  -- manual correction for this catalogue item in the same transaction.
  SELECT tenant_id, COALESCE(has_variants, false), track_stock, price
  INTO v_tenant_id, v_has_variants, v_track_stock, v_current_price
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

  IF p_stock_operation NOT IN ('receive', 'set') THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'INVALID_STOCK_OPERATION';
  END IF;

  IF p_price IS NOT NULL AND p_price < 0 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'INVALID_PRICE';
  END IF;

  IF p_stock_quantity IS NOT NULL AND p_stock_quantity < 0 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'INVALID_STOCK_QUANTITY';
  END IF;

  IF v_has_variants AND p_variant_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'VARIANT_REQUIRED';
  END IF;

  IF NOT v_has_variants AND p_variant_id IS NOT NULL THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'SIMPLE_PRODUCT_HAS_NO_VARIANT';
  END IF;

  IF p_stock_quantity IS NOT NULL AND NOT v_track_stock THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'STOCK_NOT_TRACKED';
  END IF;

  IF v_has_variants THEN
    SELECT stock, price
    INTO v_current_stock, v_current_price
    FROM public.product_variants
    WHERE id = p_variant_id
      AND product_id = p_product_id
      AND archived_at IS NULL
      AND is_active = true
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'VARIANT_NOT_FOUND';
    END IF;
  ELSE
    INSERT INTO public.product_inventory(product_id, quantity, updated_at)
    VALUES (p_product_id, 0, now())
    ON CONFLICT (product_id) DO NOTHING;

    SELECT quantity
    INTO v_current_stock
    FROM public.product_inventory
    WHERE product_id = p_product_id
    FOR UPDATE;
  END IF;

  v_next_stock := v_current_stock;
  IF p_stock_quantity IS NOT NULL THEN
    IF p_stock_operation = 'receive' THEN
      IF p_stock_quantity = 0 THEN
        RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'RECEIPT_QUANTITY_REQUIRED';
      END IF;
      v_next_stock := v_current_stock + p_stock_quantity;
      v_event_type := 'stock_received';
    ELSE
      v_next_stock := p_stock_quantity;
      v_event_type := 'stock_adjusted';
    END IF;
    v_stock_delta := v_next_stock - v_current_stock;
  END IF;

  v_next_price := COALESCE(p_price, v_current_price);

  IF v_has_variants THEN
    UPDATE public.product_variants
    SET stock = v_next_stock,
        price = v_next_price,
        updated_at = now()
    WHERE id = p_variant_id;

    SELECT COALESCE(sum(stock), 0), min(price)
    INTO v_total_stock, v_min_price
    FROM public.product_variants
    WHERE product_id = p_product_id
      AND archived_at IS NULL
      AND is_active = true;

    INSERT INTO public.product_inventory(product_id, quantity, updated_at)
    VALUES (p_product_id, v_total_stock, now())
    ON CONFLICT (product_id)
    DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = now();

    UPDATE public.products
    SET price = v_min_price,
        updated_at = now()
    WHERE id = p_product_id;
  ELSE
    IF p_stock_quantity IS NOT NULL THEN
      UPDATE public.product_inventory
      SET quantity = v_next_stock,
          updated_at = now()
      WHERE product_id = p_product_id;
    END IF;

    IF p_price IS NOT NULL THEN
      UPDATE public.products
      SET price = v_next_price,
          updated_at = now()
      WHERE id = p_product_id;
    END IF;
  END IF;

  IF p_stock_quantity IS NOT NULL AND v_stock_delta <> 0 THEN
    INSERT INTO public.inventory_movements(
      product_id, product_variant_id, type, quantity, reference, created_by
    ) VALUES (
      p_product_id, p_variant_id, v_event_type, v_stock_delta,
      'quick_catalog_update', auth.uid()
    );

    INSERT INTO public.catalog_change_events(
      tenant_id, product_id, product_variant_id, event_type,
      stock_before, stock_after, note, created_by
    ) VALUES (
      v_tenant_id, p_product_id, p_variant_id, v_event_type,
      v_current_stock, v_next_stock, v_note, auth.uid()
    );
  END IF;

  IF p_price IS NOT NULL AND v_current_price IS DISTINCT FROM v_next_price THEN
    INSERT INTO public.catalog_change_events(
      tenant_id, product_id, product_variant_id, event_type,
      price_before, price_after, note, created_by
    ) VALUES (
      v_tenant_id, p_product_id, p_variant_id, 'price_changed',
      v_current_price, v_next_price, v_note, auth.uid()
    );
  END IF;

  RETURN jsonb_build_object(
    'product_id', p_product_id,
    'variant_id', p_variant_id,
    'stock_before', v_current_stock,
    'stock_after', v_next_stock,
    'price_before', v_current_price,
    'price_after', v_next_price,
    'has_variants', v_has_variants
  );
END;
$$;

REVOKE ALL ON FUNCTION public.apply_catalog_quick_update(uuid, uuid, text, integer, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_catalog_quick_update(uuid, uuid, text, integer, numeric, text) TO authenticated;
