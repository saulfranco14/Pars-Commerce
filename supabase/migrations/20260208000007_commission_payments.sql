-- Commission payments tracking system

CREATE TABLE IF NOT EXISTS public.commission_payments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
    tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    period_type text NOT NULL CHECK (
        period_type IN (
            'day',
            'week',
            'month',
            'custom'
        )
    ),
    period_start date NOT NULL,
    period_end date NOT NULL,
    total_orders integer NOT NULL DEFAULT 0,
    total_items integer NOT NULL DEFAULT 0,
    products_sold integer NOT NULL DEFAULT 0,
    services_sold integer NOT NULL DEFAULT 0,
    total_revenue decimal(12, 2) NOT NULL DEFAULT 0,
    total_cost decimal(12, 2) NOT NULL DEFAULT 0,
    gross_profit decimal(12, 2) NOT NULL DEFAULT 0,
    commission_amount decimal(12, 2) NOT NULL DEFAULT 0,
    payment_status text NOT NULL DEFAULT 'pending' CHECK (
        payment_status IN ('pending', 'paid')
    ),
    paid_at timestamptz,
    paid_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
    payment_notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.commission_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Commission_payments: tenant members" ON public.commission_payments FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.tenant_memberships m
        WHERE
            m.tenant_id = commission_payments.tenant_id
            AND m.user_id = auth.uid ()
    )
);

CREATE INDEX idx_commission_payments_tenant ON public.commission_payments (tenant_id);

CREATE INDEX idx_commission_payments_user ON public.commission_payments (user_id);

CREATE INDEX idx_commission_payments_status ON public.commission_payments (payment_status);

CREATE INDEX idx_commission_payments_period ON public.commission_payments (period_start, period_end);

COMMENT ON
TABLE public.commission_payments IS 'Pagos de comisiones agrupados por períodos (día/semana/mes)';

COMMENT ON COLUMN public.commission_payments.period_type IS 'Tipo de período: day, week, month, custom';

COMMENT ON COLUMN public.commission_payments.payment_status IS 'Estado del pago: pending, paid';