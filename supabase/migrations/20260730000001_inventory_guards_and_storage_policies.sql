-- Inventory must never become negative. Existing negative values represent
-- unavailable stock, so correct them to zero and leave an auditable movement.
WITH negative_inventory AS (
  SELECT product_id, quantity
  FROM public.product_inventory
  WHERE quantity < 0
), corrected AS (
  UPDATE public.product_inventory inventory
  SET quantity = 0,
      updated_at = now()
  FROM negative_inventory negative
  WHERE inventory.product_id = negative.product_id
  RETURNING inventory.product_id, negative.quantity AS previous_quantity
)
INSERT INTO public.inventory_movements (
  product_id,
  type,
  quantity,
  reference
)
SELECT
  product_id,
  'inventory_correction',
  -previous_quantity,
  'negative_stock_corrected_to_zero'
FROM corrected;

ALTER TABLE public.product_inventory
  DROP CONSTRAINT IF EXISTS product_inventory_quantity_nonnegative;

ALTER TABLE public.product_inventory
  ADD CONSTRAINT product_inventory_quantity_nonnegative CHECK (quantity >= 0);

-- The former trigger subtracted blindly when payment completed. This guarded
-- update is atomic: simultaneous payments cannot push stock below zero.
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
  IF NEW.status = 'paid' AND OLD.status <> 'paid' THEN
    FOR v_item IN
      SELECT oi.product_id, oi.quantity, p.track_stock, p.type, p.name
      FROM public.order_items oi
      JOIN public.products p ON p.id = oi.product_id
      WHERE oi.order_id = NEW.id
        AND p.track_stock = true
        AND p.type = 'product'
    LOOP
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
          DETAIL = format(
            'product_id=%s; product=%s; requested=%s',
            v_item.product_id,
            v_item.name,
            v_item.quantity
          );
      END IF;

      INSERT INTO public.inventory_movements (
        product_id,
        type,
        quantity,
        reference,
        reference_id,
        created_by
      ) VALUES (
        v_item.product_id,
        'sale',
        -v_item.quantity,
        'order',
        NEW.id,
        NEW.completed_by
      );
    END LOOP;
  END IF;

  IF NEW.status = 'cancelled' AND OLD.status = 'paid' THEN
    FOR v_item IN
      SELECT oi.product_id, oi.quantity, p.track_stock, p.type
      FROM public.order_items oi
      JOIN public.products p ON p.id = oi.product_id
      WHERE oi.order_id = NEW.id
        AND p.track_stock = true
        AND p.type = 'product'
    LOOP
      UPDATE public.product_inventory
      SET quantity = quantity + v_item.quantity,
          updated_at = now()
      WHERE product_id = v_item.product_id;

      INSERT INTO public.inventory_movements (
        product_id,
        type,
        quantity,
        reference,
        reference_id,
        created_by
      ) VALUES (
        v_item.product_id,
        'cancelled_sale',
        v_item.quantity,
        'order',
        NEW.id,
        auth.uid()
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Storage policies must not traverse tenant_memberships directly: its RLS can
-- recurse and makes Storage answer 503/DatabaseInvalidObjectDefinition.
CREATE OR REPLACE FUNCTION public.is_tenant_member(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_memberships
    WHERE tenant_id = p_tenant_id
      AND user_id = auth.uid()
  );
$$;

DROP POLICY IF EXISTS "Product images: tenant members can upload" ON storage.objects;
DROP POLICY IF EXISTS "Product images: tenant members can update" ON storage.objects;
DROP POLICY IF EXISTS "Product images: tenant members can delete" ON storage.objects;

CREATE POLICY "Product images: tenant members can upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND public.is_tenant_member(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Product images: tenant members can update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'product-images'
  AND public.is_tenant_member(((storage.foldername(name))[1])::uuid)
)
WITH CHECK (
  bucket_id = 'product-images'
  AND public.is_tenant_member(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Product images: tenant members can delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'product-images'
  AND public.is_tenant_member(((storage.foldername(name))[1])::uuid)
);
