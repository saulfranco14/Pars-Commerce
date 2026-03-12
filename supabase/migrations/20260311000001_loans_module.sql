-- =============================================================================
-- MÓDULO DE PRÉSTAMOS (FIADOS)
-- Tablas: customers, customer_cards, loans, loan_payments, loan_bulk_payments
-- Trigger: update_loan_on_payment
-- Alter: orders.customer_id
-- =============================================================================

-- =============================================================================
-- 1. CUSTOMERS — Clientes identificables del tenant
-- =============================================================================


CREATE TABLE IF NOT EXISTS public.customers (
    id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    name        text NOT NULL,
    email       text,
    phone       text,
    notes       text,

-- ID del cliente en MercadoPago /v1/customers (se crea al guardar tarjeta)
mp_customer_id text,

    created_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_customers_tenant ON public.customers (tenant_id);

-- Búsqueda por nombre (autocomplete al crear préstamo)
CREATE INDEX idx_customers_tenant_name ON public.customers (tenant_id, lower(name));

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers: members select" ON public.customers FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.tenant_memberships m
            WHERE
                m.tenant_id = customers.tenant_id
                AND m.user_id = auth.uid ()
        )
    );

CREATE POLICY "customers: members insert" ON public.customers FOR
INSERT
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM public.tenant_memberships m
            WHERE
                m.tenant_id = customers.tenant_id
                AND m.user_id = auth.uid ()
        )
    );

CREATE POLICY "customers: members update" ON public.customers FOR
UPDATE USING (
    EXISTS (
        SELECT 1
        FROM public.tenant_memberships m
        WHERE
            m.tenant_id = customers.tenant_id
            AND m.user_id = auth.uid ()
    )
);

-- Sin DELETE: los clientes son activos del negocio y pueden tener préstamos históricos

COMMENT ON
TABLE public.customers IS 'Clientes del negocio, usados principalmente para el módulo de préstamos';

COMMENT ON COLUMN public.customers.mp_customer_id IS 'ID en MercadoPago /v1/customers, creado al guardar tarjeta por primera vez';

-- =============================================================================
-- 2. CUSTOMER_CARDS — Tarjetas guardadas del cliente en MP
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.customer_cards (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
    customer_id uuid NOT NULL REFERENCES public.customers (id) ON DELETE CASCADE,
    tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
    mp_card_id text NOT NULL, -- ID en /v1/customers/{id}/cards de MP
    last_four text NOT NULL, -- Últimos 4 dígitos: "4567"
    card_type text, -- "visa", "mastercard", "amex", etc.
    holder_name text,
    expiration_month int,
    expiration_year int,
    is_default boolean NOT NULL DEFAULT false,
    is_active boolean NOT NULL DEFAULT true, -- false si fue eliminada en MP
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_customer_cards_customer ON public.customer_cards (customer_id);

CREATE INDEX idx_customer_cards_tenant ON public.customer_cards (tenant_id);

ALTER TABLE public.customer_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_cards: members select" ON public.customer_cards FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.tenant_memberships m
            WHERE
                m.tenant_id = customer_cards.tenant_id
                AND m.user_id = auth.uid ()
        )
    );

CREATE POLICY "customer_cards: members insert" ON public.customer_cards FOR
INSERT
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM public.tenant_memberships m
            WHERE
                m.tenant_id = customer_cards.tenant_id
                AND m.user_id = auth.uid ()
        )
    );

CREATE POLICY "customer_cards: members update" ON public.customer_cards FOR
UPDATE USING (
    EXISTS (
        SELECT 1
        FROM public.tenant_memberships m
        WHERE
            m.tenant_id = customer_cards.tenant_id
            AND m.user_id = auth.uid ()
    )
);

COMMENT ON
TABLE public.customer_cards IS 'Tarjetas guardadas de clientes en MercadoPago para cobros automáticos';

COMMENT ON COLUMN public.customer_cards.mp_card_id IS 'ID devuelto por POST /v1/customers/{id}/cards de MP';

