-- Access lifecycle for a business team. Existing accepted memberships remain active.
ALTER TABLE public.tenant_memberships
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS invitation_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS suspension_reason text;

DO $$ BEGIN
  ALTER TABLE public.tenant_memberships
    ADD CONSTRAINT tenant_memberships_status_check
    CHECK (status IN ('invited', 'active', 'suspended'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

UPDATE public.tenant_memberships
SET status = CASE WHEN accepted_at IS NULL THEN 'invited' ELSE 'active' END
WHERE status IS NULL OR status = 'active';

CREATE INDEX IF NOT EXISTS idx_tenant_memberships_active_user
  ON public.tenant_memberships (user_id, tenant_id)
  WHERE status = 'active';

CREATE TABLE IF NOT EXISTS public.platform_activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS platform_activity_events_tenant_created_idx
  ON public.platform_activity_events (tenant_id, created_at DESC);
ALTER TABLE public.platform_activity_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "platform activity: service role" ON public.platform_activity_events
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
