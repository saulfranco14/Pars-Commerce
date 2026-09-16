-- Tlaco merchant payments v2
--
-- Merchant sales must be collected by the merchant's own provider account.
-- The historical collector flow stays intact: legacy payments are explicitly
-- tagged as `funds_owner = 'tlaco'`, while new merchant connections produce
-- `funds_owner = 'tenant'` rows and never enter Tlaco settlements.

-- Some older Tlaco databases predate this extension. It is safe to enable
-- repeatedly and is required by the UUID defaults used below and in the
-- following assisted-onboarding migration.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.payment_provider_connections (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('mercadopago')),
  merchant_account_id text,
  merchant_display_name text,
  access_token_ciphertext text,
  refresh_token_ciphertext text,
  token_expires_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'connected', 'expired', 'revoked', 'failed')),
  capabilities jsonb NOT NULL DEFAULT '{}'::jsonb,
  connected_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  terms_version_accepted text,
  terms_accepted_at timestamptz,
  connected_at timestamptz,
  revoked_at timestamptz,
  oauth_state_hash text UNIQUE,
  oauth_state_expires_at timestamptz,
  pkce_verifier_ciphertext text,
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, provider)
);

CREATE TABLE IF NOT EXISTS public.payment_provider_terminals (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  connection_id uuid NOT NULL REFERENCES public.payment_provider_connections(id) ON DELETE CASCADE,
  provider_terminal_id text NOT NULL,
  branch text,
  pos text,
  display_name text,
  operating_mode text,
  is_default boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_terminal_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_provider_terminals_default
  ON public.payment_provider_terminals(connection_id)
  WHERE is_default = true;

CREATE TABLE IF NOT EXISTS public.payment_provider_events (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  provider text NOT NULL,
  provider_event_id text NOT NULL,
  connection_id uuid REFERENCES public.payment_provider_connections(id) ON DELETE SET NULL,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  signature_valid boolean NOT NULL DEFAULT false,
  processing_status text NOT NULL DEFAULT 'received' CHECK (processing_status IN ('received', 'processed', 'ignored', 'failed')),
  payload_hash text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  failure_reason text,
  UNIQUE (provider, provider_event_id)
);

CREATE INDEX IF NOT EXISTS idx_payment_provider_events_connection_received
  ON public.payment_provider_events(connection_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_provider_events_tenant_received
  ON public.payment_provider_events(tenant_id, received_at DESC);

CREATE TABLE IF NOT EXISTS public.tenant_fee_policies (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  scope text NOT NULL CHECK (scope IN ('membership', 'service', 'sale')),
  provider text,
  rate_type text NOT NULL CHECK (rate_type IN ('fixed', 'percentage')),
  rate_value numeric(12,2) NOT NULL CHECK (rate_value >= 0),
  collection_mode text NOT NULL CHECK (collection_mode IN ('marketplace_split', 'tlaco_invoice', 'none')),
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_to timestamptz,
  disclosure_version text NOT NULL,
  accepted_at timestamptz,
  accepted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (effective_to IS NULL OR effective_to > effective_from)
);
CREATE INDEX IF NOT EXISTS idx_tenant_fee_policies_active
  ON public.tenant_fee_policies(tenant_id, scope, provider, effective_from DESC)
  WHERE effective_to IS NULL;

CREATE TABLE IF NOT EXISTS public.tenant_billing_items (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  period date NOT NULL,
  source text NOT NULL CHECK (source IN ('membership', 'service', 'sale_fee')),
  source_reference text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'invoiced', 'paid', 'void')),
  provider text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, source, source_reference)
);
CREATE INDEX IF NOT EXISTS idx_tenant_billing_items_period
  ON public.tenant_billing_items(tenant_id, period DESC, status);

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS merchant_payments_v2_enabled boolean NOT NULL DEFAULT false;