COMMENT ON COLUMN public.customer_cards.is_active IS 'false cuando la tarjeta fue eliminada en MP pero se conserva el historial';

-- =============================================================================
-- 3. LOANS — Préstamos / fiados del negocio
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.loans (
    id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    customer_id uuid NOT NULL REFERENCES public.customers(id),

-- ── Montos ──────────────────────────────────────────────────────────────
amount decimal(12, 2) NOT NULL CHECK (amount > 0),
amount_paid decimal(12, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
-- amount_pending es GENERATED: amount - amount_paid

-- ── Interés (opcional) ──────────────────────────────────────────────────
-- 'none'    = sin interés
-- 'fixed'   = monto fijo ya incluido en `amount`
-- 'monthly' = % mensual calculado dinámicamente al momento de cobrar
-- 'weekly'  = % semanal calculado dinámicamente al momento de cobrar
interest_rate decimal(5, 2) NOT NULL DEFAULT 0 CHECK (interest_rate >= 0),
interest_type text NOT NULL DEFAULT 'none' CHECK (
    interest_type IN (
        'none',
        'fixed',
        'monthly',
        'weekly'
    )
),

-- ── Metadata ────────────────────────────────────────────────────────────
concept text NOT NULL,
due_date date,
notes text,

-- Orden de origen (si el préstamo se creó desde un ticket)
order_id uuid REFERENCES public.orders (id) ON DELETE SET NULL,

-- ── Estado principal ────────────────────────────────────────────────────
-- pending  = sin ningún pago
-- partial  = pagado parcialmente
-- paid     = liquidado en su totalidad
-- cancelled = cancelado por el dueño
status text NOT NULL DEFAULT 'pending' CHECK (
    status IN (
        'pending',
        'partial',
        'paid',
        'cancelled'
    )
),

-- ── Plan de cobro automático (null = pago libre, sin automatización) ────
-- single       = un solo cobro automático por el monto total
-- installments = N pagos iguales programados
-- recurring    = cobro periódico hasta liquidar el saldo
payment_plan_type text CHECK (
    payment_plan_type IN (
        'single',
        'installments',
        'recurring'
    )
),
payment_plan_frequency int, -- cada cuántas unidades (ej: 1, 2)
payment_plan_frequency_type text -- 'weeks' | 'months'
CHECK (
    payment_plan_frequency_type IN ('weeks', 'months')
),
payment_plan_installment_amount decimal(12, 2) CHECK (
    payment_plan_installment_amount > 0
),

-- Estado interno del plan automático
-- pending_setup = esperando que el cliente guarde tarjeta (link enviado)
-- active        = suscripción activa, cobrando automáticamente
-- paused        = suscripción pausada en MP
-- card_failed   = todos los reintentos de MP fallaron (requiere acción)
-- completed     = todos los cobros del plan se completaron
-- cancelled     = suscripción cancelada
payment_plan_status text CHECK (
    payment_plan_status IN (
        'pending_setup',
        'active',
        'paused',
        'card_failed',
        'completed',
        'cancelled'
    )
),

-- ── Integración MP — Suscripción (PreApproval) ──────────────────────────
mp_preapproval_id text, -- ID de la suscripción activa en MP
mp_preapproval_plan_id text, -- ID del plan en MP (si aplica)
mp_subscription_init_point text, -- URL que el cliente abre para guardar tarjeta

-- ── Integración MP — Link de pago único ─────────────────────────────────
last_payment_link text, last_mp_preference_id text,

-- ── Config de comisión para cobros con MP ───────────────────────────────
-- customer = el cliente paga el monto + comisión MP (default)
-- business = el negocio absorbe la comisión de MP
mp_fee_absorbed_by text NOT NULL DEFAULT 'customer' CHECK (
    mp_fee_absorbed_by IN ('customer', 'business')
),

-- ── Auditoría ───────────────────────────────────────────────────────────
created_by   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    cancelled_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    cancelled_at timestamptz,
    paid_at      timestamptz,       -- Cuándo quedó 100% pagado (status = 'paid')
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Columna generada: saldo pendiente = amount - amount_paid
ALTER TABLE public.loans
ADD COLUMN amount_pending decimal(12, 2) GENERATED ALWAYS AS (amount - amount_paid) STORED;

-- Índices
CREATE INDEX idx_loans_tenant ON public.loans (tenant_id);

CREATE INDEX idx_loans_tenant_status ON public.loans (tenant_id, status);

CREATE INDEX idx_loans_customer ON public.loans (tenant_id, customer_id);

-- Solo indexar préstamos con fecha límite que no estén pagados (alertas de vencimiento)
CREATE INDEX idx_loans_due_date ON public.loans (tenant_id, due_date)
WHERE
    due_date IS NOT NULL
    AND status NOT IN('paid', 'cancelled');

-- Búsqueda desde webhook por preference_id
CREATE INDEX idx_loans_mp_preference ON public.loans (last_mp_preference_id)
WHERE
    last_mp_preference_id IS NOT NULL;

-- Búsqueda desde webhook de suscripción por preapproval_id
CREATE INDEX idx_loans_mp_preapproval ON public.loans (mp_preapproval_id)
WHERE
    mp_preapproval_id IS NOT NULL;

ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "loans: members select" ON public.loans FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.tenant_memberships m
            WHERE
                m.tenant_id = loans.tenant_id
                AND m.user_id = auth.uid ()
        )
    );

