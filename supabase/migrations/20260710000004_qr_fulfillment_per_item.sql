-- Per-product-line (order_items) preparation state for QR tables.
--
-- Until now `order_devices.fulfillment_status` was a SINGLE state for the
-- whole person's order (20260710000002). That doesn't model the real case:
-- a person can order a fast item (a drink) and a slow one (a service) in the
-- same batch — one can be ready while the other isn't. This migration moves
-- the source of truth one level deeper, to the LINE ITEM:
--   received    -> this product line was received, not started
--   in_progress -> staff is working on this line
--   ready       -> this line is done
--
-- `order_devices.fulfillment_status` is KEPT as a DERIVED summary (same
-- pattern as 20260710000002 derives `orders` from `order_devices`), so every
-- existing reader (payment guard, admin view, tracker) keeps working
-- unchanged — the cascade is now order_items -> order_devices -> orders.
--
-- `order_items.kitchen_status` (pending/in_kitchen/ready/delivered/cancelled)
-- was legacy, never read by the app (see 20260710000002's note), and its
-- values/name are restaurant-specific — violates the project's neutral,
-- multi-business copy rule. This migration RENAMES it to
-- `fulfillment_status` with the same 3 neutral states as every other level,
-- rather than adding a parallel column.

-- 1. Rename + redefine the column ------------------------------------------------
ALTER TABLE public.order_items
  RENAME COLUMN kitchen_status TO fulfillment_status;

ALTER TABLE public.order_items
  ALTER COLUMN fulfillment_status SET DEFAULT 'received';

ALTER TABLE public.order_items
  DROP CONSTRAINT IF EXISTS order_items_kitchen_status_check;

UPDATE public.order_items
SET fulfillment_status = 'received'
WHERE fulfillment_status NOT IN ('received', 'in_progress', 'ready');

ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_fulfillment_status_check
  CHECK (fulfillment_status IN ('received', 'in_progress', 'ready'));

-- 2. Derivation: recompute a device's fulfillment_status from its items ----------
-- Same rule as recompute_order_fulfillment, one level down: all lines ready ->
-- device ready; any line advanced past received -> device in_progress; else
-- received. A device with zero item rows (shouldn't happen once items are
-- attributed, but defensive) keeps its own column value.
CREATE OR REPLACE FUNCTION public.recompute_device_fulfillment(p_device_id uuid)
RETURNS void AS $$
DECLARE
  total_items integer;
  ready_items integer;
  advanced_items integer;
  new_status text;
BEGIN
  SELECT
    count(*),
    count(*) FILTER (WHERE fulfillment_status = 'ready'),
    count(*) FILTER (WHERE fulfillment_status <> 'received')
  INTO total_items, ready_items, advanced_items
  FROM public.order_items
  WHERE added_by_device_id = p_device_id;

  IF total_items = 0 THEN
    RETURN;
  END IF;

  IF ready_items = total_items THEN
    new_status := 'ready';
  ELSIF advanced_items > 0 THEN
    new_status := 'in_progress';
  ELSE
    new_status := 'received';
  END IF;

  UPDATE public.order_devices
  SET fulfillment_status = new_status,
      updated_at = now()
  WHERE id = p_device_id
    AND fulfillment_status IS DISTINCT FROM new_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Keep the device summary in sync automatically whenever a line changes ------
-- This UPDATE on order_devices re-fires the existing
-- order_devices_recompute_fulfillment trigger (20260710000002), which derives
-- orders.fulfillment_status — the cascade is automatic, no changes needed
-- to that trigger.
CREATE OR REPLACE FUNCTION public.trg_recompute_device_fulfillment()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    IF OLD.added_by_device_id IS NOT NULL THEN
      PERFORM public.recompute_device_fulfillment(OLD.added_by_device_id);
    END IF;
    RETURN OLD;
  END IF;
  IF NEW.added_by_device_id IS NOT NULL THEN
    PERFORM public.recompute_device_fulfillment(NEW.added_by_device_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS order_items_recompute_device_fulfillment ON public.order_items;
CREATE TRIGGER order_items_recompute_device_fulfillment
  AFTER INSERT OR UPDATE OF fulfillment_status OR DELETE
  ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_recompute_device_fulfillment();

-- 4. Backfill: seed item state from their device's CURRENT value, then derive.
-- Existing open orders that were already 'ready'/'in_progress' at the device
-- level shouldn't regress — every line under a ready/in_progress device
-- starts at that same state.
UPDATE public.order_items i
SET fulfillment_status = d.fulfillment_status
FROM public.order_devices d
WHERE i.added_by_device_id = d.id
  AND d.fulfillment_status IN ('in_progress', 'ready');
