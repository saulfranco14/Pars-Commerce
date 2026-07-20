-- =============================================================================
-- feature_interest — "me interesa" de novedades por negocio.
--
-- Cuando un negocio pulsa "Me interesa" en una novedad (facturación, entrega a
-- domicilio…), se registra aquí. Sirve para dos cosas: lista de espera (a
-- quién avisar cuando se libere) y, sobre todo, SEÑAL DE DEMANDA — el super
-- admin ve cuántos negocios quieren cada feature y prioriza el roadmap con
-- datos reales, no corazonada.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.feature_interest (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  -- Clave estable de la feature (ej. 'facturacion', 'domicilio'). Texto libre
  -- a propósito: el catálogo de novedades vive en el código (constants), no en
  -- una FK, para poder agregar novedades sin migración.
  feature_key  text NOT NULL,
  created_by   uuid REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),

  -- Un interés por (negocio, feature): pulsar dos veces no duplica.
  UNIQUE (tenant_id, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_feature_interest_feature
  ON public.feature_interest (feature_key);

COMMENT ON TABLE public.feature_interest IS
  'Novedades: "me interesa" por negocio. UNIQUE(tenant_id, feature_key). Señal de demanda para el roadmap.';

ALTER TABLE public.feature_interest ENABLE ROW LEVEL SECURITY;

-- El owner del negocio lee/gestiona su propio interés; platform_admin ve todo.
DROP POLICY IF EXISTS "feature_interest: owner read" ON public.feature_interest;
CREATE POLICY "feature_interest: owner read" ON public.feature_interest
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_memberships m
      JOIN public.tenant_roles r ON r.id = m.role_id
      WHERE m.tenant_id = feature_interest.tenant_id
        AND m.user_id = auth.uid() AND r.name = 'owner'
    )
    OR EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "feature_interest: service role" ON public.feature_interest;
CREATE POLICY "feature_interest: service role" ON public.feature_interest
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
