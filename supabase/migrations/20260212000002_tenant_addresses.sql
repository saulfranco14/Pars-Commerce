CREATE TABLE IF NOT EXISTS public.tenant_addresses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  street text,
  city text,
  state text,
  postal_code text,
  country text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id)
);

ALTER TABLE public.tenant_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_addresses: tenant members can read"
  ON public.tenant_addresses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_memberships m
      WHERE m.tenant_id = tenant_addresses.tenant_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "tenant_addresses: tenant members with write can insert"
  ON public.tenant_addresses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_memberships m
      JOIN public.tenant_roles r ON r.id = m.role_id
      WHERE m.tenant_id = tenant_addresses.tenant_id AND m.user_id = auth.uid()
      AND (r.name = 'owner' OR (r.permissions::jsonb ? 'settings.write'))
    )
  );

CREATE POLICY "tenant_addresses: tenant members with write can update"
  ON public.tenant_addresses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_memberships m
      JOIN public.tenant_roles r ON r.id = m.role_id
      WHERE m.tenant_id = tenant_addresses.tenant_id AND m.user_id = auth.uid()
      AND (r.name = 'owner' OR (r.permissions::jsonb ? 'settings.write'))
    )
  );

COMMENT ON TABLE public.tenant_addresses IS 'Direccion del negocio para ticket y facturacion';
