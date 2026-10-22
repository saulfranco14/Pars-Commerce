-- Balance owed always equals total minus what was paid.
--
-- Why: `add_order_items_batch` (and the quote conversion) recompute `total`
-- but never `balance_due`, so an order created empty by "Nueva orden" kept
-- balance_due = 0 after its products were added. The counter charge then
-- offered "Recibí $0.00" and Caja didn't list the order as owing.
--
-- Rule: on every insert/update of an order that isn't paid or cancelled,
-- balance_due = GREATEST(total - COALESCE(paid_total, 0), 0). Every writer we
-- have already sets exactly that, so for them nothing changes.
-- Paid and cancelled orders are left as they are: legacy paid rows predate
-- paid_total and must not be rewritten.
--
-- Rollback: supabase/snippets/order_balance_invariant_rollback.sql

CREATE OR REPLACE FUNCTION public.keep_order_balance_due()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM 'paid' AND NEW.status IS DISTINCT FROM 'cancelled' THEN
    NEW.balance_due := GREATEST(COALESCE(NEW.total, 0) - COALESCE(NEW.paid_total, 0), 0);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_keep_balance_due ON public.orders;
CREATE TRIGGER orders_keep_balance_due
  BEFORE INSERT OR UPDATE OF total, paid_total, balance_due, status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.keep_order_balance_due();

-- Repair the open orders that were left with a stale balance (9 in production on 2026-10-22).
UPDATE public.orders
SET balance_due = GREATEST(COALESCE(total, 0) - COALESCE(paid_total, 0), 0)
WHERE status NOT IN ('paid', 'cancelled')
  AND balance_due IS DISTINCT FROM GREATEST(COALESCE(total, 0) - COALESCE(paid_total, 0), 0);
