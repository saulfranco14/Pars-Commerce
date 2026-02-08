-- pars_commerce: products, inventory, promotions, orders, payments

-- products
create table if not exists public.products (
    id uuid primary key default uuid_generate_v4 (),
    tenant_id uuid not null references public.tenants (id) on delete cascade,
    name text not null,
    slug text not null,
    sku text,
    description text,
    price decimal(12, 2) not null,
    unit text not null default 'unit',
    type text not null default 'product',
    track_stock boolean not null default true,
    is_public boolean not null default true,
    image_url text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (tenant_id, slug)
);

alter table public.products enable row level security;

-- product_images
create table if not exists public.product_images (
    id uuid primary key default uuid_generate_v4 (),
    product_id uuid not null references public.products (id) on delete cascade,
    url text not null,
    position smallint not null default 0,
    alt_text text,
    created_at timestamptz not null default now()
);

alter table public.product_images enable row level security;

-- product_inventory
create table if not exists public.product_inventory (
    id uuid primary key default uuid_generate_v4 (),
    product_id uuid not null references public.products (id) on delete cascade unique,
    quantity integer not null default 0,
    updated_at timestamptz not null default now()
);

alter table public.product_inventory enable row level security;

-- inventory_movements
create table if not exists public.inventory_movements (
    id uuid primary key default uuid_generate_v4 (),
    product_id uuid not null references public.products (id) on delete cascade,
    type text not null,
    quantity integer not null,
    reference text,
    reference_id uuid,
    created_by uuid references public.profiles (id) on delete set null,
    created_at timestamptz not null default now()
);

alter table public.inventory_movements enable row level security;

-- promotions
create table if not exists public.promotions (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  type text not null,
  value decimal(12,2) not null,
  min_amount decimal(12,2),
  product_ids uuid[],
  valid_from timestamptz,
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.promotions enable row level security;

-- orders (ticket; becomes sale when status = 'paid')
create table if not exists public.orders (
    id uuid primary key default uuid_generate_v4 (),
    tenant_id uuid not null references public.tenants (id) on delete cascade,
    status text not null default 'draft',
    subtotal decimal(12, 2) not null default 0,
    discount decimal(12, 2) not null default 0,
    total decimal(12, 2) not null default 0,
    promotion_id uuid references public.promotions (id) on delete set null,
    payment_method text,
    source text not null default 'dashboard',
    created_by uuid references public.profiles (id) on delete set null,
    assigned_to uuid references public.profiles (id) on delete set null,
    completed_by uuid references public.profiles (id) on delete set null,
    completed_at timestamptz,
    paid_at timestamptz,
    work_metadata jsonb,
    customer_name text,
    customer_email text,
    customer_phone text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint orders_status_check check (
        status in (
            'draft',
            'assigned',
            'in_progress',
            'completed',
            'pending_payment',
            'paid',
            'cancelled'
        )
    )
);

alter table public.orders enable row level security;

-- order_items
create table if not exists public.order_items (
    id uuid primary key default uuid_generate_v4 (),
    order_id uuid not null references public.orders (id) on delete cascade,
    product_id uuid not null references public.products (id) on delete restrict,
    quantity integer not null,
    unit_price decimal(12, 2) not null,
    subtotal decimal(12, 2) not null,
    created_at timestamptz not null default now()
);

alter table public.order_items enable row level security;

-- payments
create table if not exists public.payments (
    id uuid primary key default uuid_generate_v4 (),
    order_id uuid not null references public.orders (id) on delete cascade,
    provider text not null,
    external_id text,
    status text not null default 'pending',
    amount decimal(12, 2) not null,
    metadata jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.payments enable row level security;

-- RLS: products (tenant members with products.read/write)
create policy "Products: tenant members can read" on public.products for
select using (
        exists (
            select 1
            from public.tenant_memberships m
            where
                m.tenant_id = products.tenant_id
                and m.user_id = auth.uid ()
        )
    );

create policy "Products: tenant members with write can insert update delete"
  on public.products for all
  using (
    exists (
      select 1 from public.tenant_memberships m
      join public.tenant_roles r on r.id = m.role_id
      where m.tenant_id = products.tenant_id and m.user_id = auth.uid()
      and r.permissions::jsonb ? 'products.write'
    )
  );

-- Public read for is_public products when tenant has public_store_enabled
create policy "Products: public read when store enabled and is_public" on public.products for
select using (
        is_public = true
        and exists (
            select 1
            from public.tenants t
            where
                t.id = products.tenant_id
                and t.public_store_enabled = true
        )
    );

-- RLS: product_images, product_inventory, inventory_movements (via product tenant)
create policy "Product_images: tenant members" on public.product_images for all using (
    exists (
        select 1
        from public.products p
            join public.tenant_memberships m on m.tenant_id = p.tenant_id
            and m.user_id = auth.uid ()
        where
            p.id = product_images.product_id
    )
);

create policy "Product_inventory: tenant members" on public.product_inventory for all using (
    exists (
        select 1
        from public.products p
            join public.tenant_memberships m on m.tenant_id = p.tenant_id
            and m.user_id = auth.uid ()
        where
            p.id = product_inventory.product_id
    )
);

create policy "Inventory_movements: tenant members" on public.inventory_movements for all using (
    exists (
        select 1
        from public.products p
            join public.tenant_memberships m on m.tenant_id = p.tenant_id
            and m.user_id = auth.uid ()
        where
            p.id = inventory_movements.product_id
    )
);

-- RLS: promotions
create policy "Promotions: tenant members" on public.promotions for all using (
    exists (
        select 1
        from public.tenant_memberships m
        where
            m.tenant_id = promotions.tenant_id
            and m.user_id = auth.uid ()
    )
);

create policy "Promotions: public read when store enabled" on public.promotions for
select using (
        exists (
            select 1
            from public.tenants t
            where
                t.id = promotions.tenant_id
                and t.public_store_enabled = true
        )
    );

-- RLS: orders (tenant members; visibility by permission handled in API)
create policy "Orders: tenant members can read" on public.orders for
select using (
        exists (
            select 1
            from public.tenant_memberships m
            where
                m.tenant_id = orders.tenant_id
                and m.user_id = auth.uid ()
        )
    );

create policy "Orders: tenant members can insert update" on public.orders for all using (
    exists (
        select 1
        from public.tenant_memberships m
        where
            m.tenant_id = orders.tenant_id
            and m.user_id = auth.uid ()
    )
);

-- RLS: order_items, payments (via order)
create policy "Order_items: tenant members" on public.order_items for all using (
    exists (
        select 1
        from public.orders o
            join public.tenant_memberships m on m.tenant_id = o.tenant_id
            and m.user_id = auth.uid ()
        where
            o.id = order_items.order_id
    )
);

create policy "Payments: tenant members" on public.payments for all using (
    exists (
        select 1
        from public.orders o
            join public.tenant_memberships m on m.tenant_id = o.tenant_id
            and m.user_id = auth.uid ()
        where
            o.id = payments.order_id
    )
);