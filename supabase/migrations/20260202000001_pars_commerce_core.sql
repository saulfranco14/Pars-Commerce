-- pars_commerce: core tables (profiles, tenants, roles, memberships, site_pages)
-- Run against your Supabase project (new DB or existing)

-- Enable UUID extension if not exists
create extension if not exists "uuid-ossp";

-- profiles (extends auth.users)
create table if not exists public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    email text,
    display_name text,
    avatar_url text,
    phone text,
    role_type smallint default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile" on public.profiles for
select using (auth.uid () = id);

create policy "Users can update own profile" on public.profiles for
update using (auth.uid () = id);

create policy "Users can insert own profile" on public.profiles for
insert
with
    check (auth.uid () = id);

-- trigger: create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- tenants
create table if not exists public.tenants (
    id uuid primary key default uuid_generate_v4 (),
    name text not null,
    slug text not null unique,
    business_type text,
    logo_url text,
    banner_url text,
    theme_color text,
    description text,
    public_store_enabled boolean not null default false,
    settings jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.tenants enable row level security;

-- tenant_roles
create table if not exists public.tenant_roles (
    id uuid primary key default uuid_generate_v4 (),
    tenant_id uuid not null references public.tenants (id) on delete cascade,
    name text not null,
    permissions jsonb not null default '[]',
    is_system boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.tenant_roles enable row level security;

-- tenant_memberships
create table if not exists public.tenant_memberships (
    id uuid primary key default uuid_generate_v4 (),
    user_id uuid not null references public.profiles (id) on delete cascade,
    tenant_id uuid not null references public.tenants (id) on delete cascade,
    role_id uuid not null references public.tenant_roles (id) on delete restrict,
    invited_at timestamptz,
    accepted_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id, tenant_id)
);

alter table public.tenant_memberships enable row level security;

-- tenant_site_pages (CMS)
create table if not exists public.tenant_site_pages (
    id uuid primary key default uuid_generate_v4 (),
    tenant_id uuid not null references public.tenants (id) on delete cascade,
    slug text not null,
    title text not null,
    content jsonb,
    is_enabled boolean not null default true,
    position smallint not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (tenant_id, slug)
);

alter table public.tenant_site_pages enable row level security;

-- RLS: tenants (members can read; owner can update)
create policy "Tenants: members can read" on public.tenants for
select using (
        exists (
            select 1
            from public.tenant_memberships m
            where
                m.tenant_id = tenants.id
                and m.user_id = auth.uid ()
        )
    );

create policy "Tenants: members can update"
  on public.tenants for update
  using (
    exists (
      select 1 from public.tenant_memberships m
      join public.tenant_roles r on r.id = m.role_id
      where m.tenant_id = tenants.id and m.user_id = auth.uid()
      and r.permissions::jsonb ? 'settings.write'
    )
  );

create policy "Tenants: authenticated can create" on public.tenants for
insert
with
    check (auth.uid () is not null);

-- RLS: tenant_roles (members with team.read can read)
create policy "Tenant_roles: members can read" on public.tenant_roles for
select using (
        exists (
            select 1
            from public.tenant_memberships m
            where
                m.tenant_id = tenant_roles.tenant_id
                and m.user_id = auth.uid ()
        )
    );

-- RLS: tenant_memberships (members of same tenant)
create policy "Tenant_memberships: members can read" on public.tenant_memberships for
select using (
        exists (
            select 1
            from public.tenant_memberships m
            where
                m.tenant_id = tenant_memberships.tenant_id
                and m.user_id = auth.uid ()
        )
    );

create policy "Tenant_memberships: owner/manager can insert update delete"
  on public.tenant_memberships for all
  using (
    exists (
      select 1 from public.tenant_memberships m
      join public.tenant_roles r on r.id = m.role_id
      where m.tenant_id = tenant_memberships.tenant_id and m.user_id = auth.uid()
      and (r.permissions::jsonb ? 'team.write' or r.name = 'owner')
    )
  );

-- RLS: tenant_site_pages (same tenant members)
create policy "Tenant_site_pages: members can read" on public.tenant_site_pages for
select using (
        exists (
            select 1
            from public.tenant_memberships m
            where
                m.tenant_id = tenant_site_pages.tenant_id
                and m.user_id = auth.uid ()
        )
    );

create policy "Tenant_site_pages: settings.write can manage"
  on public.tenant_site_pages for all
  using (
    exists (
      select 1 from public.tenant_memberships m
      join public.tenant_roles r on r.id = m.role_id
      where m.tenant_id = tenant_site_pages.tenant_id and m.user_id = auth.uid()
      and r.permissions::jsonb ? 'settings.write'
    )
  );

-- Public read for site pages when tenant has public_store_enabled (for sitio público)
create policy "Tenant_site_pages: public read when store enabled" on public.tenant_site_pages for
select using (
        exists (
            select 1
            from public.tenants t
            where
                t.id = tenant_site_pages.tenant_id
                and t.public_store_enabled = true
        )
    );