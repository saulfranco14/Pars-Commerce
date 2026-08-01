-- A physical table can only be occupied by one order, and an order can only
-- be attached to one physical table at once. Kiosk tickets are kind='order'
-- and intentionally do NOT participate in this invariant.
--
-- Fail before creating the index if legacy data violates the rule. This keeps
-- the migration recoverable: no index is half-created and the duplicate rows
-- can be inspected before retrying.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.qr_codes
    WHERE kind = 'table' AND current_order_id IS NOT NULL
    GROUP BY current_order_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot enforce one table per order: duplicate active table attachments exist';
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_qr_codes_one_table_per_order
  ON public.qr_codes (current_order_id)
  WHERE kind = 'table' AND current_order_id IS NOT NULL;
