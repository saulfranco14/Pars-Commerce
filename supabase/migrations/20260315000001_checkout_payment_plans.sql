-- =============================================================================
-- Checkout empresarial: pagos unicos, suscripciones y abonos parciales
-- =============================================================================

-- 1) Extender orders con rastreo de pago consolidado
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS paid_total decimal(12, 2) NOT NULL DEFAULT 0 CHECK (paid_total >= 0),
ADD COLUMN IF NOT EXISTS balance_due decimal(12, 2) NOT NULL DEFAULT 0 CHECK (balance_due >= 0),
ADD COLUMN IF NOT EXISTS checkout_session_id uuid DEFAULT uuid_generate_v4(),
ADD COLUMN IF NOT EXISTS payment_mode text NOT NULL DEFAULT 'single' CHECK (
  payment_mode IN ('single', 'subscription', 'partial')
),
ADD COLUMN IF NOT EXISTS payment_plan_status text NOT NULL DEFAULT 'none' CHECK (
  payment_plan_status IN ('none', 'pending', 'active', 'paused', 'completed', 'cancelled')
),
ADD COLUMN IF NOT EXISTS expires_at timestamptz;

UPDATE public.orders
SET
  paid_total = CASE WHEN status = 'paid' THEN total ELSE 0 END,
  balance_due = GREATEST(total - CASE WHEN status = 'paid' THEN total ELSE 0 END, 0),
  payment_plan_status = CASE
    WHEN status = 'pending_subscription' THEN 'pending'
    WHEN status = 'installment_active' THEN 'active'
    ELSE payment_plan_status
  END
WHERE paid_total = 0
  OR balance_due = 0
  OR payment_plan_status = 'none';

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (
  status IN (
    'draft',
    'assigned',
    'in_progress',
    'completed',
    'pending_payment',
    'pending_pickup',
    'pending_subscription',
    'installment_active',
    'partial',
    'paid',
    'cancelled'
  )
);

CREATE INDEX IF NOT EXISTS idx_orders_tenant_status_mode
  ON public.orders (tenant_id, status, payment_mode, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_checkout_session
  ON public.orders (checkout_session_id)
  WHERE checkout_session_id IS NOT NULL;

-- 2) Intentos de pago por orden (idempotencia y trazabilidad)
CREATE TABLE IF NOT EXISTS public.order_payment_attempts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  mode text NOT NULL CHECK (mode IN ('single', 'subscription', 'partial')),
  provider text NOT NULL DEFAULT 'mercadopago',
  idempotency_key text NOT NULL,
  external_reference text,
  provider_reference text,
  status text NOT NULL DEFAULT 'created' CHECK (
    status IN ('created', 'redirected', 'pending', 'approved', 'cancelled', 'failed', 'expired')
  ),
  amount decimal(12, 2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'MXN',
  expires_at timestamptz,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (idempotency_key)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_order_payment_attempts_external_reference
  ON public.order_payment_attempts (external_reference)
  WHERE external_reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_payment_attempts_order
  ON public.order_payment_attempts (order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_payment_attempts_tenant_status
  ON public.order_payment_attempts (tenant_id, status, created_at DESC);

ALTER TABLE public.order_payment_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Order_payment_attempts: tenant members" ON public.order_payment_attempts;
CREATE POLICY "Order_payment_attempts: tenant members" ON public.order_payment_attempts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.tenant_memberships m
      WHERE m.tenant_id = order_payment_attempts.tenant_id
        AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.tenant_memberships m
      WHERE m.tenant_id = order_payment_attempts.tenant_id
        AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Order_payment_attempts: service role full access" ON public.order_payment_attempts;
CREATE POLICY "Order_payment_attempts: service role full access" ON public.order_payment_attempts
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 3) Calendario de abonos/cuotas por orden
CREATE TABLE IF NOT EXISTS public.order_payment_schedules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  attempt_id uuid REFERENCES public.order_payment_attempts(id) ON DELETE SET NULL,
  installment_number int NOT NULL CHECK (installment_number > 0),
  due_date timestamptz NOT NULL,
  amount_due decimal(12, 2) NOT NULL CHECK (amount_due > 0),
  amount_paid decimal(12, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'paid', 'overdue', 'cancelled')
  ),
  mp_payment_id text,
  paid_at timestamptz,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, installment_number)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_order_payment_schedules_mp_payment
  ON public.order_payment_schedules (mp_payment_id)
  WHERE mp_payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_payment_schedules_tenant_due
  ON public.order_payment_schedules (tenant_id, status, due_date ASC);
CREATE INDEX IF NOT EXISTS idx_order_payment_schedules_order
  ON public.order_payment_schedules (order_id, installment_number ASC);

ALTER TABLE public.order_payment_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Order_payment_schedules: tenant members" ON public.order_payment_schedules;
CREATE POLICY "Order_payment_schedules: tenant members" ON public.order_payment_schedules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.tenant_memberships m
      WHERE m.tenant_id = order_payment_schedules.tenant_id
        AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.tenant_memberships m
      WHERE m.tenant_id = order_payment_schedules.tenant_id
        AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Order_payment_schedules: service role full access" ON public.order_payment_schedules;
CREATE POLICY "Order_payment_schedules: service role full access" ON public.order_payment_schedules
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 4) Extender payments para multi-intento y abonos
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS payment_kind text NOT NULL DEFAULT 'single' CHECK (
  payment_kind IN ('single', 'subscription', 'partial', 'manual_adjustment')
),
ADD COLUMN IF NOT EXISTS installment_number int,
ADD COLUMN IF NOT EXISTS checkout_session_id uuid,
ADD COLUMN IF NOT EXISTS idempotency_key text,
ADD COLUMN IF NOT EXISTS attempt_id uuid REFERENCES public.order_payment_attempts(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_provider_external_id
  ON public.payments (provider, external_id)
  WHERE external_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_idempotency
  ON public.payments (idempotency_key)
  WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_order_created
  ON public.payments (order_id, created_at DESC);

