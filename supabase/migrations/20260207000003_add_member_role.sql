-- Add "member" role for existing tenants and update trigger for new tenants

insert into public.tenant_roles (tenant_id, name, permissions, is_system)
select
  t.id,
  'member',
  '["sales.read","sales.write","sales.view_all","sales.view_assigned","sales.assign","sales.update_assigned","products.read","products.write","inventory.read","inventory.write","promotions.read","promotions.write","reports.read","team.read"]'::jsonb,
  true
from public.tenants t
where not exists (
  select 1 from public.tenant_roles r
  where r.tenant_id = t.id and r.name = 'member'
);

create or replace function public.handle_new_tenant()
returns trigger as $$
declare
  owner_role_id uuid;
  member_role_id uuid;
begin
  insert into public.tenant_roles (tenant_id, name, permissions, is_system)
  values (
    new.id,
    'owner',
    '["sales.read","sales.write","sales.view_all","sales.view_assigned","sales.assign","sales.update_assigned","products.read","products.write","inventory.read","inventory.write","promotions.read","promotions.write","reports.read","team.read","team.write","settings.read","settings.write"]'::jsonb,
    true
  )
  returning id into owner_role_id;

  insert into public.tenant_roles (tenant_id, name, permissions, is_system)
  values (
    new.id,
    'member',
    '["sales.read","sales.write","sales.view_all","sales.view_assigned","sales.assign","sales.update_assigned","products.read","products.write","inventory.read","inventory.write","promotions.read","promotions.write","reports.read","team.read"]'::jsonb,
    true
  )
  returning id into member_role_id;

  insert into public.tenant_site_pages (tenant_id, slug, title, position)
  values
    (new.id, 'inicio', 'Inicio', 0),
    (new.id, 'productos', 'Productos', 1),
    (new.id, 'promociones', 'Promociones', 2),
    (new.id, 'nosotros', 'Nosotros', 3),
    (new.id, 'contacto', 'Contacto', 4);

  if auth.uid() is not null then
    insert into public.tenant_memberships (user_id, tenant_id, role_id, accepted_at)
    values (auth.uid(), new.id, owner_role_id, now());
  end if;

  return new;
end;
$$ language plpgsql security definer;