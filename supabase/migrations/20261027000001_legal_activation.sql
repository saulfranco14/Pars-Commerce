-- Legal activation: contracts are versioned records, never a mutable flag in
-- tenant.settings.  All writes happen through protected server routes.

-- Supabase instala extensiones fuera de `public`; calificar la función evita
-- depender del search_path de la sesión que aplique la migración.
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.legal_document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type text NOT NULL CHECK (document_type IN ('saas_terms', 'privacy_notice', 'data_processing', 'exit_policy', 'merchant_terms', 'merchant_privacy')),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE RESTRICT,
  version text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  content_hash text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'superseded')),
  effective_at timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT (document_type, tenant_id, version)
);
CREATE UNIQUE INDEX IF NOT EXISTS legal_document_versions_current_platform
  ON public.legal_document_versions(document_type, version)
  WHERE tenant_id IS NULL;

CREATE OR REPLACE FUNCTION public.reject_legal_document_version_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Las versiones legales son inmutables; publica una nueva versión.';
END;
$$;

DROP TRIGGER IF EXISTS legal_document_versions_immutable ON public.legal_document_versions;
CREATE TRIGGER legal_document_versions_immutable
  BEFORE UPDATE OR DELETE ON public.legal_document_versions
  FOR EACH ROW EXECUTE FUNCTION public.reject_legal_document_version_mutation();

CREATE TABLE IF NOT EXISTS public.tenant_legal_profiles (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE RESTRICT,
  party_type text NOT NULL CHECK (party_type IN ('individual', 'company')),
  legal_name text NOT NULL CHECK (char_length(trim(legal_name)) >= 3),
  tax_id text NOT NULL CHECK (char_length(trim(tax_id)) BETWEEN 10 AND 16),
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text NOT NULL,
  country text NOT NULL DEFAULT 'México',
  contractual_email text NOT NULL,
  contractual_phone text NOT NULL,
  representative_name text,
  representative_role text,
  public_seller_name text NOT NULL,
  public_privacy_contact text NOT NULL,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((party_type = 'individual') OR (representative_name IS NOT NULL AND representative_role IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS public.tenant_legal_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  accepted_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  legal_profile_snapshot jsonb NOT NULL,
  document_snapshot jsonb NOT NULL,
  declaration text NOT NULL,
  interface_version text NOT NULL DEFAULT 'legal-opening-card-v1',
  idempotency_key text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  evidence_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS tenant_legal_acceptances_current_idx
  ON public.tenant_legal_acceptances(tenant_id, accepted_at DESC);

CREATE TABLE IF NOT EXISTS public.tenant_checkout_legal_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  order_id uuid REFERENCES public.orders(id) ON DELETE RESTRICT,
  cart_id uuid REFERENCES public.public_carts(id) ON DELETE RESTRICT,
  document_snapshot jsonb NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  acceptance_kind text NOT NULL CHECK (acceptance_kind IN ('order_terms', 'recurring_mandate', 'marketing')),
  accepted boolean NOT NULL,
  fingerprint_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tenant_checkout_legal_acceptances_order_idx
  ON public.tenant_checkout_legal_acceptances(order_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.legal_data_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  requested_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'failed', 'expired')),
  storage_path text,
  expires_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.legal_closure_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  requested_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'export_pending', 'ready_to_close', 'closed', 'blocked')),
  export_id uuid REFERENCES public.legal_data_exports(id) ON DELETE RESTRICT,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.privacy_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE RESTRICT,
  requested_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  request_type text NOT NULL CHECK (request_type IN ('access', 'rectification', 'cancellation', 'opposition', 'revocation')),
  contact_email text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'in_review', 'resolved', 'rejected')),
  due_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE public.legal_document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_legal_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_legal_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_checkout_legal_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_data_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_closure_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "legal documents service role" ON public.legal_document_versions
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "legal profile service role" ON public.tenant_legal_profiles
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "legal acceptance service role" ON public.tenant_legal_acceptances
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "checkout legal acceptance service role" ON public.tenant_checkout_legal_acceptances
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "legal exports service role" ON public.legal_data_exports
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "legal closures service role" ON public.legal_closure_requests
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "privacy requests service role" ON public.privacy_requests
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

INSERT INTO storage.buckets (id, name, public)
VALUES ('legal-evidence', 'legal-evidence', false), ('legal-exports', 'legal-exports', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- These are product drafts to be replaced by counsel-approved text before the
-- migration is applied to production. The immutable versioning is the safety
-- property; publishing a new text creates a new row.
INSERT INTO public.legal_document_versions (document_type, tenant_id, version, title, content, content_hash, status, effective_at, published_at)
VALUES
  ('saas_terms', NULL, '2026-10-27.1', 'Contrato de uso de Tlaco', 'Tlaco ofrece acceso a su plataforma para administrar el negocio. El contratante conserva sus contenidos, usa la plataforma conforme a la ley y puede solicitar la salida de sus datos conforme a la política aplicable.', encode(extensions.digest('Tlaco ofrece acceso a su plataforma para administrar el negocio. El contratante conserva sus contenidos, usa la plataforma conforme a la ley y puede solicitar la salida de sus datos conforme a la política aplicable.', 'sha256'), 'hex'), 'published', now(), now()),
  ('privacy_notice', NULL, '2026-10-27.1', 'Aviso de privacidad de Tlaco', 'Tlaco trata los datos de cuenta y soporte necesarios para prestar el servicio. Los datos de clientes del negocio son tratados por el negocio responsable y Tlaco actúa para operar la plataforma.', encode(extensions.digest('Tlaco trata los datos de cuenta y soporte necesarios para prestar el servicio. Los datos de clientes del negocio son tratados por el negocio responsable y Tlaco actúa para operar la plataforma.', 'sha256'), 'hex'), 'published', now(), now()),
  ('data_processing', NULL, '2026-10-27.1', 'Anexo de tratamiento de datos', 'Tlaco procesa los datos del negocio siguiendo las instrucciones necesarias para prestar la plataforma y aplica controles de acceso y separación por negocio.', encode(extensions.digest('Tlaco procesa los datos del negocio siguiendo las instrucciones necesarias para prestar la plataforma y aplica controles de acceso y separación por negocio.', 'sha256'), 'hex'), 'published', now(), now()),
  ('exit_policy', NULL, '2026-10-27.1', 'Política de salida de datos', 'El negocio puede solicitar una exportación y el cierre. Tlaco no borra antes de entregar o resolver la exportación y conserva únicamente lo exigible por obligaciones aplicables.', encode(extensions.digest('El negocio puede solicitar una exportación y el cierre. Tlaco no borra antes de entregar o resolver la exportación y conserva únicamente lo exigible por obligaciones aplicables.', 'sha256'), 'hex'), 'published', now(), now())
ON CONFLICT DO NOTHING;
