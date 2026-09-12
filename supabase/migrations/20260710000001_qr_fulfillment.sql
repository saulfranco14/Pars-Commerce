-- QR fulfillment: real, staff-controlled preparation state + dedicated permission.
--
-- Multi-business (multinegocio): an order progresses through a fulfillment
-- lifecycle that is INDEPENDENT of the payment lifecycle (`orders.status`):
--   received  -> the customer sent the items, business hasn't started
--   in_progress -> staff is working on it
--   ready     -> done; the customer can now pay
--
-- The customer cannot pay until fulfillment_status = 'ready'. Only staff with
-- the `qr.fulfill` permission (owner + waiter, NOT cashier) can advance it.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS fulfillment_status text NOT NULL DEFAULT 'received';

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_fulfillment_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_fulfillment_status_check
  CHECK (fulfillment_status IN ('received', 'in_progress', 'ready'));

-- Grant qr.fulfill to owner + waiter roles on existing tenants (idempotent).
UPDATE public.tenant_roles
SET permissions = permissions || '["qr.fulfill"]'::jsonb
WHERE name IN ('owner', 'waiter')
  AND NOT (permissions @> '["qr.fulfill"]'::jsonb);

-- Keep new-tenant bootstrap in sync: owner + waiter get qr.fulfill.
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
    '["sales.read","sales.write","sales.view_all","sales.view_assigned","sales.assign","sales.update_assigned","products.read","products.write","inventory.read","inventory.write","promotions.read","promotions.write","reports.read","team.read","team.write","settings.read","settings.write","orders.read","orders.write","payments.write","qr.read","qr.write","qr.fulfill"]'::jsonb,
    true
  )
  RETURNING id INTO owner_role_id;

  INSERT INTO public.tenant_roles (tenant_id, name, permissions, is_system)
  VALUES (
    NEW.id,
    'member',
    '["sales.read","sales.write","sales.view_all","sales.view_assigned","sales.assign","sales.update_assigned","products.read","products.write","inventory.read","inventory.write","promotions.read","promotions.write","reports.read","team.read"]'::jsonb,
    true
  )
  RETURNING id INTO member_role_id;

  INSERT INTO public.tenant_roles (tenant_id, name, permissions, is_system)
  VALUES (
    NEW.id,
    'cashier',
    '["sales.read","sales.write","sales.view_all","sales.view_assigned","orders.read","orders.write","payments.write","qr.read"]'::jsonb,
    true
  );

  INSERT INTO public.tenant_roles (tenant_id, name, permissions, is_system)
  VALUES (
    NEW.id,
    'waiter',
    '["orders.read","orders.write","qr.read","qr.fulfill"]'::jsonb,
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
