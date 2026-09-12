-- Per-person (per-device) fulfillment state for QR tables.
--
-- Until now `orders.fulfillment_status` was a SINGLE state for the whole table
-- (20260710000001). That doesn't model the real case: with N people at a table,
-- one person's order can be ready while another's is still in progress.
--
-- This migration moves the source of truth to the PERSON (order_devices row):
--   received    -> the person's items were received, not started
--   in_progress -> staff is working on that person's items
--   ready       -> that person's items are done; they can pay their part
--
-- `orders.fulfillment_status` is KEPT as a DERIVED summary so all existing
-- readers (payment guard, pulse, bill, tracker) keep working unchanged:
--   ready       -> ALL active devices are ready (or there are no devices yet)
--   in_progress -> at least one device advanced past received
--   received    -> nobody advanced yet
--
-- Neutral, multi-business copy (CLAUDE.md §6): same 3 states as the order-level
-- lifecycle. NOTE: order_items.kitchen_status (pending/in_kitchen/…) is legacy,
-- kitchen-specific, and intentionally NOT used here — it stays untouched.

-- 1. Per-device preparation state ------------------------------------------------
ALTER TABLE public.order_devices
  ADD COLUMN IF NOT EXISTS fulfillment_status text NOT NULL DEFAULT 'received';

ALTER TABLE public.order_devices
  DROP CONSTRAINT IF EXISTS order_devices_fulfillment_status_check;

ALTER TABLE public.order_devices
  ADD CONSTRAINT order_devices_fulfillment_status_check
  CHECK (fulfillment_status IN ('received', 'in_progress', 'ready'));

-- 2. Derivation: recompute orders.fulfillment_status from its devices ------------
-- Rule (see header): all ready -> ready; any past received -> in_progress;
-- else received. An order with zero device rows keeps its own column value
-- (staff can still use the whole-table shortcut before anyone connects).
CREATE OR REPLACE FUNCTION public.recompute_order_fulfillment(p_order_id uuid)
RETURNS void AS $$
DECLARE
  total_devices integer;
  ready_devices integer;
  advanced_devices integer;
  new_status text;
BEGIN
  SELECT
    count(*),
    count(*) FILTER (WHERE fulfillment_status = 'ready'),
    count(*) FILTER (WHERE fulfillment_status <> 'received')
  INTO total_devices, ready_devices, advanced_devices
  FROM public.order_devices
  WHERE order_id = p_order_id;

  -- No devices yet: leave the order-level column as-is (whole-table shortcut).
  IF total_devices = 0 THEN
    RETURN;
  END IF;

  IF ready_devices = total_devices THEN
    new_status := 'ready';
  ELSIF advanced_devices > 0 THEN
    new_status := 'in_progress';
  ELSE
    new_status := 'received';
  END IF;

  UPDATE public.orders
  SET fulfillment_status = new_status,
      updated_at = now()
  WHERE id = p_order_id
    AND fulfillment_status IS DISTINCT FROM new_status
    AND status NOT IN ('paid', 'cancelled');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Keep the order summary in sync automatically whenever a device changes ------
CREATE OR REPLACE FUNCTION public.trg_recompute_order_fulfillment()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    PERFORM public.recompute_order_fulfillment(OLD.order_id);
    RETURN OLD;
  END IF;
  PERFORM public.recompute_order_fulfillment(NEW.order_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS order_devices_recompute_fulfillment ON public.order_devices;
CREATE TRIGGER order_devices_recompute_fulfillment
  AFTER INSERT OR UPDATE OF fulfillment_status OR DELETE
  ON public.order_devices
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_recompute_order_fulfillment();

-- 4. Backfill: seed device state from the current order-level value, then derive.
-- Existing open orders that were already 'ready'/'in_progress' shouldn't regress.
UPDATE public.order_devices d
SET fulfillment_status = o.fulfillment_status
FROM public.orders o
WHERE d.order_id = o.id
  AND o.status NOT IN ('paid', 'cancelled')
  AND o.fulfillment_status IN ('received', 'in_progress', 'ready');