ALTER TABLE public.order_payment_attempts
  ADD COLUMN IF NOT EXISTS provider_connection_id uuid REFERENCES public.payment_provider_connections(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_order_payment_attempts_connection
  ON public.order_payment_attempts(provider_connection_id, created_at DESC)
  WHERE provider_connection_id IS NOT NULL;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS provider_connection_id uuid REFERENCES public.payment_provider_connections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS merchant_account_id text,
  ADD COLUMN IF NOT EXISTS funds_owner text NOT NULL DEFAULT 'tlaco' CHECK (funds_owner IN ('tenant', 'tlaco')),
  ADD COLUMN IF NOT EXISTS platform_fee_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (platform_fee_amount >= 0),
  ADD COLUMN IF NOT EXISTS provider_fee_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (provider_fee_amount >= 0),
  ADD COLUMN IF NOT EXISTS provider_order_id text,
  ADD COLUMN IF NOT EXISTS provider_payment_id text,
  ADD COLUMN IF NOT EXISTS reconciliation_status text NOT NULL DEFAULT 'not_required'
    CHECK (reconciliation_status IN ('not_required', 'pending', 'matched', 'unmatched', 'failed'));
CREATE INDEX IF NOT EXISTS idx_payments_connection_reconciliation
  ON public.payments(provider_connection_id, reconciliation_status, created_at DESC)
  WHERE provider_connection_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_provider_payment_id
  ON public.payments(provider, provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;

-- Existing rows were created under the former platform collector and must
-- retain that financial treatment forever.
UPDATE public.payments SET funds_owner = 'tlaco'
WHERE funds_owner IS NULL OR funds_owner <> 'tenant';

ALTER TABLE public.payment_provider_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_provider_terminals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_provider_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_fee_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_billing_items ENABLE ROW LEVEL SECURITY;

-- Credentials are only ever read/written through authenticated server routes
-- using the service role. Owners receive a safe status projection, never token
-- material, from those routes.
DROP POLICY IF EXISTS "provider connections: service role" ON public.payment_provider_connections;
CREATE POLICY "provider connections: service role" ON public.payment_provider_connections
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
DROP POLICY IF EXISTS "provider terminals: service role" ON public.payment_provider_terminals;
CREATE POLICY "provider terminals: service role" ON public.payment_provider_terminals
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
DROP POLICY IF EXISTS "provider events: service role" ON public.payment_provider_events;
CREATE POLICY "provider events: service role" ON public.payment_provider_events
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
DROP POLICY IF EXISTS "tenant fee policies: service role" ON public.tenant_fee_policies;
CREATE POLICY "tenant fee policies: service role" ON public.tenant_fee_policies
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
DROP POLICY IF EXISTS "tenant billing items: service role" ON public.tenant_billing_items;
CREATE POLICY "tenant billing items: service role" ON public.tenant_billing_items
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Recreate the existing settlement ledger with ownership as the source of
-- truth. Direct merchant money is visible in analytics but never liquidated by
-- Tlaco. Loans/subscriptions remain historical Tlaco-collector flows until
-- their own merchant-provider migration is enabled.
CREATE OR REPLACE VIEW public.payment_ledger AS
  SELECT
    'payments'::text AS source_table,
    p.id AS source_id,
    o.tenant_id AS tenant_id,
    p.order_id AS order_id,
    p.amount AS amount_gross,
    COALESCE(p.provider_fee_amount, 0) AS fee_amount,
    p.amount - COALESCE(p.provider_fee_amount, 0) AS net_amount,
    p.provider AS provider,
    COALESCE(o.payment_method, 'efectivo') AS payment_method,
    (p.funds_owner = 'tlaco') AS is_platform_custodied,
    COALESCE(p.provider_payment_id, p.external_id) AS external_id,
    p.status AS status,
    p.payment_kind AS kind,
    p.created_at AS created_at
  FROM public.payments p
  JOIN public.orders o ON o.id = p.order_id
  WHERE p.status IN ('approved', 'paid')
  UNION ALL
  SELECT
    'loan_payments'::text, lp.id, lp.tenant_id, NULL::uuid, lp.amount,
    COALESCE(lp.mp_fee_amount, 0), COALESCE(lp.mp_net_amount, lp.amount),
    CASE WHEN lp.payment_method = 'mercadopago' THEN 'mercadopago' ELSE 'manual' END,
    lp.payment_method, (lp.payment_method = 'mercadopago'), lp.mp_payment_id,
    'approved'::text, 'loan'::text, lp.created_at
  FROM public.loan_payments lp
  UNION ALL
  SELECT
    'subscription_payments'::text, sp.id, sp.tenant_id, sp.order_id, sp.amount,
    COALESCE(sp.service_fee, 0), COALESCE(sp.net_amount, sp.amount),
    'mercadopago'::text, 'mercadopago'::text, true, sp.mp_payment_id,
    sp.status, 'subscription'::text, sp.created_at
  FROM public.subscription_payments sp
  WHERE sp.status = 'paid';

COMMENT ON TABLE public.payment_provider_connections IS
  'OAuth credentials for a tenant-owned payment provider. Ciphertext is application-encrypted; never expose it to browser clients.';
COMMENT ON COLUMN public.payments.funds_owner IS
  'tenant = merchant receives money directly; tlaco = historical/authorized platform collector only.';
