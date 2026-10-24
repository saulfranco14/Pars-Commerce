-- La sugerencia elegida en Maps queda dentro del expediente privado. Sirve
-- para evitar domicilios ambiguos; nunca se publica en la tienda.
ALTER TABLE public.tenant_legal_profiles
  ADD COLUMN IF NOT EXISTS address_place_id text,
  ADD COLUMN IF NOT EXISTS address_latitude double precision,
  ADD COLUMN IF NOT EXISTS address_longitude double precision;

ALTER TABLE public.tenant_legal_profiles
  ADD CONSTRAINT tenant_legal_profiles_address_latitude_range
    CHECK (address_latitude IS NULL OR address_latitude BETWEEN -90 AND 90),
  ADD CONSTRAINT tenant_legal_profiles_address_longitude_range
    CHECK (address_longitude IS NULL OR address_longitude BETWEEN -180 AND 180);
