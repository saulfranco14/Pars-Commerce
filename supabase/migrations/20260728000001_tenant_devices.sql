-- Dispositivos del negocio: pantallas de autoservicio que operan SIN sesión de
-- empleado. El cliente pide solo, así que el dispositivo se autentica con un
-- token propio en vez de con una membresía.
--
-- El alcance del token es deliberadamente pobre — leer catálogo, crear un
-- pedido y leer ese pedido. El pago nunca pasa por la pantalla (el cliente
-- paga en su celular o en efectivo en el mostrador), así que un token filtrado
-- puede generar pedidos basura, que es molesto y revocable, pero no puede
-- mover dinero ni leer reportes.

-- token_hash: solo el hash, para que leer la tabla no dé un token usable.
-- pairing_code: código corto que se teclea una vez en la pantalla.
CREATE TABLE IF NOT EXISTS public.tenant_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'kiosk',
  token_hash text,
  pairing_code text,
  pairing_expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  paired_at timestamptz,
  last_seen_at timestamptz,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tenant_devices DROP CONSTRAINT IF EXISTS tenant_devices_kind_check;
ALTER TABLE public.tenant_devices
  ADD CONSTRAINT tenant_devices_kind_check CHECK (kind IN ('kiosk'));

COMMENT ON COLUMN public.tenant_devices.token_hash IS
  'SHA-256 del token del dispositivo. El token en claro solo existe en el dispositivo.';

-- Parciales: la enorme mayoría de las filas tiene uno de los dos en NULL.
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_devices_token
  ON public.tenant_devices (token_hash)
  WHERE token_hash IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_devices_pairing
  ON public.tenant_devices (pairing_code)
  WHERE pairing_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tenant_devices_tenant
  ON public.tenant_devices (tenant_id, created_at DESC);

ALTER TABLE public.tenant_devices ENABLE ROW LEVEL SECURITY;

-- Los miembros del negocio ven sus dispositivos. El dispositivo en sí NO entra
-- por aquí: se autentica con su token contra el service role, nunca con RLS.
DROP POLICY IF EXISTS "Tenant_devices: tenant members" ON public.tenant_devices;
CREATE POLICY "Tenant_devices: tenant members" ON public.tenant_devices
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_memberships m
      WHERE m.tenant_id = tenant_devices.tenant_id
        AND m.user_id = auth.uid()
    )
  );

-- Permiso para dar de alta y revocar dispositivos. Solo el dueño: emparejar
-- una pantalla es entregar una credencial que crea pedidos a nombre del
-- negocio.
UPDATE public.tenant_roles
SET permissions = permissions || '["devices.manage"]'::jsonb
WHERE name = 'owner'
  AND NOT (permissions @> '["devices.manage"]'::jsonb);

CREATE OR REPLACE FUNCTION public.handle_new_tenant()
RETURNS trigger AS $$
DECLARE
  owner_role_id uuid;
  member_role_id uuid;
BEGIN
  INSERT INTO public.tenant_roles (tenant_id, name, permissions, is_system)
  VALUES (
    NEW.id,
    'owner',
    '["sales.read","sales.write","sales.view_all","sales.view_assigned","sales.assign","sales.update_assigned","products.read","products.write","inventory.read","inventory.write","promotions.read","promotions.write","reports.read","team.read","team.write","settings.read","settings.write","orders.read","orders.write","orders.view_all","orders.view_assigned","orders.assign","orders.close","orders.addendum","orders.schedule_config","payments.write","qr.read","qr.write","qr.fulfill","order.take","devices.manage"]'::jsonb,
    true
  )
  RETURNING id INTO owner_role_id;

  INSERT INTO public.tenant_roles (tenant_id, name, permissions, is_system)
  VALUES (
    NEW.id,
    'member',
    '["sales.read","sales.write","sales.view_all","sales.view_assigned","sales.assign","sales.update_assigned","products.read","products.write","inventory.read","inventory.write","promotions.read","promotions.write","reports.read","team.read","orders.read","orders.write","orders.view_assigned","order.take"]'::jsonb,
    true
  )
  RETURNING id INTO member_role_id;

  INSERT INTO public.tenant_roles (tenant_id, name, permissions, is_system)
  VALUES (
    NEW.id,
    'cashier',
    '["sales.read","sales.write","sales.view_all","sales.view_assigned","orders.read","orders.write","orders.view_all","orders.view_assigned","orders.assign","orders.close","payments.write","qr.read","order.take"]'::jsonb,
    true
  );

  INSERT INTO public.tenant_roles (tenant_id, name, permissions, is_system)
  VALUES (
    NEW.id,
    'waiter',
    '["orders.read","orders.write","orders.view_assigned","qr.read","qr.fulfill","order.take"]'::jsonb,
    true
  );

  INSERT INTO public.tenant_site_pages (tenant_id, slug, title, position)
  VALUES
    (NEW.id, 'inicio', 'Inicio', 0),
    (NEW.id, 'productos', 'Productos', 1),
    (NEW.id, 'promociones', 'Promociones', 2),
    (NEW.id, 'nosotros', 'Nosotros', 3),
    (NEW.id, 'contacto', 'Contacto', 4);

  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.tenant_memberships (user_id, tenant_id, role_id, accepted_at)
    VALUES (auth.uid(), NEW.id, owner_role_id, now());
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
