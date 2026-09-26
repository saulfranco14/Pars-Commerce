-- A public request is not a payment and does not reserve stock. The business
-- decides when it becomes an operational order.
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS normalized_phone text;

UPDATE public.customers
SET normalized_phone = NULLIF(regexp_replace(COALESCE(phone, ''), '\\D', '', 'g'), '')
WHERE normalized_phone IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS customers_tenant_normalized_phone_unique
  ON public.customers (tenant_id, normalized_phone)
  WHERE normalized_phone IS NOT NULL;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS public_request_key text,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

CREATE UNIQUE INDEX IF NOT EXISTS orders_public_request_key_unique
  ON public.orders (public_request_key)
  WHERE public_request_key IS NOT NULL;

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (
  status IN (
    'draft', 'pending_acceptance', 'assigned', 'in_progress', 'completed',
    'pending_payment', 'pending_pickup', 'pending_subscription',
    'installment_active', 'partial', 'paid', 'cancelled'
  )
);

CREATE INDEX IF NOT EXISTS orders_pending_acceptance_idx
  ON public.orders (tenant_id, created_at DESC)
  WHERE status = 'pending_acceptance';
