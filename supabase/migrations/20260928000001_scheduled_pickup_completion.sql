-- A paid scheduled order is not necessarily collected. Keep the financial
-- state (`paid`) independent from the physical handoff and record its actor.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS pickup_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS pickup_completed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_scheduled_pickup_open
  ON public.orders (tenant_id, scheduled_for)
  WHERE scheduled_for IS NOT NULL AND pickup_completed_at IS NULL;
