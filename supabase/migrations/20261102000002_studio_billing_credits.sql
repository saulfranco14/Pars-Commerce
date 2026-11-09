CREATE TABLE public.studio_credit_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  pack_code text NOT NULL REFERENCES public.studio_credit_packs(code), amount_mxn numeric(12,2) NOT NULL CHECK(amount_mxn>0),
  tlacos integer NOT NULL CHECK(tlacos>0), catalog_version integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','refunded','disputed')),
  idempotency_key uuid NOT NULL, provider_payment_id text UNIQUE, provider_preference_id text UNIQUE, init_point text,
  created_by uuid NOT NULL REFERENCES auth.users(id), created_at timestamptz NOT NULL DEFAULT now(), last_reconciled_at timestamptz, UNIQUE(tenant_id,idempotency_key), UNIQUE(tenant_id,id)
);
CREATE TABLE public.studio_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  subscription_id uuid REFERENCES public.tenant_studio_subscriptions(id), credit_order_id uuid REFERENCES public.studio_credit_orders(id),
  provider_payment_id text NOT NULL UNIQUE, authorized_payment_id text UNIQUE,
  amount_mxn numeric(12,2) NOT NULL CHECK(amount_mxn>=0), currency text NOT NULL CHECK(currency='MXN'),
  status text NOT NULL CHECK(status IN ('pending','approved','rejected','refunded','disputed')),
  paid_at timestamptz, last_reconciled_at timestamptz, refunded_mxn numeric(12,2) NOT NULL DEFAULT 0 CHECK(refunded_mxn>=0 AND refunded_mxn<=amount_mxn), created_at timestamptz NOT NULL DEFAULT now(),
  CHECK(num_nonnulls(subscription_id,credit_order_id)=1), UNIQUE(tenant_id,id)
);
CREATE INDEX studio_payments_reconcile_idx ON public.studio_payments(status,last_reconciled_at,paid_at);
CREATE INDEX studio_payments_tenant_idx ON public.studio_payments(tenant_id,created_at DESC);
CREATE TABLE public.studio_payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid REFERENCES public.tenants(id),
  resource_type text NOT NULL, resource_id text NOT NULL, event_key text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'received' CHECK(status IN ('received','processing','processed','failed','ignored')),
  attempts integer NOT NULL DEFAULT 0, error_code text, payload_hash text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(), last_attempt_at timestamptz, processed_at timestamptz
);
CREATE INDEX studio_events_retry_idx ON public.studio_payment_events(status,last_attempt_at,received_at);
CREATE TABLE public.studio_subscription_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, subscription_id uuid NOT NULL,
  payment_id uuid NOT NULL, plan_code text NOT NULL REFERENCES public.studio_plans(code),
  starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL CHECK(ends_at>starts_at),
  amount_mxn numeric(12,2) NOT NULL, tlacos integer NOT NULL CHECK(tlacos>0),
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(subscription_id,starts_at), UNIQUE(payment_id), UNIQUE(tenant_id,id),
  FOREIGN KEY(tenant_id,subscription_id) REFERENCES public.tenant_studio_subscriptions(tenant_id,id),
  FOREIGN KEY(tenant_id,payment_id) REFERENCES public.studio_payments(tenant_id,id)
);
CREATE TABLE public.studio_credit_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  kind text NOT NULL CHECK(kind IN ('subscription','purchased','adjustment')), amount integer NOT NULL CHECK(amount>0),
  remaining integer NOT NULL CHECK(remaining>=0), reserved integer NOT NULL DEFAULT 0 CHECK(reserved>=0 AND reserved<=remaining),
  expires_at timestamptz, external_reference text NOT NULL UNIQUE, payment_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,id), CHECK(remaining<=amount),
  FOREIGN KEY(tenant_id,payment_id) REFERENCES public.studio_payments(tenant_id,id)
);
CREATE INDEX studio_credit_grants_spend_idx ON public.studio_credit_grants(tenant_id,expires_at,kind) WHERE remaining>0;
CREATE TABLE public.studio_credit_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES public.tenants(id), job_id uuid NOT NULL UNIQUE,
  amount integer NOT NULL CHECK(amount>0), status text NOT NULL DEFAULT 'held' CHECK(status IN ('held','captured','released')),
  expires_at timestamptz NOT NULL DEFAULT now()+interval '15 minutes', created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,id)
);
CREATE TABLE public.studio_credit_reservation_items (
  reservation_id uuid NOT NULL, tenant_id uuid NOT NULL, grant_id uuid NOT NULL, amount integer NOT NULL CHECK(amount>0),
  PRIMARY KEY(reservation_id,grant_id), FOREIGN KEY(tenant_id,reservation_id) REFERENCES public.studio_credit_reservations(tenant_id,id),
  FOREIGN KEY(tenant_id,grant_id) REFERENCES public.studio_credit_grants(tenant_id,id)
);
CREATE TABLE public.studio_credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES public.tenants(id), grant_id uuid,
  reservation_id uuid, job_id uuid, delta integer NOT NULL DEFAULT 0, reserved_delta integer NOT NULL DEFAULT 0,
  reason text NOT NULL CHECK(reason IN ('subscription_grant','purchase','hold','capture','release','expiry','refund','adjustment')),
  external_reference text NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY(tenant_id,grant_id) REFERENCES public.studio_credit_grants(tenant_id,id),
  FOREIGN KEY(tenant_id,reservation_id) REFERENCES public.studio_credit_reservations(tenant_id,id)
);
CREATE INDEX studio_credit_ledger_tenant_idx ON public.studio_credit_ledger(tenant_id,created_at DESC);
CREATE FUNCTION public.studio_immutable_record() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'STUDIO_IMMUTABLE_RECORD'; END; $$;
CREATE TRIGGER studio_immutable_ledger BEFORE UPDATE OR DELETE ON public.studio_credit_ledger FOR EACH ROW EXECUTE FUNCTION public.studio_immutable_record();
CREATE TRIGGER studio_immutable_versions BEFORE UPDATE OR DELETE ON public.studio_design_versions FOR EACH ROW EXECUTE FUNCTION public.studio_immutable_record();
CREATE TRIGGER studio_immutable_renders BEFORE UPDATE OR DELETE ON public.studio_renders FOR EACH ROW EXECUTE FUNCTION public.studio_immutable_record();

