-- tenant_sales_config: renta mensual y objetivo de ventas por negocio

CREATE TABLE IF NOT EXISTS public.tenant_sales_config (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants (id) ON DELETE CASCADE,
  monthly_rent decimal(12, 2) NOT NULL DEFAULT 0,
  monthly_sales_objective decimal(12, 2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tenant_sales_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_sales_config: tenant members can read"
  ON public.tenant_sales_config FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_memberships m
      WHERE m.tenant_id = tenant_sales_config.tenant_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "tenant_sales_config: owner or settings.write can insert"
  ON public.tenant_sales_config FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_memberships m
      JOIN public.tenant_roles r ON r.id = m.role_id
      WHERE m.tenant_id = tenant_sales_config.tenant_id AND m.user_id = auth.uid()
      AND (r.name = 'owner' OR (r.permissions::jsonb ? 'settings.write'))
    )
  );

CREATE POLICY "tenant_sales_config: owner or settings.write can update"
  ON public.tenant_sales_config FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_memberships m
      JOIN public.tenant_roles r ON r.id = m.role_id
      WHERE m.tenant_id = tenant_sales_config.tenant_id AND m.user_id = auth.uid()
      AND (r.name = 'owner' OR (r.permissions::jsonb ? 'settings.write'))
    )
  );

COMMENT ON TABLE public.tenant_sales_config IS 'Renta mensual y objetivo de ventas por negocio';
