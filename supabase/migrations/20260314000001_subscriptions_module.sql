-- =============================================================================
-- MODULO DE SUSCRIPCIONES (Compras Recurrentes / Cuotas desde Storefront)
-- Tablas: subscriptions, subscription_payments
-- Alter: orders (subscription_id, subscription_installment, nuevo status)
-- =============================================================================

-- =============================================================================
-- 1. SUBSCRIPTIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    customer_id   uuid REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name  text NOT NULL,
    customer_email text NOT NULL,
    customer_phone text,

    type text NOT NULL CHECK (type IN ('installments', 'recurring')),

    frequency      int NOT NULL DEFAULT 1 CHECK (frequency >= 1),
    frequency_type text NOT NULL CHECK (frequency_type IN ('weeks', 'months')),

    original_amount      decimal(12,2) NOT NULL CHECK (original_amount > 0),
    discount_percent     decimal(5,2)  NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
    discounted_amount    decimal(12,2) NOT NULL CHECK (discounted_amount > 0),
    installment_amount   decimal(12,2) NOT NULL CHECK (installment_amount > 0),
    charge_amount        decimal(12,2) NOT NULL CHECK (charge_amount > 0),
    service_fee_per_charge decimal(12,2) NOT NULL DEFAULT 0,

    total_installments     int CHECK (total_installments > 0 OR total_installments IS NULL),
    completed_installments int NOT NULL DEFAULT 0,

    status text NOT NULL DEFAULT 'pending_setup' CHECK (
        status IN (
            'pending_setup',
            'active',
            'paused',
            'card_failed',
            'completed',
            'cancelled'
        )
    ),

    mp_preapproval_id        text,
    mp_subscription_init_point text,
    mp_fee_absorbed_by       text NOT NULL DEFAULT 'customer' CHECK (
        mp_fee_absorbed_by IN ('customer', 'business')
    ),

    original_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
    concept text,
    items_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,

    start_date       timestamptz,
    next_charge_date timestamptz,
    cancelled_at     timestamptz,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_tenant ON public.subscriptions (tenant_id);
CREATE INDEX idx_subscriptions_tenant_status ON public.subscriptions (tenant_id, status);
CREATE INDEX idx_subscriptions_customer ON public.subscriptions (tenant_id, customer_id)
    WHERE customer_id IS NOT NULL;
CREATE INDEX idx_subscriptions_original_order ON public.subscriptions (original_order_id)
    WHERE original_order_id IS NOT NULL;
CREATE INDEX idx_subscriptions_mp_preapproval ON public.subscriptions (mp_preapproval_id)
    WHERE mp_preapproval_id IS NOT NULL;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions: members select" ON public.subscriptions FOR
SELECT USING (
    EXISTS (
        SELECT 1 FROM public.tenant_memberships m
        WHERE m.tenant_id = subscriptions.tenant_id AND m.user_id = auth.uid()
    )
);

CREATE POLICY "subscriptions: members insert" ON public.subscriptions FOR
INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.tenant_memberships m
        WHERE m.tenant_id = subscriptions.tenant_id AND m.user_id = auth.uid()
    )
);

CREATE POLICY "subscriptions: members update" ON public.subscriptions FOR
UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.tenant_memberships m
        WHERE m.tenant_id = subscriptions.tenant_id AND m.user_id = auth.uid()
    )
);

CREATE POLICY "subscriptions: service role full access" ON public.subscriptions
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- =============================================================================
-- 2. SUBSCRIPTION_PAYMENTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.subscription_payments (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    installment_number int NOT NULL CHECK (installment_number > 0),
    amount             decimal(12,2) NOT NULL CHECK (amount > 0),
    service_fee        decimal(12,2) NOT NULL DEFAULT 0,
    net_amount         decimal(12,2),

    order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,

    mp_payment_id     text,
    mp_preapproval_id text,

    status text NOT NULL DEFAULT 'paid' CHECK (
        status IN ('paid', 'failed', 'refunded')
    ),

    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sub_payments_subscription ON public.subscription_payments (subscription_id);
CREATE INDEX idx_sub_payments_tenant ON public.subscription_payments (tenant_id);
CREATE INDEX idx_sub_payments_order ON public.subscription_payments (order_id)
    WHERE order_id IS NOT NULL;

CREATE UNIQUE INDEX idx_sub_payments_mp_id ON public.subscription_payments (mp_payment_id)
    WHERE mp_payment_id IS NOT NULL;

ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscription_payments: members select" ON public.subscription_payments FOR
SELECT USING (
    EXISTS (
        SELECT 1 FROM public.tenant_memberships m
        WHERE m.tenant_id = subscription_payments.tenant_id AND m.user_id = auth.uid()
    )
);

CREATE POLICY "subscription_payments: members insert" ON public.subscription_payments FOR
INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.tenant_memberships m
        WHERE m.tenant_id = subscription_payments.tenant_id AND m.user_id = auth.uid()
    )
);

CREATE POLICY "subscription_payments: service role full access" ON public.subscription_payments
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- =============================================================================
-- 3. ALTER TABLE orders
-- =============================================================================

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS subscription_installment int;

CREATE INDEX IF NOT EXISTS idx_orders_subscription ON public.orders (subscription_id)
    WHERE subscription_id IS NOT NULL;

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
        'paid',
        'cancelled'
    )
);

-- =============================================================================
-- FIN DE MIGRACION
-- =============================================================================
