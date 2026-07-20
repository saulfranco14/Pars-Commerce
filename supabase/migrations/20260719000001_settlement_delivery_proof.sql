-- =============================================================================
-- Comprobante de entrega de liquidación: nota + foto (S3.confirm extendido).
--
-- Cuando la plataforma le entrega el dinero al negocio (por ahora manual: sale
-- de la cuenta MP de la plataforma y se transfiere fuera del sistema), al
-- confirmar se registra evidencia: una NOTA de texto y opcionalmente una FOTO
-- del comprobante (SPEI, depósito). Es la referencia probatoria de "te entregué
-- tu dinero", visible para el negocio.
--
-- Bucket PRIVADO (no público como product-images): es información financiera.
-- Sube solo la plataforma (service_role / platform_admin); lee el owner del
-- negocio de esa liquidación y los platform_admins.
-- =============================================================================

-- Columnas de evidencia en settlements.
ALTER TABLE public.settlements
  ADD COLUMN IF NOT EXISTS transfer_note      text,
  ADD COLUMN IF NOT EXISTS transfer_proof_url text;

COMMENT ON COLUMN public.settlements.transfer_note IS
  'Nota de la entrega del dinero al negocio (evidencia de confirmación).';
COMMENT ON COLUMN public.settlements.transfer_proof_url IS
  'URL del comprobante (foto del SPEI/depósito) en el bucket settlement-proofs.';

-- Bucket privado para los comprobantes.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'settlement-proofs',
  'settlement-proofs',
  false,  -- PRIVADO
  12582912,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Subida: solo platform_admins (la plataforma entrega el dinero, no el negocio).
DROP POLICY IF EXISTS "Settlement proofs: platform admin upload" ON storage.objects;
CREATE POLICY "Settlement proofs: platform admin upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'settlement-proofs'
  AND EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Settlement proofs: platform admin update" ON storage.objects;
CREATE POLICY "Settlement proofs: platform admin update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'settlement-proofs'
  AND EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid())
);

-- Lectura: el owner del negocio de ESA liquidación, o un platform_admin. El
-- path del objeto empieza por el tenant_id ((storage.foldername(name))[1]).
DROP POLICY IF EXISTS "Settlement proofs: owner or admin read" ON storage.objects;
CREATE POLICY "Settlement proofs: owner or admin read"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'settlement-proofs'
  AND (
    EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.tenant_memberships m
      JOIN public.tenant_roles r ON r.id = m.role_id
      WHERE m.user_id = auth.uid()
        AND r.name = 'owner'
        AND m.tenant_id = ((storage.foldername(name))[1])::uuid
    )
  )
);
