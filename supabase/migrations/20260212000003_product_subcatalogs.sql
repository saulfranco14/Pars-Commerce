-- product_subcatalogs: subcatalogos predefinidos por tenant para productos y servicios

create table public.product_subcatalogs (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  unique(tenant_id, slug)
);

alter table public.product_subcatalogs enable row level security;

create index idx_product_subcatalogs_tenant on public.product_subcatalogs(tenant_id);

create policy "Subcatalogs: tenant members can read" on public.product_subcatalogs
  for select using (
    exists (
      select 1 from public.tenant_memberships m
      where m.tenant_id = product_subcatalogs.tenant_id and m.user_id = auth.uid()
    )
  );

create policy "Subcatalogs: tenant members with products.write can manage" on public.product_subcatalogs
  for all using (
    exists (
      select 1 from public.tenant_memberships m
      join public.tenant_roles r on r.id = m.role_id
      where m.tenant_id = product_subcatalogs.tenant_id
        and m.user_id = auth.uid()
        and r.permissions::jsonb ? 'products.write'
    )
  );

alter table public.products
  add column if not exists subcatalog_id uuid references public.product_subcatalogs(id) on delete set null;

create index idx_products_subcatalog_id on public.products(subcatalog_id) where subcatalog_id is not null;