CREATE FUNCTION public.reserve_studio_credits(p_tenant_id uuid,p_job_id uuid,p_amount integer) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
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
CREATE FUNCTION public.capture_studio_credits(p_tenant_id uuid,p_job_id uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_res studio_credit_reservations; v_item studio_credit_reservation_items;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('studio:'||p_tenant_id::text,0));
  SELECT * INTO v_res FROM studio_credit_reservations WHERE tenant_id=p_tenant_id AND job_id=p_job_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'STUDIO_RESERVATION_NOT_FOUND'; END IF;
  IF v_res.status='captured' THEN RETURN true; END IF;
  IF v_res.status<>'held' THEN RAISE EXCEPTION 'STUDIO_RESERVATION_CLOSED'; END IF;
  FOR v_item IN SELECT * FROM studio_credit_reservation_items WHERE reservation_id=v_res.id ORDER BY grant_id LOOP
    UPDATE studio_credit_grants SET remaining=remaining-v_item.amount,reserved=reserved-v_item.amount WHERE id=v_item.grant_id;
    INSERT INTO studio_credit_ledger(tenant_id,grant_id,reservation_id,job_id,delta,reserved_delta,reason,external_reference)
      VALUES(p_tenant_id,v_item.grant_id,v_res.id,p_job_id,-v_item.amount,-v_item.amount,'capture','capture:'||v_res.id||':'||v_item.grant_id);
  END LOOP;
  UPDATE studio_credit_reservations SET status='captured' WHERE id=v_res.id;
  RETURN true;
END;
$$;
CREATE FUNCTION public.release_studio_credits(p_tenant_id uuid,p_job_id uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_res studio_credit_reservations; v_item studio_credit_reservation_items; v_expired boolean;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('studio:'||p_tenant_id::text,0));
  SELECT * INTO v_res FROM studio_credit_reservations WHERE tenant_id=p_tenant_id AND job_id=p_job_id FOR UPDATE;
  IF NOT FOUND OR v_res.status='released' THEN RETURN true; END IF;
  IF v_res.status='captured' THEN RAISE EXCEPTION 'STUDIO_RESERVATION_CLOSED'; END IF;
  FOR v_item IN SELECT * FROM studio_credit_reservation_items WHERE reservation_id=v_res.id ORDER BY grant_id LOOP
    SELECT expires_at<=now() INTO v_expired FROM studio_credit_grants WHERE id=v_item.grant_id FOR UPDATE;
    UPDATE studio_credit_grants SET reserved=reserved-v_item.amount,remaining=remaining-CASE WHEN v_expired THEN v_item.amount ELSE 0 END WHERE id=v_item.grant_id;
    INSERT INTO studio_credit_ledger(tenant_id,grant_id,reservation_id,job_id,delta,reserved_delta,reason,external_reference)
      VALUES(p_tenant_id,v_item.grant_id,v_res.id,p_job_id,CASE WHEN v_expired THEN -v_item.amount ELSE 0 END,-v_item.amount,'release','release:'||v_res.id||':'||v_item.grant_id);
  END LOOP;
  UPDATE studio_credit_reservations SET status='released' WHERE id=v_res.id;
  RETURN true;
