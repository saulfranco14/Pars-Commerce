-- Alcance por rol para pedidos: quién ve qué, quién asigna, quién cierra.
--
-- Contexto: hoy `orders.read`/`orders.write` son binarios y la RLS de `orders`
-- solo comprueba membresía, así que cualquier miembro del negocio lee y edita
-- TODOS los pedidos. Un mesero ve el trabajo de los demás y puede cerrarlo.
--
-- Se copia el vocabulario que ya existe para ventas (`sales.view_all`,
-- `sales.view_assigned`, `sales.assign`) en vez de inventar un segundo, para
-- que autorizar pedidos se lea igual que autorizar ventas.
--
--   orders.view_all        ve todos los pedidos del negocio
--   orders.view_assigned   ve solo los pedidos asignados a esa persona
--   orders.assign          asigna y reasigna un pedido a otro miembro
--   orders.close           cierra/cancela un pedido
--   orders.addendum        crea la orden ligada a una ya pagada (ver Fase 3)
--   orders.schedule_config abre/cierra la recepción de pedidos agendados
--
-- `member` es el rol por omisión del selector de invitación, y hoy nace SIN
-- `orders.*` ni `order.take`. En la práctica eso significa que un negocio
-- invita a un mesero, no cambia el rol, y contrata a alguien que no puede
-- hacer el trabajo. Aquí se le dan los permisos básicos de piso.

-- 1) Negocios existentes. Un UPDATE por conjunto de permisos; el `NOT @>`
--    los hace idempotentes, así que reejecutar la migración no duplica nada.

-- owner: todo, incluidos los dos exclusivos suyos.
UPDATE public.tenant_roles
SET permissions = permissions || '["orders.view_all","orders.view_assigned","orders.assign","orders.close","orders.addendum","orders.schedule_config"]'::jsonb
WHERE name = 'owner'
  AND NOT (permissions @> '["orders.schedule_config"]'::jsonb);

-- cashier: el "responsable de pedidos". Recibe, cierra y reasigna, pero no
-- crea órdenes ligadas ni configura la agenda.
UPDATE public.tenant_roles
SET permissions = permissions || '["orders.view_all","orders.view_assigned","orders.assign","orders.close"]'::jsonb
WHERE name = 'cashier'
  AND NOT (permissions @> '["orders.close"]'::jsonb);

-- waiter: solo lo suyo. Sin view_all, sin assign, sin close.
UPDATE public.tenant_roles
SET permissions = permissions || '["orders.view_assigned"]'::jsonb
WHERE name = 'waiter'
  AND NOT (permissions @> '["orders.view_assigned"]'::jsonb);

-- member: hasta hoy no podía tomar pedidos siendo el rol por omisión.
UPDATE public.tenant_roles
SET permissions = permissions || '["orders.read","orders.write","order.take","orders.view_assigned"]'::jsonb
WHERE name = 'member'
  AND NOT (permissions @> '["order.take"]'::jsonb);

-- 2) Mantener el bootstrap de negocios nuevos en sintonía con lo de arriba.
--    Si estas listas y los UPDATE anteriores se despegan, un negocio nuevo y
--    uno viejo autorizan distinto — que es exactamente el bug que evita el
--    `NOT @>`: aquí las listas ya vienen completas.
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
    '["sales.read","sales.write","sales.view_all","sales.view_assigned","sales.assign","sales.update_assigned","products.read","products.write","inventory.read","inventory.write","promotions.read","promotions.write","reports.read","team.read","team.write","settings.read","settings.write","orders.read","orders.write","orders.view_all","orders.view_assigned","orders.assign","orders.close","orders.addendum","orders.schedule_config","payments.write","qr.read","qr.write","qr.fulfill","order.take"]'::jsonb,
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
