-- La primera pauta de apertura sólo pide lo necesario para identificar al
-- negocio. Los demás datos se completan de forma progresiva.
ALTER TABLE public.tenant_legal_profiles
  ALTER COLUMN tax_id DROP NOT NULL,
  ALTER COLUMN city DROP NOT NULL,
  ALTER COLUMN state DROP NOT NULL,
  ALTER COLUMN postal_code DROP NOT NULL,
  ALTER COLUMN contractual_email DROP NOT NULL,
  ALTER COLUMN public_seller_name DROP NOT NULL,
  ALTER COLUMN public_privacy_contact DROP NOT NULL;