END;
$$;
CREATE FUNCTION public.expire_studio_credits(p_tenant_id uuid) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_grant studio_credit_grants; v_total integer:=0; v_amount integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('studio:'||p_tenant_id::text,0));
  FOR v_grant IN SELECT * FROM studio_credit_grants WHERE tenant_id=p_tenant_id AND expires_at<=now() AND remaining>reserved FOR UPDATE LOOP
    v_amount:=v_grant.remaining-v_grant.reserved;
    UPDATE studio_credit_grants SET remaining=reserved WHERE id=v_grant.id;
    INSERT INTO studio_credit_ledger(tenant_id,grant_id,delta,reason,external_reference)
      VALUES(p_tenant_id,v_grant.id,-v_amount,'expiry','expiry:'||v_grant.id||':'||v_grant.remaining);
    v_total:=v_total+v_amount;
  END LOOP;
  RETURN v_total;
END;
$$;

CREATE FUNCTION public.apply_studio_credit_purchase(p_order_id uuid,p_provider_payment_id text,p_amount numeric,p_paid_at timestamptz)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_order studio_credit_orders; v_payment uuid; v_grant uuid;
BEGIN
  SELECT * INTO v_order FROM studio_credit_orders WHERE id=p_order_id FOR UPDATE;
  IF NOT FOUND OR v_order.amount_mxn<>p_amount THEN RAISE EXCEPTION 'STUDIO_PAYMENT_MISMATCH'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('studio:'||v_order.tenant_id::text,0));
  IF v_order.status IN ('refunded','disputed') THEN RAISE EXCEPTION 'STUDIO_PAYMENT_REVERSED'; END IF;
  IF v_order.status='approved' THEN
    IF v_order.provider_payment_id<>p_provider_payment_id THEN RAISE EXCEPTION 'STUDIO_DUPLICATE_PAYMENT'; END IF;
    SELECT id INTO v_grant FROM studio_credit_grants WHERE external_reference='pack:'||p_order_id; RETURN v_grant;
  END IF;
  INSERT INTO studio_payments(tenant_id,credit_order_id,provider_payment_id,amount_mxn,currency,status,paid_at)
    VALUES(v_order.tenant_id,v_order.id,p_provider_payment_id,p_amount,'MXN','approved',p_paid_at) RETURNING id INTO v_payment;
  INSERT INTO studio_credit_grants(tenant_id,kind,amount,remaining,external_reference,payment_id)
    VALUES(v_order.tenant_id,'purchased',v_order.tlacos,v_order.tlacos,'pack:'||p_order_id,v_payment) RETURNING id INTO v_grant;
  INSERT INTO studio_credit_ledger(tenant_id,grant_id,delta,reason,external_reference)
    VALUES(v_order.tenant_id,v_grant,v_order.tlacos,'purchase','purchase:'||p_order_id);
  UPDATE studio_credit_orders SET status='approved',provider_payment_id=p_provider_payment_id WHERE id=p_order_id;
  RETURN v_grant;
END;
$$;

