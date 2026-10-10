alter table public.products
  add column if not exists sort_order integer not null default 0;

with ranked as (
  select
    id,
    row_number() over (
      partition by tenant_id, type
      order by lower(name), created_at, id
    ) - 1 as next_order
  from public.products
  where deleted_at is null
)
update public.products as product
set sort_order = ranked.next_order
from ranked
where product.id = ranked.id;

create index if not exists products_catalog_order_idx
  on public.products (tenant_id, type, sort_order, subcatalog_id, name)
  where deleted_at is null;

create or replace function public.reorder_catalog_items(
  p_tenant_id uuid,
  p_item_ids uuid[]
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.is_tenant_member(p_tenant_id) then
    raise exception 'Forbidden';
  end if;

  if (
    select count(*)
    from public.products
    where tenant_id = p_tenant_id
      and id = any(p_item_ids)
      and deleted_at is null
  ) <> cardinality(p_item_ids) then
    raise exception 'Invalid catalog item list';
  end if;

  if (
    select count(distinct type)
    from public.products
    where tenant_id = p_tenant_id
      and id = any(p_item_ids)
      and deleted_at is null
  ) <> 1 then
    raise exception 'Catalog items must have the same type';
  end if;

  -- Conservar los espacios de orden existentes permite reacomodar una
  -- categoría sin desordenar los artículos de las demás categorías.
  with requested as (
    select id, ordinality
    from unnest(p_item_ids) with ordinality as item(id, ordinality)
  ), available_positions as (
    select
      sort_order,
      row_number() over (order by sort_order, id) as ordinality
    from public.products
    where tenant_id = p_tenant_id
      and id = any(p_item_ids)
      and deleted_at is null
  ), next_order as (
    select requested.id, available_positions.sort_order
    from requested
    join available_positions using (ordinality)
  )
  update public.products as product
  set sort_order = next_order.sort_order,
      updated_at = now()
  from next_order
  where product.id = next_order.id
    and product.tenant_id = p_tenant_id;
end;
$$;