CREATE POLICY "loans: members insert" ON public.loans FOR
INSERT
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM public.tenant_memberships m
            WHERE
                m.tenant_id = loans.tenant_id
                AND m.user_id = auth.uid ()
        )
    );

CREATE POLICY "loans: members update" ON public.loans FOR
UPDATE USING (
    EXISTS (
        SELECT 1
        FROM public.tenant_memberships m
        WHERE
            m.tenant_id = loans.tenant_id
            AND m.user_id = auth.uid ()
    )
);

-- Sin DELETE: los préstamos no se eliminan, se cancelan (status = 'cancelled')

COMMENT ON
TABLE public.loans IS 'Préstamos o fiados registrados por el negocio a sus clientes';

COMMENT ON COLUMN public.loans.amount IS 'Monto total prestado (incluye interés fijo si interest_type=fixed)';

COMMENT ON COLUMN public.loans.amount_paid IS 'Suma acumulada de todos los pagos recibidos';

COMMENT ON COLUMN public.loans.amount_pending IS 'Saldo pendiente (GENERATED: amount - amount_paid)';

COMMENT ON COLUMN public.loans.interest_type IS 'none=sin interés, fixed=incluido en amount, monthly/weekly=calculado dinámicamente al cobrar';

COMMENT ON COLUMN public.loans.payment_plan_type IS 'Tipo de plan automático: single, installments, recurring. NULL = pago libre';

COMMENT ON COLUMN public.loans.payment_plan_status IS 'Estado del plan automático: pending_setup, active, paused, card_failed, completed, cancelled';

COMMENT ON COLUMN public.loans.mp_preapproval_id IS 'ID de la suscripción en MP (PreApproval), usada para cobros automáticos';

COMMENT ON COLUMN public.loans.mp_subscription_init_point IS 'URL que el cliente debe abrir para autorizar la suscripción y guardar su tarjeta';

COMMENT ON COLUMN public.loans.mp_fee_absorbed_by IS 'customer=cliente paga comisión MP, business=negocio la absorbe';

COMMENT ON COLUMN public.loans.paid_at IS 'Timestamp exacto en que amount_paid >= amount (seteado por el trigger)';

-- =============================================================================
-- 4. LOAN_PAYMENTS — Historial de pagos individuales por préstamo
-- =============================================================================


