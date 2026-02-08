-- Fix infinite recursion in tenant_memberships RLS.
-- Policies must not query tenant_memberships from within tenant_memberships policies.
-- Use SECURITY DEFINER functions to check membership without triggering RLS.

create or replace function public.is_tenant_member(p_tenant_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.tenant_memberships
    where tenant_id = p_tenant_id and user_id = auth.uid()
  );
$$;

create or replace function public.can_manage_tenant_team(p_tenant_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.tenant_memberships m
    join public.tenant_roles r on r.id = m.role_id
    where m.tenant_id = p_tenant_id and m.user_id = auth.uid()
    and (r.permissions::jsonb ? 'team.write' or r.name = 'owner')
  );
$$;

drop policy if exists "Tenant_memberships: members can read" on public.tenant_memberships;

drop policy if exists "Tenant_memberships: owner/manager can insert update delete" on public.tenant_memberships;

create policy "Tenant_memberships: read own or same tenant" on public.tenant_memberships for
select using (
        user_id = auth.uid ()
        or public.is_tenant_member (tenant_id)
    );

create policy "Tenant_memberships: owner or manager can insert update delete" on public.tenant_memberships for all using (
    public.can_manage_tenant_team (tenant_id)
)
with
    check (
        public.can_manage_tenant_team (tenant_id)
    );