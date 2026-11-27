-- Testing period: every business gets 30 Tlacos to try the AI.
-- 1. New businesses: the one-time starter grant goes from 5 to 30.
-- 2. Businesses that already got their starter: a one-time extra grant of 30.
-- Both are idempotent through the unique external_reference; nothing existing is edited.

CREATE OR REPLACE FUNCTION public.studio_grant_starter_credits(p_tenant_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_grant uuid;
BEGIN
  IF EXISTS(SELECT 1 FROM studio_credit_grants WHERE external_reference='starter:'||p_tenant_id::text) THEN RETURN false; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('studio:'||p_tenant_id::text,0));
  IF EXISTS(SELECT 1 FROM studio_credit_grants WHERE external_reference='starter:'||p_tenant_id::text) THEN RETURN false; END IF;
  INSERT INTO studio_credit_grants(tenant_id,kind,amount,remaining,external_reference)
    VALUES(p_tenant_id,'adjustment',30,30,'starter:'||p_tenant_id::text) RETURNING id INTO v_grant;
  INSERT INTO studio_credit_ledger(tenant_id,grant_id,delta,reason,external_reference)
    VALUES(p_tenant_id,v_grant,30,'adjustment','starter:'||p_tenant_id::text);
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.studio_grant_starter_credits(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.studio_grant_starter_credits(uuid) TO service_role;

WITH topped AS (
  INSERT INTO public.studio_credit_grants(tenant_id,kind,amount,remaining,external_reference)
  SELECT g.tenant_id,'adjustment',30,30,'starter-testing:'||g.tenant_id::text
  FROM public.studio_credit_grants g
  WHERE g.external_reference='starter:'||g.tenant_id::text
  ON CONFLICT (external_reference) DO NOTHING
  RETURNING id, tenant_id
)
INSERT INTO public.studio_credit_ledger(tenant_id,grant_id,delta,reason,external_reference)
SELECT tenant_id,id,30,'adjustment','starter-testing:'||tenant_id::text FROM topped
ON CONFLICT (external_reference) DO NOTHING;
