-- Staff-initiated orders: a new QR kind for single-use counter tickets, plus a
-- dedicated permission so waiter/cashier (not just owner) can take orders.
--
-- Context: today qr_codes.kind allows only 'payment' | 'table', and creating/
-- linking a QR requires qr.write which only owner holds. A staff member taking
-- a walk-up order needs neither the full config power (qr.write) nor a table.
--
-- 'order' QR = a disposable ticket bound to one staff-built order; archived on
-- pay. It uses current_order_id only (no table_capacity, no preset_amount).

-- 1a) Allow kind 'order'. The original CHECK is inline (Postgres default name
--     qr_codes_kind_check); drop-if-exists then add the named constraint.
ALTER TABLE public.qr_codes DROP CONSTRAINT IF EXISTS qr_codes_kind_check;
ALTER TABLE public.qr_codes
  ADD CONSTRAINT qr_codes_kind_check CHECK (kind IN ('payment', 'table', 'order'));

-- 1b) Rebuild the per-kind column check to accept 'order'.
ALTER TABLE public.qr_codes DROP CONSTRAINT IF EXISTS qr_codes_kind_fields;
ALTER TABLE public.qr_codes
  ADD CONSTRAINT qr_codes_kind_fields CHECK (
    (kind = 'table' AND preset_amount IS NULL)
    OR (kind = 'payment' AND table_capacity IS NULL)
    OR (kind = 'order' AND table_capacity IS NULL AND preset_amount IS NULL)
  );

-- 2) Grant order.take to owner + cashier + waiter on existing tenants (idempotent).
UPDATE public.tenant_roles
SET permissions = permissions || '["order.take"]'::jsonb
WHERE name IN ('owner', 'cashier', 'waiter')
  AND NOT (permissions @> '["order.take"]'::jsonb);

-- 3) Keep new-tenant bootstrap in sync: add order.take to owner, cashier, waiter.
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
    '["sales.read","sales.write","sales.view_all","sales.view_assigned","sales.assign","sales.update_assigned","products.read","products.write","inventory.read","inventory.write","promotions.read","promotions.write","reports.read","team.read","team.write","settings.read","settings.write","orders.read","orders.write","payments.write","qr.read","qr.write","qr.fulfill","order.take"]'::jsonb,
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
    '["sales.read","sales.write","sales.view_all","sales.view_assigned","orders.read","orders.write","payments.write","qr.read","order.take"]'::jsonb,
    true
  );

  INSERT INTO public.tenant_roles (tenant_id, name, permissions, is_system)
  VALUES (
    NEW.id,
    'waiter',
    '["orders.read","orders.write","qr.read","qr.fulfill","order.take"]'::jsonb,
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
