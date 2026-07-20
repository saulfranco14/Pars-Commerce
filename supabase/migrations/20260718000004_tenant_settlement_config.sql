-- =============================================================================
-- tenant_settlement_config — el ciclo de liquidación de cada negocio (S4).
--
-- Cada negocio elige cada cuánto se le liquida (diario/semanal/quincenal/
-- mensual/personalizado). El scheduler (S4) lee esta config para saber cuándo
-- cerrar el ciclo de cada tenant, y createSettlement (S3) usa el ciclo para la
-- comisión (S2).
--
-- Separación de poderes (importante — es dinero):
--  - El OWNER del negocio elige su `cycle_type` (y custom_cycle_days).
--  - El `commission_override` (comisión negociada por contrato) SOLO lo fija la
--    plataforma (service_role). Un negocio no puede bajarse su propia comisión.
--    Por eso la política de UPDATE del owner excluye esa columna a nivel de app
--    (el endpoint no la acepta del owner); a nivel DB, el owner puede escribir
--    la fila pero el endpoint controla qué campos.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.tenant_settlement_config (
  tenant_id            uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,

  cycle_type           text NOT NULL DEFAULT 'weekly' CHECK (
    cycle_type IN ('daily', 'weekly', 'biweekly', 'monthly', 'custom')
  ),
  -- Solo para cycle_type='custom': cada cuántos días se liquida.
  custom_cycle_days    int CHECK (custom_cycle_days IS NULL OR custom_cycle_days >= 1),

  -- Comisión negociada por contrato (0–1). NULL = usar el escalón por ciclo
  -- (PLATFORM_COMMISSION_BY_CYCLE). Solo la plataforma la fija.
  commission_override  numeric CHECK (
    commission_override IS NULL OR (commission_override >= 0 AND commission_override <= 1)
  ),

  -- Marca del último cierre, para que el scheduler sepa desde cuándo liquidar.
  last_settled_at      timestamptz,

  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),

  -- Un ciclo 'custom' debe traer sus días.
  CONSTRAINT custom_needs_days CHECK (
    cycle_type <> 'custom' OR custom_cycle_days IS NOT NULL
  )
);

COMMENT ON TABLE public.tenant_settlement_config IS
  'S4: ciclo de liquidación por negocio. cycle_type lo elige el owner; commission_override solo la plataforma.';

ALTER TABLE public.tenant_settlement_config ENABLE ROW LEVEL SECURITY;

-- Owner lee y escribe su config; platform_admin lee todo; service_role total.
DROP POLICY IF EXISTS "settlement_config: owner read" ON public.tenant_settlement_config;
CREATE POLICY "settlement_config: owner read" ON public.tenant_settlement_config
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_memberships m
      JOIN public.tenant_roles r ON r.id = m.role_id
      WHERE m.tenant_id = tenant_settlement_config.tenant_id
        AND m.user_id = auth.uid() AND r.name = 'owner'
    )
    OR EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "settlement_config: service role" ON public.tenant_settlement_config;
CREATE POLICY "settlement_config: service role" ON public.tenant_settlement_config
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
