-- The customer who opened a table owns account-level actions (for example,
-- accepting a table merge or paying another diner's split). There may be zero
-- devices before a QR is scanned, but never two owners for one order.
--
-- Legacy versions could mark more than one device as owner. Keep the first
-- device that joined the order — the same ownership rule used by the original
-- backfill — and release only the extra flags before enforcing the invariant.
-- This changes neither items nor payments and is deterministic on every run.
WITH ranked_owners AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY order_id
      ORDER BY joined_at ASC NULLS LAST, created_at ASC NULLS LAST, id ASC
    ) AS owner_rank
  FROM public.order_devices
  WHERE is_owner = true
)
UPDATE public.order_devices AS device
SET is_owner = false,
    updated_at = now()
FROM ranked_owners AS ranked
WHERE device.id = ranked.id
  AND ranked.owner_rank > 1;

-- Keep an explicit assertion so a future data shape cannot be hidden by the
-- repair before the unique index is added.
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
