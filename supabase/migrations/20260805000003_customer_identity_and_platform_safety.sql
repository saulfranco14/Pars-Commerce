-- Customer identity is tenant-local. A QR scan remains anonymous until a
-- purchase chooses to identify the buyer.
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS normalized_phone text,
  ADD COLUMN IF NOT EXISTS identity_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS customers_tenant_normalized_phone_unique
  ON public.customers (tenant_id, normalized_phone)
  WHERE normalized_phone IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.customer_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  device_hash text NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS customer_devices_tenant_hash_unique
  ON public.customer_devices (tenant_id, device_hash)
  WHERE revoked_at IS NULL;
ALTER TABLE public.customer_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer devices: service role" ON public.customer_devices
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

ALTER TABLE public.order_devices
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_order_devices_customer_id
  ON public.order_devices (customer_id) WHERE customer_id IS NOT NULL;

-- A platform-suspended user is rejected by server routes. The matching auth ban
-- is managed by the protected Platform endpoint, so an old browser session
-- cannot refresh into a valid dashboard session.
CREATE INDEX IF NOT EXISTS platform_activity_events_action_created_idx
  ON public.platform_activity_events (action, created_at DESC);