CREATE TABLE IF NOT EXISTS public.loan_payments (
    id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id     uuid NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
    tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    amount      decimal(12,2) NOT NULL CHECK (amount > 0),

-- método con el que se pagó
payment_method text NOT NULL CHECK (
    payment_method IN (
        'efectivo',
        'transferencia',
        'tarjeta',
        'mercadopago',
        'otro'
    )
),

-- origen del registro
-- manual              = el dueño lo registró a mano (efectivo/transferencia)
-- mercadopago_webhook = pago por link único de MP procesado por webhook
-- preapproval_webhook = cobro automático de suscripción MP procesado por webhook
source text NOT NULL DEFAULT 'manual' CHECK (
    source IN (
        'manual',
        'mercadopago_webhook',
        'preapproval_webhook'
    )
),

-- Datos de MercadoPago (null si source = 'manual')
mp_payment_id text,
mp_preference_id text,
mp_preapproval_id text, -- ID de la suscripción (si source = 'preapproval_webhook')
mp_fee_amount decimal(12, 2), -- Comisión cobrada por MP
mp_net_amount decimal(12, 2), -- Monto neto que recibió el negocio

-- Quién lo registró (solo relevante si source = 'manual')
registered_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes         text,

    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_loan_payments_loan ON public.loan_payments (loan_id);

CREATE INDEX idx_loan_payments_tenant ON public.loan_payments (tenant_id);

-- UNIQUE parcial: previene que el webhook de MP procese el mismo pago dos veces
CREATE UNIQUE INDEX idx_loan_payments_mp_id ON public.loan_payments (mp_payment_id)
WHERE
    mp_payment_id IS NOT NULL;

ALTER TABLE public.loan_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "loan_payments: members select" ON public.loan_payments FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.tenant_memberships m
            WHERE
                m.tenant_id = loan_payments.tenant_id
                AND m.user_id = auth.uid ()
        )
    );

CREATE POLICY "loan_payments: members insert" ON public.loan_payments FOR
INSERT
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM public.tenant_memberships m
            WHERE
                m.tenant_id = loan_payments.tenant_id
                AND m.user_id = auth.uid ()
        )
    );

-- Sin UPDATE/DELETE: los pagos son inmutables una vez registrados

COMMENT ON
TABLE public.loan_payments IS 'Historial de pagos individuales aplicados a un préstamo';

COMMENT ON COLUMN public.loan_payments.source IS 'manual=registrado por dueño, mercadopago_webhook=link MP, preapproval_webhook=cobro automático';

COMMENT ON COLUMN public.loan_payments.mp_fee_amount IS 'Comisión de MercadoPago descontada del pago';

COMMENT ON COLUMN public.loan_payments.mp_net_amount IS 'Monto neto recibido por el negocio después de comisión MP';

-- =============================================================================
-- 5. LOAN_BULK_PAYMENTS — Pagar múltiples préstamos en un solo link de MP
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.loan_bulk_payments (
    id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    customer_id uuid NOT NULL REFERENCES public.customers(id),

-- Datos del pago en MP
mp_preference_id text NOT NULL,
mp_payment_id text,
total_amount decimal(12, 2) NOT NULL CHECK (total_amount > 0),
status text NOT NULL DEFAULT 'pending' CHECK (
    status IN (
        'pending',
        'paid',
        'failed',
        'expired'
    )
),

-- IDs de los loans incluidos en este pago agrupado
loan_ids uuid[] NOT NULL,

-- Distribución del pago entre los loans: { "loanId1": 200.00, "loanId2": 150.00 }
-- Guardado para auditoría y para que el webhook sepa cuánto aplicar a cada loan
distribution jsonb NOT NULL,

    created_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- UNIQUE en mp_preference_id: un preference = un bulk payment
CREATE UNIQUE INDEX idx_bulk_payments_preference ON public.loan_bulk_payments (mp_preference_id);

-- UNIQUE parcial en mp_payment_id: previene duplicados del webhook
CREATE UNIQUE INDEX idx_bulk_payments_mp_id ON public.loan_bulk_payments (mp_payment_id)
WHERE
    mp_payment_id IS NOT NULL;

CREATE INDEX idx_bulk_payments_tenant ON public.loan_bulk_payments (tenant_id);

CREATE INDEX idx_bulk_payments_customer ON public.loan_bulk_payments (customer_id);

ALTER TABLE public.loan_bulk_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "loan_bulk_payments: members select" ON public.loan_bulk_payments FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.tenant_memberships m
            WHERE
                m.tenant_id = loan_bulk_payments.tenant_id
                AND m.user_id = auth.uid ()
        )
    );

