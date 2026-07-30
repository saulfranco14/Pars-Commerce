-- Rehace `tenant_devices` con el alta al revés.
--
-- El modelo anterior hacía que el dueño diera de alta un nombre a ciegas y
-- luego alguien tecleara un código en la pantalla. No sirve: el dueño no sabe
-- qué dispositivo es hasta que lo tiene enfrente.
--
-- Ahora la pantalla se anuncia sola al abrirse: manda su `install_id`, su
-- navegador y su resolución, y muestra un código de verificación bien grande.
-- El dueño ve la solicitud en el panel con esos datos, compara el código con
-- lo que dice la pantalla y aprueba. El token se acuña en ese momento, cuando
-- la pantalla lo reclama, así que nunca se guarda en claro.
--
-- La tabla se recrea porque no tiene filas: el diseño anterior nunca se usó.

DROP TABLE IF EXISTS public.tenant_devices CASCADE;

CREATE TABLE public.tenant_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

  install_id text NOT NULL,
  enroll_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending',

  name text,
  kind text NOT NULL DEFAULT 'kiosk',

  user_agent text,
  screen_info text,

  token_hash text,

  requested_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  last_seen_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tenant_devices
  ADD CONSTRAINT tenant_devices_status_check
  CHECK (status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.tenant_devices
  ADD CONSTRAINT tenant_devices_kind_check CHECK (kind IN ('kiosk'));

COMMENT ON COLUMN public.tenant_devices.token_hash IS
  'SHA-256 del token. El token en claro solo existe en el dispositivo.';
COMMENT ON COLUMN public.tenant_devices.install_id IS
  'Lo genera el dispositivo y lo guarda en localStorage; sobrevive recargas.';
COMMENT ON COLUMN public.tenant_devices.enroll_code IS
  'Se muestra en la pantalla para que el dueño compare antes de aprobar.';

-- Una pantalla vuelve a pedir permiso con el mismo install_id tras recargar;
-- por negocio no puede haber dos solicitudes de la misma instalación.
CREATE UNIQUE INDEX idx_tenant_devices_install
  ON public.tenant_devices (tenant_id, install_id);

CREATE UNIQUE INDEX idx_tenant_devices_token
  ON public.tenant_devices (token_hash)
  WHERE token_hash IS NOT NULL;

CREATE INDEX idx_tenant_devices_pending
  ON public.tenant_devices (tenant_id, requested_at DESC)
  WHERE status = 'pending';

CREATE INDEX idx_tenant_devices_tenant
  ON public.tenant_devices (tenant_id, created_at DESC);

ALTER TABLE public.tenant_devices ENABLE ROW LEVEL SECURITY;

-- Los miembros ven los dispositivos de su negocio. El dispositivo en sí NO
-- entra por aquí: se autentica con su token contra el service role.
CREATE POLICY "Tenant_devices: tenant members" ON public.tenant_devices
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_memberships m
      WHERE m.tenant_id = tenant_devices.tenant_id
        AND m.user_id = auth.uid()
    )
  );
