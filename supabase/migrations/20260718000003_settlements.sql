-- =============================================================================
-- settlements + settlement_items — liquidaciones plataforma→negocio (S3).
--
-- El corazón del settlement: cada `settlement` es UNA liquidación de un periodo
-- para un negocio — cuánto entró por MP, cuánto es fee de MP, la comisión de
-- plataforma (S2), y cuánto se transfiere. Con ciclo de vida auditable:
--   open → closed → transfer_pending → transfer_confirmed  (+ disputed)
--
-- `settlement_items` es la tabla puente: lista EXACTAMENTE qué cobros del
-- payment_ledger entraron en cada liquidación. Así un cobro se liquida una sola
-- vez (unique por source), y cada settlement es trazable hasta el movimiento.
--
-- Solo se liquida dinero CUSTODIADO por la plataforma (MP). El efectivo/
-- transferencia del negocio no entra aquí (ya es suyo).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.settlements (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

  cycle_type             text NOT NULL CHECK (
    cycle_type IN ('daily', 'weekly', 'biweekly', 'monthly', 'custom')
  ),
  period_start           timestamptz NOT NULL,
  period_end             timestamptz NOT NULL,

  -- Montos (todos sobre dinero MP custodiado).
  gross_mp_amount        numeric NOT NULL DEFAULT 0 CHECK (gross_mp_amount >= 0),
  mp_fees_total          numeric NOT NULL DEFAULT 0 CHECK (mp_fees_total >= 0),
  net_mp_amount          numeric NOT NULL DEFAULT 0 CHECK (net_mp_amount >= 0),
  commission_percent     numeric NOT NULL DEFAULT 0 CHECK (commission_percent >= 0 AND commission_percent <= 1),
  platform_commission    numeric NOT NULL DEFAULT 0 CHECK (platform_commission >= 0),
  amount_to_transfer     numeric NOT NULL DEFAULT 0 CHECK (amount_to_transfer >= 0),

  status                 text NOT NULL DEFAULT 'open' CHECK (
    status IN ('open', 'closed', 'transfer_pending', 'transfer_confirmed', 'disputed')
  ),

  -- Auditoría de la transferencia ("ya te pagué / lo recibí").
  transfer_reference     text,
  transfer_confirmed_at  timestamptz,
  transfer_confirmed_by  uuid REFERENCES auth.users(id),

  -- Snapshot inmutable del cálculo del periodo (como sales_cutoffs) — para que
  -- la liquidación sea auditable aunque los datos fuente cambien después.
  snapshot               jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),

  -- Un periodo no se liquida dos veces para el mismo negocio.
  UNIQUE (tenant_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_settlements_tenant_status
  ON public.settlements (tenant_id, status, period_end DESC);

COMMENT ON TABLE public.settlements IS
  'S3: liquidaciones plataforma→negocio del dinero MP. Ciclo: open→closed→transfer_pending→transfer_confirmed.';

-- Tabla puente: qué cobros del ledger componen cada liquidación.
CREATE TABLE IF NOT EXISTS public.settlement_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id     uuid NOT NULL REFERENCES public.settlements(id) ON DELETE CASCADE,
  -- Referencia al movimiento del ledger (payment_ledger no tiene PK propia; se
  -- identifica por source_table + source_id).
  source_table      text NOT NULL,
  source_id         uuid NOT NULL,
  gross_amount      numeric NOT NULL,
  fee_amount        numeric NOT NULL DEFAULT 0,
  net_amount        numeric NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),

  -- Un cobro entra en UNA sola liquidación (idempotencia del vínculo).
  UNIQUE (source_table, source_id)
);

CREATE INDEX IF NOT EXISTS idx_settlement_items_settlement
  ON public.settlement_items (settlement_id);

COMMENT ON TABLE public.settlement_items IS
  'S3: puente cobro→liquidación. UNIQUE(source_table, source_id) garantiza que un cobro se liquida una sola vez.';

-- =============================================================================
-- RLS. Un settlement es dinero que la plataforma le debe al negocio, así que:
--  - el OWNER del tenant puede LEER sus settlements (ver cuánto le toca).
--  - la escritura/gestión es de la plataforma (service_role) — cerrar ciclos,
--    confirmar transferencias. No se expone escritura por API de tenant.
--  - platform_admins pueden leer todo (cross-tenant) para operar.
-- =============================================================================
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlement_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settlements: tenant owner read" ON public.settlements;
CREATE POLICY "settlements: tenant owner read" ON public.settlements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_memberships m
      JOIN public.tenant_roles r ON r.id = m.role_id
      WHERE m.tenant_id = settlements.tenant_id
        AND m.user_id = auth.uid()
        AND r.name = 'owner'
    )
    OR EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "settlements: service role" ON public.settlements;
CREATE POLICY "settlements: service role" ON public.settlements
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "settlement_items: read via settlement" ON public.settlement_items;
CREATE POLICY "settlement_items: read via settlement" ON public.settlement_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.settlements s
      WHERE s.id = settlement_items.settlement_id
        AND (
          EXISTS (
            SELECT 1 FROM public.tenant_memberships m
            JOIN public.tenant_roles r ON r.id = m.role_id
            WHERE m.tenant_id = s.tenant_id AND m.user_id = auth.uid() AND r.name = 'owner'
          )
          OR EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS "settlement_items: service role" ON public.settlement_items;
CREATE POLICY "settlement_items: service role" ON public.settlement_items
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
