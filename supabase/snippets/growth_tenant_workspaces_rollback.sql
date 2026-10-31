-- Reverts 20261031000009_growth_tenant_workspaces.sql. Business workspaces and
-- everything in them (leads, templates, events) are deleted.
BEGIN;

DELETE FROM public.growth_workspaces WHERE tenant_id IS NOT NULL;

-- growth_member_role without business workspaces, verbatim from 20261031000001_growth_workspaces.
CREATE OR REPLACE FUNCTION public.growth_member_role(p_workspace_id uuid, p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  SELECT m.role INTO v_role FROM public.growth_members m
  WHERE m.workspace_id = p_workspace_id AND m.user_id = p_user_id AND m.status IN ('invited', 'active');
  IF v_role IS NOT NULL THEN
    RETURN v_role;
  END IF;
  -- Platform admins coordinate the platform workspace even without a member row.
  IF EXISTS (SELECT 1 FROM public.growth_workspaces w WHERE w.id = p_workspace_id AND w.tenant_id IS NULL)
     AND EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = p_user_id) THEN
    RETURN 'coordinador';
  END IF;
  RETURN NULL;
END;
$$;

DROP FUNCTION IF EXISTS public.growth_tenant_workspace(uuid, uuid);
DROP FUNCTION IF EXISTS public.growth_tenant_role(uuid, uuid);

ALTER TABLE public.growth_settings DROP COLUMN IF EXISTS offer_title, DROP COLUMN IF EXISTS offer_text, DROP COLUMN IF EXISTS cta_label;
UPDATE public.billing_plans SET entitlements = entitlements - 'prospecting';

COMMIT;