CREATE FUNCTION public.grant_studio_subscription_credits(p_subscription_id uuid,p_provider_payment_id text,p_authorized_payment_id text,p_amount numeric,p_paid_at timestamptz,p_starts_at timestamptz,p_ends_at timestamptz)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_sub tenant_studio_subscriptions; v_payment uuid; v_period uuid; v_grant uuid; v_plan text; v_amount numeric; v_tlacos integer;
BEGIN
  SELECT * INTO v_sub FROM tenant_studio_subscriptions WHERE id=p_subscription_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'STUDIO_NOT_FOUND'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('studio:'||v_sub.tenant_id::text,0));
  IF EXISTS(SELECT 1 FROM studio_payments WHERE provider_payment_id=p_provider_payment_id AND subscription_id=p_subscription_id) THEN
    SELECT g.id INTO v_grant FROM studio_credit_grants g JOIN studio_payments p ON p.id=g.payment_id WHERE p.provider_payment_id=p_provider_payment_id; RETURN v_grant;
  END IF;
  IF p_starts_at IS NULL OR p_ends_at<=p_starts_at THEN RAISE EXCEPTION 'STUDIO_INVALID_PERIOD'; END IF;
  v_plan:=v_sub.plan_code; v_amount:=v_sub.contracted_amount_mxn; v_tlacos:=v_sub.contracted_tlacos;
  IF v_sub.pending_plan_code IS NOT NULL AND (v_sub.current_period_end IS NULL OR p_starts_at>=v_sub.current_period_end) AND (v_sub.plan_change_status='confirmed' OR p_amount=v_sub.pending_amount_mxn) THEN
    v_plan:=v_sub.pending_plan_code; v_amount:=v_sub.pending_amount_mxn; v_tlacos:=v_sub.pending_tlacos;
  END IF;
  IF p_amount<>v_amount THEN RAISE EXCEPTION 'STUDIO_PAYMENT_MISMATCH'; END IF;
  IF EXISTS(SELECT 1 FROM studio_subscription_periods WHERE subscription_id=p_subscription_id AND starts_at=p_starts_at) THEN RAISE EXCEPTION 'STUDIO_DUPLICATE_PERIOD'; END IF;
  IF EXISTS(SELECT 1 FROM studio_subscription_periods WHERE subscription_id=p_subscription_id AND starts_at<p_ends_at AND ends_at>p_starts_at) THEN RAISE EXCEPTION 'STUDIO_OVERLAPPING_PERIOD'; END IF;
  INSERT INTO studio_payments(tenant_id,subscription_id,provider_payment_id,authorized_payment_id,amount_mxn,currency,status,paid_at)
    VALUES(v_sub.tenant_id,v_sub.id,p_provider_payment_id,p_authorized_payment_id,p_amount,'MXN','approved',p_paid_at) RETURNING id INTO v_payment;
  INSERT INTO studio_subscription_periods(tenant_id,subscription_id,payment_id,plan_code,starts_at,ends_at,amount_mxn,tlacos)
    VALUES(v_sub.tenant_id,v_sub.id,v_payment,v_plan,p_starts_at,p_ends_at,p_amount,v_tlacos) RETURNING id INTO v_period;
  INSERT INTO studio_credit_grants(tenant_id,kind,amount,remaining,expires_at,external_reference,payment_id)
    VALUES(v_sub.tenant_id,'subscription',v_tlacos,v_tlacos,p_ends_at,'period:'||v_period,v_payment) RETURNING id INTO v_grant;
  INSERT INTO studio_credit_ledger(tenant_id,grant_id,delta,reason,external_reference)
    VALUES(v_sub.tenant_id,v_grant,v_tlacos,'subscription_grant','subscription:'||v_period);
  IF v_sub.current_period_end IS NULL OR p_ends_at>v_sub.current_period_end THEN
    UPDATE tenant_studio_subscriptions SET plan_code=v_plan,contracted_amount_mxn=v_amount,contracted_tlacos=v_tlacos,
      pending_plan_code=CASE WHEN pending_plan_code=v_plan THEN NULL ELSE pending_plan_code END,
      pending_amount_mxn=CASE WHEN pending_plan_code=v_plan THEN NULL ELSE pending_amount_mxn END,
      pending_tlacos=CASE WHEN pending_plan_code=v_plan THEN NULL ELSE pending_tlacos END,
      plan_change_status=CASE WHEN pending_plan_code=v_plan THEN NULL ELSE plan_change_status END,current_period_start=p_starts_at,current_period_end=p_ends_at,
      status=CASE WHEN cancel_at_period_end THEN 'cancelling' ELSE 'active' END,updated_at=now() WHERE id=v_sub.id;
  END IF;
  RETURN v_grant;
END;
$$;

