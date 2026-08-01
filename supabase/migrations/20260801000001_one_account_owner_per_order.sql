-- The customer who opened a table owns account-level actions (for example,
-- accepting a table merge or paying another diner's split). There may be zero
-- devices before a QR is scanned, but never two owners for one order.
--
-- Fail explicitly rather than silently choosing an owner from legacy data.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.order_devices
    WHERE is_owner = true
    GROUP BY order_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot enforce one account owner: duplicate order_devices.is_owner rows exist';
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_order_devices_one_owner_per_order
  ON public.order_devices (order_id)
  WHERE is_owner = true;
