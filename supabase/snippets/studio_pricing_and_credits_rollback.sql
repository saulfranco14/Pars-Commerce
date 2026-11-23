-- Rollback of 20261126000001_studio_pricing_and_credits.

CREATE OR REPLACE FUNCTION public.reserve_studio_credits(p_tenant_id uuid,p_job_id uuid,p_amount integer) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_res uuid; v_needed integer:=p_amount; v_take integer; v_grant studio_credit_grants;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('studio:'||p_tenant_id::text,0));
  SELECT id INTO v_res FROM studio_credit_reservations WHERE job_id=p_job_id AND tenant_id=p_tenant_id;
  IF FOUND THEN RETURN v_res; END IF;
  IF p_amount<=0 OR NOT studio_membership_active(p_tenant_id) THEN RAISE EXCEPTION 'STUDIO_MEMBERSHIP_REQUIRED'; END IF;
  IF EXISTS(SELECT 1 FROM tenant_studio_subscriptions WHERE tenant_id=p_tenant_id AND ai_blocked) THEN RAISE EXCEPTION 'STUDIO_AI_BLOCKED'; END IF;
  INSERT INTO studio_credit_reservations(tenant_id,job_id,amount) VALUES(p_tenant_id,p_job_id,p_amount) RETURNING id INTO v_res;
  FOR v_grant IN SELECT * FROM studio_credit_grants WHERE tenant_id=p_tenant_id AND remaining>reserved AND (expires_at IS NULL OR expires_at>now())
    ORDER BY CASE WHEN kind='subscription' THEN 0 ELSE 1 END,expires_at ASC NULLS LAST,created_at,id FOR UPDATE LOOP
    v_take:=least(v_needed,v_grant.remaining-v_grant.reserved);
    UPDATE studio_credit_grants SET reserved=reserved+v_take WHERE id=v_grant.id;
    INSERT INTO studio_credit_reservation_items(reservation_id,tenant_id,grant_id,amount) VALUES(v_res,p_tenant_id,v_grant.id,v_take);
    INSERT INTO studio_credit_ledger(tenant_id,grant_id,reservation_id,job_id,reserved_delta,reason,external_reference)
      VALUES(p_tenant_id,v_grant.id,v_res,p_job_id,v_take,'hold','hold:'||v_res||':'||v_grant.id);
    v_needed:=v_needed-v_take;
    EXIT WHEN v_needed=0;
  END LOOP;
  IF v_needed>0 THEN RAISE EXCEPTION 'STUDIO_INSUFFICIENT_TLACOS'; END IF;
  RETURN v_res;
END;
$$;

ALTER TABLE public.studio_ai_routes DROP CONSTRAINT IF EXISTS studio_ai_routes_check;
UPDATE public.studio_ai_routes SET tlacos=2 WHERE operation<>'review' AND quality='premium';
ALTER TABLE public.studio_ai_routes ADD CONSTRAINT studio_ai_routes_check
  CHECK((operation='review' AND tlacos=0) OR (operation<>'review' AND tlacos=CASE WHEN quality='premium' THEN 2 ELSE 1 END));
UPDATE public.studio_plans SET monthly_tlacos=CASE code WHEN 'basic' THEN 20 WHEN 'pro' THEN 60 WHEN 'business' THEN 140 END
  WHERE code IN ('basic','pro','business');
UPDATE public.studio_credit_packs SET tlacos=CASE code WHEN 'mini' THEN 10 WHEN 'frequent' THEN 30 WHEN 'business' THEN 75 END
  WHERE code IN ('mini','frequent','business');