CREATE POLICY "loan_bulk_payments: members insert" ON public.loan_bulk_payments FOR
INSERT
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM public.tenant_memberships m
            WHERE
                m.tenant_id = loan_bulk_payments.tenant_id
                AND m.user_id = auth.uid ()
        )
    );

CREATE POLICY "loan_bulk_payments: members update" ON public.loan_bulk_payments FOR
UPDATE USING (
    EXISTS (
        SELECT 1
        FROM public.tenant_memberships m
        WHERE
            m.tenant_id = loan_bulk_payments.tenant_id
            AND m.user_id = auth.uid ()
    )
);

COMMENT ON
TABLE public.loan_bulk_payments IS 'Pagos agrupados: un solo link de MP para liquidar múltiples préstamos de un cliente';

COMMENT ON COLUMN public.loan_bulk_payments.loan_ids IS 'Array de UUIDs de los préstamos incluidos en este pago agrupado';

COMMENT ON COLUMN public.loan_bulk_payments.distribution IS 'JSON: cuánto se aplica a cada loan. Ej: {"loanId1": 200.00, "loanId2": 150.00}';

-- =============================================================================
-- 6. TRIGGER — Actualizar loan al insertar un pago
--    Se dispara en AFTER INSERT ON loan_payments
--    Recalcula amount_paid, status y paid_at del préstamo
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_loan_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER   -- necesario para que el webhook (sin contexto de usuario) pueda actualizar
SET search_path = public
AS $$
DECLARE
    v_loan public.loans%ROWTYPE;
    v_new_amount_paid decimal(12,2);
BEGIN
    -- Bloquear la fila del préstamo para evitar condición de carrera
    -- (ej: webhook + pago manual simultáneos)
    SELECT * INTO v_loan
    FROM public.loans
    WHERE id = NEW.loan_id
    FOR UPDATE;

    v_new_amount_paid := v_loan.amount_paid + NEW.amount;

    UPDATE public.loans
    SET
        amount_paid = v_new_amount_paid,
        status = CASE
            WHEN v_new_amount_paid >= v_loan.amount THEN 'paid'
            WHEN v_new_amount_paid > 0              THEN 'partial'
            ELSE 'pending'
        END,
        -- Registrar timestamp exacto de liquidación total
        paid_at = CASE
            WHEN v_new_amount_paid >= v_loan.amount THEN now()
            ELSE NULL
        END,
        -- Si había un plan automático y se liquidó, marcarlo como completado
        payment_plan_status = CASE
            WHEN v_loan.payment_plan_type IS NOT NULL AND v_new_amount_paid >= v_loan.amount
                THEN 'completed'
            ELSE v_loan.payment_plan_status
        END,
        updated_at = now()
    WHERE id = NEW.loan_id;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_loan_on_payment
    AFTER INSERT ON public.loan_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_loan_on_payment();

COMMENT ON FUNCTION public.update_loan_on_payment () IS 'Actualiza amount_paid, status y paid_at del préstamo al insertar un pago. ' 'Usa FOR UPDATE para prevenir condición de carrera en pagos simultáneos.';

-- =============================================================================
-- 7. ALTER TABLE orders — Agregar customer_id (retrocompatible, nullable)
-- =============================================================================

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers (id) ON DELETE SET NULL;

-- Índice parcial: solo órdenes que tienen cliente vinculado
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders (customer_id)
WHERE
    customer_id IS NOT NULL;

COMMENT ON COLUMN public.orders.customer_id IS 'Cliente vinculado (nullable). NULL = orden creada antes del módulo de préstamos o sin cliente registrado.';

-- =============================================================================
-- FIN DE MIGRACIÓN
-- =============================================================================