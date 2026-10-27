-- Deletes a TEST account created by claiming a store from a "Para ti" link and puts
-- the prospect back where it was, so the real business can claim it later.
-- 1) Replace the email. 2) Run the whole block in the SQL Editor.
-- It refuses to run on platform admins, on businesses with other members or on
-- accounts with more than one business.
DO $$
DECLARE
  v_email   text := 'CORREO_DE_PRUEBA@ejemplo.com';
  v_user    uuid;
  v_tenants uuid[];
  v_leads   uuid[];
BEGIN
  SELECT id INTO v_user FROM auth.users WHERE lower(email) = lower(v_email);
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'No hay ningún usuario con el correo %', v_email;
  END IF;
  IF EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = v_user) THEN
    RAISE EXCEPTION 'Ese correo es administrador de plataforma: no es una cuenta de prueba.';
  END IF;

  SELECT coalesce(array_agg(tenant_id), '{}') INTO v_tenants FROM public.tenant_memberships WHERE user_id = v_user;
  IF array_length(v_tenants, 1) > 1 THEN
    RAISE EXCEPTION 'La cuenta tiene % negocios. Revísala a mano.', array_length(v_tenants, 1);
  END IF;
  IF EXISTS (SELECT 1 FROM public.tenant_memberships WHERE tenant_id = ANY (v_tenants) AND user_id <> v_user) THEN
    RAISE EXCEPTION 'El negocio tiene más miembros: no parece de prueba.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.legal_document_versions WHERE tenant_id = ANY (v_tenants)) THEN
    RAISE EXCEPTION 'El negocio ya publicó documentos legales propios (inmutables). Revísalo a mano.';
  END IF;

  SELECT coalesce(array_agg(DISTINCT lead_id), '{}') INTO v_leads FROM (
    SELECT a.lead_id FROM public.tenant_acquisitions a WHERE a.tenant_id = ANY (v_tenants) AND a.lead_id IS NOT NULL
    UNION
    SELECT g.id FROM public.growth_leads g WHERE g.registered_tenant_id = ANY (v_tenants)
  ) s;

  -- The prospect forgets the test visit and claim; phone/giro corrections stay.
  DELETE FROM public.growth_lead_events
  WHERE lead_id = ANY (v_leads) AND type IN ('para_viewed', 'para_seconds', 'claim_clicked', 'help_clicked', 'registered');
  UPDATE public.growth_lead_links SET view_count = 0, last_viewed_at = NULL WHERE lead_id = ANY (v_leads);

  -- Legal rows restrict deleting the tenant and the profile.
  DELETE FROM public.legal_closure_requests WHERE tenant_id = ANY (v_tenants) OR requested_by = v_user;
  DELETE FROM public.legal_data_exports WHERE tenant_id = ANY (v_tenants) OR requested_by = v_user;
  DELETE FROM public.privacy_requests WHERE tenant_id = ANY (v_tenants);
  DELETE FROM public.tenant_checkout_legal_acceptances WHERE tenant_id = ANY (v_tenants);
  DELETE FROM public.tenant_legal_acceptances WHERE tenant_id = ANY (v_tenants) OR accepted_by = v_user;
  DELETE FROM public.tenant_legal_profiles WHERE tenant_id = ANY (v_tenants);

  DELETE FROM public.tenants WHERE id = ANY (v_tenants);

  UPDATE public.growth_leads g
  SET registered_tenant_id = NULL,
      stage = CASE WHEN g.whatsapp_attempts > 0 THEN 'contactado' ELSE 'nuevo' END,
      updated_at = now()
  WHERE g.id = ANY (v_leads);
  UPDATE public.growth_leads g SET next_channel = public.growth_next_channel(g) WHERE g.id = ANY (v_leads);

  DELETE FROM public.feature_interest WHERE created_by = v_user;
  DELETE FROM auth.users WHERE id = v_user;

  RAISE NOTICE 'Listo. Usuario: % · negocios borrados: % · prospectos restablecidos: %', v_email, v_tenants, v_leads;
END $$;
