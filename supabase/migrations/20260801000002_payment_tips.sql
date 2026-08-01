-- Tips are money collected alongside a payment, never part of the order debt.
-- Keeping them on payments preserves split totals, product commissions and
-- reconciliation while retaining the employee who was serving at checkout.
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS tip_amount numeric(12,2) NOT NULL DEFAULT 0
    CHECK (tip_amount >= 0),
  ADD COLUMN IF NOT EXISTS tip_recipient_user_id uuid
    REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS processing_fee_amount numeric(12,2) NOT NULL DEFAULT 0
    CHECK (processing_fee_amount >= 0),
  ADD COLUMN IF NOT EXISTS tip_fee_amount numeric(12,2) NOT NULL DEFAULT 0
    CHECK (tip_fee_amount >= 0),
  ADD COLUMN IF NOT EXISTS tip_net_amount numeric(12,2) NOT NULL DEFAULT 0
    CHECK (tip_net_amount >= 0);

CREATE INDEX IF NOT EXISTS idx_payments_tip_recipient
  ON public.payments (tip_recipient_user_id, created_at DESC)
  WHERE tip_amount > 0;
