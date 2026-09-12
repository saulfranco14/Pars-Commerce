-- Add cashier/waiter roles for existing tenants and new tenant bootstrap

INSERT INTO public.tenant_roles (tenant_id, name, permissions, is_system)
SELECT
  t.id,
  'cashier',
  '["sales.read","sales.write","sales.view_all","sales.view_assigned","orders.read","orders.write","payments.write","qr.read"]'::jsonb,
  true
FROM public.tenants t
WHERE NOT EXISTS (
  SELECT 1
  FROM public.tenant_roles r
  WHERE r.tenant_id = t.id
    AND r.name = 'cashier'
);

INSERT INTO public.tenant_roles (tenant_id, name, permissions, is_system)
SELECT
  t.id,
  'waiter',
  '["orders.read","orders.write","qr.read"]'::jsonb,
  true
FROM public.tenants t
WHERE NOT EXISTS (
  SELECT 1
  FROM public.tenant_roles r
  WHERE r.tenant_id = t.id
    AND r.name = 'waiter'
);

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
    '["sales.read","sales.write","sales.view_all","sales.view_assigned","sales.assign","sales.update_assigned","products.read","products.write","inventory.read","inventory.write","promotions.read","promotions.write","reports.read","team.read","team.write","settings.read","settings.write","orders.read","orders.write","payments.write","qr.read","qr.write"]'::jsonb,
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
    '["orders.read","orders.write","qr.read"]'::jsonb,
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
