-- Sales cutoffs: cortes de caja para snapshot de períodos de ventas

CREATE TABLE IF NOT EXISTS public.sales_cutoffs (
    id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Período exacto que cubre este corte.
    -- period_start = period_end del corte anterior, o created_at del tenant si es el primero.
    -- period_end   = timestamp exacto en que el admin generó el corte (NOW()).
    period_start  timestamptz NOT NULL,
    period_end    timestamptz NOT NULL,

    -- Snapshot de totales del período (inmutable una vez creado)
    total_orders    integer        NOT NULL DEFAULT 0,
    total_revenue   decimal(12,2)  NOT NULL DEFAULT 0,
    total_cost      decimal(12,2)  NOT NULL DEFAULT 0,
    gross_profit    decimal(12,2)  NOT NULL DEFAULT 0,

    -- Comisiones en el período al momento del corte (solo informativo)
    commissions_pending  integer NOT NULL DEFAULT 0,
    commissions_paid     integer NOT NULL DEFAULT 0,

    -- Snapshot por persona: [{user_id, display_name, total_revenue, commission_amount, orders_count}]
    breakdown_by_person         jsonb,

    -- Snapshot por método de pago: {efectivo: X, transferencia: X, tarjeta: X, mercadopago: X, other: X}
    breakdown_by_payment_method jsonb,

    -- Quién generó el corte (solo owner/admin, verificado en la API)
    created_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,

    -- Nota opcional del admin ("Corte quincenal", "Fin de semana", etc.)
    notes       text,

    created_at  timestamptz NOT NULL DEFAULT now()
    -- Sin updated_at: un corte es inmutable una vez generado
);

CREATE INDEX idx_sales_cutoffs_tenant
    ON public.sales_cutoffs(tenant_id);

CREATE INDEX idx_sales_cutoffs_tenant_period
    ON public.sales_cutoffs(tenant_id, period_end DESC);

ALTER TABLE public.sales_cutoffs ENABLE ROW LEVEL SECURITY;

-- Todos los miembros del tenant pueden leer los cortes
CREATE POLICY "sales_cutoffs: members read"
  ON public.sales_cutoffs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_memberships m
      WHERE m.tenant_id = sales_cutoffs.tenant_id
        AND m.user_id = auth.uid()
    )
  );

-- INSERT permitido a miembros; la restricción de owner/admin se aplica en la API
CREATE POLICY "sales_cutoffs: members insert"
  ON public.sales_cutoffs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_memberships m
      WHERE m.tenant_id = sales_cutoffs.tenant_id
        AND m.user_id = auth.uid()
    )
  );

-- Sin políticas UPDATE/DELETE: los cortes son inmutables

COMMENT ON TABLE public.sales_cutoffs IS 'Cortes de caja: snapshots inmutables de períodos de ventas generados por el admin';
COMMENT ON COLUMN public.sales_cutoffs.period_start IS 'Inicio del período (period_end del corte anterior o created_at del tenant)';
COMMENT ON COLUMN public.sales_cutoffs.period_end IS 'Fin del período (NOW() en el momento de generar el corte)';
COMMENT ON COLUMN public.sales_cutoffs.commissions_pending IS 'Comisiones sin pagar en el período al momento del corte (informativo)';
COMMENT ON COLUMN public.sales_cutoffs.breakdown_by_person IS 'JSON snapshot: [{user_id, display_name, total_revenue, commission_amount, orders_count}]';
COMMENT ON COLUMN public.sales_cutoffs.breakdown_by_payment_method IS 'JSON snapshot: {efectivo, transferencia, tarjeta, mercadopago, other}';
