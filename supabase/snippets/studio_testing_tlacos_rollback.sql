-- Reverts 20261127000002_studio_testing_tlacos.sql.
-- 1. New businesses go back to a starter grant of 5.
-- 2. The unspent part of each testing grant is withdrawn and written to the ledger.
--    Tlacos already spent stay spent; grants with an AI job in flight keep what is reserved.

CREATE OR REPLACE FUNCTION public.studio_grant_starter_credits(p_tenant_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_grant uuid;
BEGIN
  IF EXISTS(SELECT 1 FROM studio_credit_grants WHERE external_reference='starter:'||p_tenant_id::text) THEN RETURN false; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('studio:'||p_tenant_id::text,0));
  IF EXISTS(SELECT 1 FROM studio_credit_grants WHERE external_reference='starter:'||p_tenant_id::text) THEN RETURN false; END IF;
  INSERT INTO studio_credit_grants(tenant_id,kind,amount,remaining,external_reference)
    VALUES(p_tenant_id,'adjustment',5,5,'starter:'||p_tenant_id::text) RETURNING id INTO v_grant;
  INSERT INTO studio_credit_ledger(tenant_id,grant_id,delta,reason,external_reference)
    VALUES(p_tenant_id,v_grant,5,'adjustment','starter:'||p_tenant_id::text);
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.studio_grant_starter_credits(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.studio_grant_starter_credits(uuid) TO service_role;

-- Ledger first (it is append-only), then the withdrawal itself.
INSERT INTO public.studio_credit_ledger(tenant_id,grant_id,delta,reason,external_reference)
SELECT tenant_id,id,-(remaining-reserved),'adjustment','starter-testing-withdraw:'||tenant_id::text
FROM public.studio_credit_grants
WHERE external_reference LIKE 'starter-testing:%' AND remaining > reserved
ON CONFLICT (external_reference) DO NOTHING;

UPDATE public.studio_credit_grants
SET remaining = reserved
WHERE external_reference LIKE 'starter-testing:%' AND remaining > reserved;
