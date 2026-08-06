-- Tlaco SaaS billing. This is intentionally separate from public.subscriptions:
-- subscriptions belong to a business' customers, while these records charge a
-- business for using Tlaco.

CREATE TABLE IF NOT EXISTS public.billing_plans (
  code text PRIMARY KEY CHECK (code IN ('free', 'operation', 'growth', 'scale')),
  name text NOT NULL,
  amount_mxn numeric(12,2) NOT NULL CHECK (amount_mxn >= 0),
  billing_interval text NOT NULL DEFAULT 'month' CHECK (billing_interval = 'month'),
  entitlements jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tenant_billing_accounts (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_code text NOT NULL DEFAULT 'free' REFERENCES public.billing_plans(code),
  status text NOT NULL DEFAULT 'free' CHECK (status IN ('free', 'pending_payment', 'active', 'past_due', 'cancelling', 'cancelled')),
  mp_preapproval_id text,
  mp_init_point text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  grace_ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_billing_accounts_preapproval
  ON public.tenant_billing_accounts (mp_preapproval_id)
  WHERE mp_preapproval_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.tenant_billing_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  billing_account_tenant_id uuid NOT NULL REFERENCES public.tenant_billing_accounts(tenant_id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'mercadopago',
  external_payment_id text,
  gross_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (gross_amount >= 0),
  processing_fee_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (processing_fee_amount >= 0),
  net_amount numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL CHECK (status IN ('approved', 'pending', 'rejected', 'refunded')),
  paid_at timestamptz,
  raw_event_reference text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_billing_payments_external
  ON public.tenant_billing_payments (provider, external_payment_id)
  WHERE external_payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenant_billing_payments_tenant_created
  ON public.tenant_billing_payments (tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.billing_activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  actor_type text NOT NULL CHECK (actor_type IN ('member', 'system', 'webhook', 'platform_admin')),
  actor_id text,
  action text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_activity_tenant_created
  ON public.billing_activity_events (tenant_id, created_at DESC);

-- Premium automation is opt-in. It stores only the schedule and recipient;
-- the actual report remains derived from the merchant's live orders.
CREATE TABLE IF NOT EXISTS public.tenant_scheduled_reports (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  frequency text NOT NULL CHECK (frequency IN ('weekly', 'daily')),
  recipient_email text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  last_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- These controls only influence the advisory recommendation. They cannot
-- approve or create a loan: a person must always make that decision.
CREATE TABLE IF NOT EXISTS public.tenant_credit_policies (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  min_paid_last_90_days numeric(12,2) NOT NULL DEFAULT 0 CHECK (min_paid_last_90_days >= 0),
  max_recommendation_percent numeric(5,2) NOT NULL DEFAULT 30 CHECK (max_recommendation_percent >= 0 AND max_recommendation_percent <= 100),
  block_overdue_loans boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.billing_plans (code, name, amount_mxn, entitlements)
VALUES
  ('free', 'Gratis', 0, '{"active_table_limit":5,"active_kiosk_limit":0,"credit_recommendation":false,"advanced_reporting":false,"export_reports":false,"portfolio_dashboard_limit":0,"scheduled_report_frequency":null,"credit_policy_editor":false}'::jsonb),
  ('operation', 'Operación', 199, '{"active_table_limit":20,"active_kiosk_limit":1,"credit_recommendation":true,"advanced_reporting":false,"export_reports":false,"portfolio_dashboard_limit":0,"scheduled_report_frequency":null,"credit_policy_editor":false}'::jsonb),
  ('growth', 'Crecimiento', 399, '{"active_table_limit":50,"active_kiosk_limit":3,"credit_recommendation":true,"advanced_reporting":true,"export_reports":true,"portfolio_dashboard_limit":3,"scheduled_report_frequency":"weekly","credit_policy_editor":false}'::jsonb),
  ('scale', 'Escala', 699, '{"active_table_limit":100,"active_kiosk_limit":10,"credit_recommendation":true,"advanced_reporting":true,"export_reports":true,"portfolio_dashboard_limit":10,"scheduled_report_frequency":"daily_or_weekly","credit_policy_editor":true}'::jsonb)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  amount_mxn = EXCLUDED.amount_mxn,
  entitlements = EXCLUDED.entitlements,
  updated_at = now();

-- Every existing and future business starts safely on Free.
INSERT INTO public.tenant_billing_accounts (tenant_id, plan_code, status)
SELECT id, 'free', 'free' FROM public.tenants
ON CONFLICT (tenant_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.ensure_tenant_billing_account()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.tenant_billing_accounts (tenant_id, plan_code, status)
  VALUES (NEW.id, 'free', 'free')
  ON CONFLICT (tenant_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tenants_ensure_billing_account ON public.tenants;
CREATE TRIGGER trg_tenants_ensure_billing_account
  AFTER INSERT ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_billing_account();

ALTER TABLE public.billing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_billing_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_billing_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_credit_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "billing plans: authenticated read" ON public.billing_plans
  FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "billing plans: service role" ON public.billing_plans
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "billing accounts: tenant members read" ON public.tenant_billing_accounts
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.tenant_memberships m
    WHERE m.tenant_id = tenant_billing_accounts.tenant_id AND m.user_id = auth.uid()
  ));
CREATE POLICY "billing accounts: service role" ON public.tenant_billing_accounts
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "billing payments: tenant members read" ON public.tenant_billing_payments
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.tenant_memberships m
    WHERE m.tenant_id = tenant_billing_payments.tenant_id AND m.user_id = auth.uid()
  ));
CREATE POLICY "billing payments: service role" ON public.tenant_billing_payments
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "billing activity: tenant members read" ON public.billing_activity_events
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.tenant_memberships m
    WHERE m.tenant_id = billing_activity_events.tenant_id AND m.user_id = auth.uid()
  ));
CREATE POLICY "billing activity: service role" ON public.billing_activity_events
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "scheduled reports: tenant members read" ON public.tenant_scheduled_reports
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.tenant_memberships m
    WHERE m.tenant_id = tenant_scheduled_reports.tenant_id AND m.user_id = auth.uid()
  ));
CREATE POLICY "scheduled reports: service role" ON public.tenant_scheduled_reports
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "credit policy: tenant members read" ON public.tenant_credit_policies
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.tenant_memberships m
    WHERE m.tenant_id = tenant_credit_policies.tenant_id AND m.user_id = auth.uid()
  ));
CREATE POLICY "credit policy: service role" ON public.tenant_credit_policies
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
