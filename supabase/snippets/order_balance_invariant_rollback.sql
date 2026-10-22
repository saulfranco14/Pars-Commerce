-- Reverts 20261025000001_order_balance_invariant.sql.
-- The repaired balances stay correct (total - paid); only the automatic rule goes away.
DROP TRIGGER IF EXISTS orders_keep_balance_due ON public.orders;
DROP FUNCTION IF EXISTS public.keep_order_balance_due();
