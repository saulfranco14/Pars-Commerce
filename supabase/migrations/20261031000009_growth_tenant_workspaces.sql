-- =============================================================================
-- GROWTH for businesses: a tenant on a plan with «prospecting» gets its own
-- prospecting workspace.
--   * growth_member_role: in a tenant workspace the role comes from the
--     tenant role (owner or prospects.manage → coordinador, prospects.work →
--     prospector), so revoking the permission revokes the access
--   * growth_tenant_workspace: checks plan and permission, creates the
--     workspace on first use (settings + starter WhatsApp copy) and returns it
--   * growth_settings gains the offer shown on «Para ti» for businesses
--   * the scale plan includes prospecting
-- Reverted by supabase/snippets/growth_tenant_workspaces_rollback.sql.
-- =============================================================================

ALTER TABLE public.growth_settings
  ADD COLUMN IF NOT EXISTS offer_title text CHECK (offer_title IS NULL OR char_length(offer_title) <= 120),
  ADD COLUMN IF NOT EXISTS offer_text text CHECK (offer_text IS NULL OR char_length(offer_text) <= 1200),
  ADD COLUMN IF NOT EXISTS cta_label text CHECK (cta_label IS NULL OR char_length(cta_label) <= 40);

UPDATE public.billing_plans SET entitlements = coalesce(entitlements, '{}'::jsonb) || '{"prospecting": true}'::jsonb WHERE code = 'scale';

CREATE OR REPLACE FUNCTION public.growth_tenant_role(p_tenant_id uuid, p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN r.name = 'owner' OR coalesce(r.permissions, '[]'::jsonb) ? 'prospects.manage' THEN 'coordinador'
    WHEN coalesce(r.permissions, '[]'::jsonb) ? 'prospects.work' THEN 'prospector'
  END
  FROM public.tenant_memberships m
  JOIN public.tenant_roles r ON r.id = m.role_id
  WHERE m.tenant_id = p_tenant_id AND m.user_id = p_user_id AND coalesce(m.status, 'active') = 'active'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.growth_member_role(p_workspace_id uuid, p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_tenant uuid;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  SELECT w.tenant_id INTO v_tenant FROM public.growth_workspaces w WHERE w.id = p_workspace_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  -- A business's workspace follows its own team and permissions.
  IF v_tenant IS NOT NULL THEN
    RETURN public.growth_tenant_role(v_tenant, p_user_id);
  END IF;

  SELECT m.role INTO v_role FROM public.growth_members m
  WHERE m.workspace_id = p_workspace_id AND m.user_id = p_user_id AND m.status IN ('invited', 'active');
  IF v_role IS NOT NULL THEN
    RETURN v_role;
  END IF;
  IF EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = p_user_id) THEN
    RETURN 'coordinador';
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.growth_tenant_workspace(p_tenant_id uuid, p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ws uuid;
  v_name text;
  v_slug text;
BEGIN
  IF public.growth_tenant_role(p_tenant_id, p_user_id) IS NULL THEN
    RETURN NULL;
  END IF;
  IF NOT coalesce((
    SELECT (bp.entitlements->>'prospecting')::boolean
    FROM public.tenant_billing_accounts ba JOIN public.billing_plans bp ON bp.code = ba.plan_code
    WHERE ba.tenant_id = p_tenant_id
  ), false) THEN
    RETURN NULL;
  END IF;

  SELECT w.id INTO v_ws FROM public.growth_workspaces w WHERE w.tenant_id = p_tenant_id;
  IF v_ws IS NOT NULL THEN
    RETURN v_ws;
  END IF;

  SELECT left(btrim(t.name), 80), left('t-' || regexp_replace(lower(t.slug), '[^a-z0-9-]', '', 'g'), 60)
  INTO v_name, v_slug FROM public.tenants t WHERE t.id = p_tenant_id;
  INSERT INTO public.growth_workspaces (slug, name, tenant_id)
  VALUES (coalesce(nullif(v_slug, 't-'), 't-' || left(p_tenant_id::text, 8)), coalesce(nullif(v_name, ''), 'Mi negocio'), p_tenant_id)
  ON CONFLICT (tenant_id) DO NOTHING
  RETURNING id INTO v_ws;
  IF v_ws IS NULL THEN
    SELECT w.id INTO v_ws FROM public.growth_workspaces w WHERE w.tenant_id = p_tenant_id;
    RETURN v_ws;
  END IF;

  -- Businesses write by WhatsApp only: no visit zones and no email sequence.
  INSERT INTO public.growth_settings (workspace_id, signature, visit_municipios, offer_title, cta_label)
  VALUES (v_ws, coalesce(v_name, 'Mi negocio'), ARRAY[]::text[], 'Le compartimos nuestra propuesta', 'Me interesa');

  INSERT INTO public.growth_templates (workspace_id, channel, giro, step, variant, version, subject, body) VALUES
      (v_ws, 'whatsapp', NULL, 'm1', 'A', 1, NULL, E'{saludo}. ¿Hablo con {negocio}?\n\nMi nombre es {nombre} y le escribo de {espacio}. {oferta}.\n\nLe preparé la información aquí:\n{link}\n\n¿Le interesa que le cuente más?\n\n{firma}'),
      (v_ws, 'whatsapp', NULL, 'seguimiento', 'A', 1, NULL, E'{saludo}. ¿Pudo ver la información que le mandé? Aquí sigue:\n{link}\n\nCualquier duda, con gusto le respondo.\n\n{firma}'),
      (v_ws, 'whatsapp', NULL, 'vio_tienda', 'A', 1, NULL, E'{saludo}. Vi que revisó la propuesta de {espacio}. ¿Qué le pareció?\n\nAquí sigue la información:\n{link}\n\n{firma}'),
      (v_ws, 'whatsapp', NULL, 'si', 'A', 1, NULL, E'Con gusto. Aquí tiene todos los detalles:\n{link}\n\n¿Qué día le acomoda para platicarlo?\n\n{firma}'),
      (v_ws, 'whatsapp', NULL, 'ultimo', 'A', 1, NULL, E'{saludo}. Es el último mensaje que le envío sobre esto, para no incomodarle. La información sigue aquí:\n{link}\n\nSi más adelante le interesa, con gusto le ayudo.\n\n{firma}')
  ON CONFLICT DO NOTHING;

  RETURN v_ws;
END;
$$;

REVOKE ALL ON FUNCTION public.growth_tenant_role(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.growth_tenant_workspace(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.growth_tenant_role(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.growth_tenant_workspace(uuid, uuid) TO service_role;