CREATE FUNCTION public.studio_reverse_payment(p_provider_payment_id text,p_disputed boolean,p_refunded_mxn numeric DEFAULT NULL) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_payment studio_payments; v_grant studio_credit_grants; v_remove integer;
BEGIN
  SELECT * INTO v_payment FROM studio_payments WHERE provider_payment_id=p_provider_payment_id FOR UPDATE;
  IF NOT FOUND OR v_payment.status IN ('refunded','disputed') THEN RETURN true; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('studio:'||v_payment.tenant_id::text,0));
  FOR v_grant IN SELECT * FROM studio_credit_grants WHERE payment_id=v_payment.id FOR UPDATE LOOP
    v_remove:=v_grant.remaining-v_grant.reserved;
    UPDATE studio_credit_grants SET remaining=reserved,expires_at=now() WHERE id=v_grant.id;
    INSERT INTO studio_credit_ledger(tenant_id,grant_id,delta,reason,external_reference)
      VALUES(v_payment.tenant_id,v_grant.id,-v_remove,'refund','refund:'||v_payment.id||':'||v_grant.id);
    IF v_grant.remaining<v_grant.amount OR v_grant.reserved>0 THEN
      UPDATE tenant_studio_subscriptions SET ai_blocked=true WHERE tenant_id=v_payment.tenant_id;
    END IF;
  END LOOP;
  UPDATE studio_payments SET status=CASE WHEN p_disputed THEN 'disputed' ELSE 'refunded' END,refunded_mxn=CASE WHEN p_disputed THEN refunded_mxn ELSE coalesce(p_refunded_mxn,amount_mxn) END WHERE id=v_payment.id;
  IF v_payment.credit_order_id IS NOT NULL THEN UPDATE studio_credit_orders SET status=CASE WHEN p_disputed THEN 'disputed' ELSE 'refunded' END WHERE id=v_payment.credit_order_id; END IF;
  IF v_payment.subscription_id IS NOT NULL THEN UPDATE tenant_studio_subscriptions SET status='past_due',ai_blocked=true WHERE id=v_payment.subscription_id; END IF;
  INSERT INTO studio_activity_events(tenant_id,action,entity_id) VALUES(v_payment.tenant_id,'payment.reversed',v_payment.id);
  RETURN true;
END;
$$;

CREATE FUNCTION public.studio_flag_partial_refund(p_provider_payment_id text,p_refunded_mxn numeric) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_payment studio_payments;
BEGIN
  SELECT * INTO v_payment FROM studio_payments WHERE provider_payment_id=p_provider_payment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'STUDIO_PAYMENT_PENDING'; END IF;
  IF v_payment.status IN ('refunded','disputed') OR v_payment.refunded_mxn>=p_refunded_mxn THEN RETURN true; END IF;
  IF p_refunded_mxn<=0 OR p_refunded_mxn>=v_payment.amount_mxn THEN RAISE EXCEPTION 'STUDIO_VALIDATION'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('studio:'||v_payment.tenant_id::text,0));
  UPDATE studio_payments SET refunded_mxn=p_refunded_mxn WHERE id=v_payment.id;
  UPDATE tenant_studio_subscriptions SET ai_blocked=true WHERE tenant_id=v_payment.tenant_id;
  INSERT INTO studio_activity_events(tenant_id,action,entity_id,metadata) VALUES(v_payment.tenant_id,'payment.partial_refund_review',v_payment.id,jsonb_build_object('refunded_mxn',p_refunded_mxn));
  RETURN true;
END;
$$;

DO $$ DECLARE v_table text; v_function record; BEGIN
  FOREACH v_table IN ARRAY ARRAY['studio_credit_orders','studio_payments','studio_payment_events','studio_subscription_periods','studio_credit_grants','studio_credit_reservations','studio_credit_reservation_items','studio_credit_ledger'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',v_table);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',v_table);
    EXECUTE format('GRANT ALL ON public.%I TO service_role',v_table);
    IF v_table<>'studio_payment_events' THEN
      EXECUTE format('GRANT SELECT ON public.%I TO authenticated',v_table);
      EXECUTE format('CREATE POLICY studio_finance_read ON public.%I FOR SELECT TO authenticated USING(public.studio_has_permission(tenant_id,''studio.manage''))',v_table);
    END IF;
  END LOOP;
  FOR v_function IN SELECT oid::regprocedure AS signature FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname IN
    ('reserve_studio_credits','capture_studio_credits','release_studio_credits','expire_studio_credits','apply_studio_credit_purchase','grant_studio_subscription_credits','studio_reverse_payment','studio_flag_partial_refund') LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',v_function.signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',v_function.signature);
  END LOOP;
END $$;
