-- Roles y permisos para operar el día: preparar, entregar y ver el dinero.
--
--   orders.prepare  avanza la preparación (recibido → en proceso → listo)
--   orders.deliver  registra salida, entrega y recolección
--   money.read      ve ingresos, ventas y liquidaciones
--
-- `qr.fulfill` cubría preparar Y entregar a la vez; aquí se separa para poder
-- dar uno sin el otro. Se conserva en las listas como alias legado: el código
-- (`PERMISSION_ALIASES` en `src/constants/permissionCatalog.ts`) acepta
-- `qr.fulfill` donde se pide `orders.prepare` u `orders.deliver`, así nada se
-- rompe si esta migración llega después que el código.
--
-- También agrega dos roles de sistema: `preparer` (Preparación) y `courier`
-- (Entregas), y las capacidades de plan `operations_board` y `custom_roles`,
-- activas en TODOS los planes por el lanzamiento. Volverlas de pago después es
-- un UPDATE sobre `billing_plans.entitlements`, sin desplegar código.

-- 1) Negocios existentes. Cada UPDATE es idempotente por su `NOT @>`.

-- Quien ya preparaba (owner, waiter) ahora también tiene las llaves nuevas.
UPDATE public.tenant_roles
SET permissions = permissions || '["orders.prepare","orders.deliver"]'::jsonb,
    updated_at = now()
WHERE permissions @> '["qr.fulfill"]'::jsonb
  AND NOT (permissions @> '["orders.prepare"]'::jsonb);

-- Ver el dinero era "ser owner"; ahora es un permiso que el owner puede delegar.
UPDATE public.tenant_roles
SET permissions = permissions || '["orders.prepare","orders.deliver","money.read"]'::jsonb,
    updated_at = now()
WHERE name = 'owner'
  AND NOT (permissions @> '["money.read"]'::jsonb);

-- Roles nuevos para cada negocio que aún no los tenga. No hay UNIQUE
-- (tenant_id, name) en `tenant_roles`, por eso NOT EXISTS.
INSERT INTO public.tenant_roles (tenant_id, name, permissions, is_system)
SELECT t.id, 'preparer', '["orders.read","orders.view_assigned","orders.prepare"]'::jsonb, true
FROM public.tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM public.tenant_roles r WHERE r.tenant_id = t.id AND r.name = 'preparer'
);

INSERT INTO public.tenant_roles (tenant_id, name, permissions, is_system)
SELECT t.id, 'courier', '["orders.read","orders.view_assigned","orders.deliver"]'::jsonb, true
FROM public.tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM public.tenant_roles r WHERE r.tenant_id = t.id AND r.name = 'courier'
);

-- 2) Negocios nuevos: mismas listas que arriba, para que nuevo y viejo
--    autoricen igual. Copia de 20260728000001 + permisos y roles nuevos.
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
    '["sales.read","sales.write","sales.view_all","sales.view_assigned","sales.assign","sales.update_assigned","products.read","products.write","inventory.read","inventory.write","promotions.read","promotions.write","reports.read","team.read","team.write","settings.read","settings.write","orders.read","orders.write","orders.view_all","orders.view_assigned","orders.assign","orders.close","orders.addendum","orders.schedule_config","orders.prepare","orders.deliver","payments.write","money.read","qr.read","qr.write","qr.fulfill","order.take","devices.manage"]'::jsonb,
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
    '["orders.read","orders.write","orders.view_assigned","orders.prepare","orders.deliver","qr.read","qr.fulfill","order.take"]'::jsonb,
    true
  );

  INSERT INTO public.tenant_roles (tenant_id, name, permissions, is_system)
  VALUES (
    NEW.id,
    'preparer',
    '["orders.read","orders.view_assigned","orders.prepare"]'::jsonb,
    true
  );

  INSERT INTO public.tenant_roles (tenant_id, name, permissions, is_system)
  VALUES (
    NEW.id,
    'courier',
    '["orders.read","orders.view_assigned","orders.deliver"]'::jsonb,
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

-- 3) Capacidades de plan: gratis en el lanzamiento, listas para cobrarse.
UPDATE public.billing_plans
SET entitlements = entitlements || '{"operations_board":true,"custom_roles":true}'::jsonb
WHERE NOT (entitlements ? 'operations_board');
