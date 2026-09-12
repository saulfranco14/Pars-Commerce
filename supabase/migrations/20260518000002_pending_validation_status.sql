-- =============================================================================
-- Allow "pending_validation" as a valid payment_status for split groups.
--
-- The original CHECK constraint on order_split_groups.payment_status only
-- accepted ('pending', 'paid'). The customer payment intent flow needs an
-- intermediate state where the customer signaled they paid (cash/transfer/
-- card) but staff hasn't validated yet.
--
-- This migration drops the old constraint and recreates it with the new
-- enum value included.
-- =============================================================================

ALTER TABLE public.order_split_groups
  DROP CONSTRAINT IF EXISTS order_split_groups_payment_status_check;

ALTER TABLE public.order_split_groups
  ADD CONSTRAINT order_split_groups_payment_status_check
  CHECK (payment_status IN ('pending', 'pending_validation', 'paid'));
