CREATE TABLE public.studio_rate_limits (
  scope text NOT NULL, window_start timestamptz NOT NULL, hits integer NOT NULL DEFAULT 1,
  PRIMARY KEY(scope,window_start)
);
ALTER TABLE public.studio_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.studio_rate_limits FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.studio_rate_limits TO service_role;
CREATE FUNCTION public.studio_rate_limit(p_scope text,p_limit integer) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_hits integer;
BEGIN
  INSERT INTO studio_rate_limits(scope,window_start) VALUES(p_scope,date_trunc('minute',now()))
    ON CONFLICT(scope,window_start) DO UPDATE SET hits=studio_rate_limits.hits+1 RETURNING hits INTO v_hits;
  RETURN v_hits<=p_limit;
END;
$$;
CREATE FUNCTION public.studio_begin_checkout(p_tenant_id uuid,p_actor_id uuid,p_plan_code text,p_catalog_version integer,p_key uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_sub tenant_studio_subscriptions; v_plan studio_plans;
BEGIN
  IF NOT studio_has_permission(p_tenant_id,'studio.read',p_actor_id) OR NOT EXISTS(SELECT 1 FROM tenant_memberships m JOIN tenant_roles r ON r.id=m.role_id WHERE m.tenant_id=p_tenant_id AND m.user_id=p_actor_id AND r.name='owner') THEN RAISE EXCEPTION 'STUDIO_FORBIDDEN'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('studio-checkout:'||p_tenant_id::text,0));
  IF studio_membership_active(p_tenant_id) THEN RAISE EXCEPTION 'STUDIO_MEMBERSHIP_ALREADY_ACTIVE'; END IF;
  SELECT * INTO v_plan FROM studio_plans WHERE code=p_plan_code AND is_active FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'STUDIO_NOT_FOUND'; END IF;
  IF v_plan.catalog_version<>p_catalog_version THEN RAISE EXCEPTION 'STUDIO_CATALOG_CHANGED'; END IF;
  SELECT * INTO v_sub FROM tenant_studio_subscriptions WHERE tenant_id=p_tenant_id FOR UPDATE;
  IF FOUND AND v_sub.status='pending_payment' AND v_sub.checkout_key IS NOT NULL THEN
    IF v_sub.plan_code<>p_plan_code THEN RAISE EXCEPTION 'STUDIO_CHECKOUT_IN_PROGRESS'; END IF;
    RETURN to_jsonb(v_sub)||jsonb_build_object('claimed',false);
  END IF;
  IF FOUND AND v_sub.mp_preapproval_id IS NOT NULL AND v_sub.status<>'cancelled' THEN RAISE EXCEPTION 'STUDIO_CHECKOUT_IN_PROGRESS'; END IF;
  INSERT INTO tenant_studio_subscriptions(tenant_id,plan_code,contracted_amount_mxn,contracted_tlacos,checkout_key)
    VALUES(p_tenant_id,p_plan_code,v_plan.amount_mxn,v_plan.monthly_tlacos,p_key)
    ON CONFLICT(tenant_id) DO UPDATE SET plan_code=excluded.plan_code,contracted_amount_mxn=excluded.contracted_amount_mxn,contracted_tlacos=excluded.contracted_tlacos,
      checkout_key=p_key,status='pending_payment',mp_preapproval_id=NULL,mp_init_point=NULL,cancel_at_period_end=false,pending_plan_code=NULL,pending_amount_mxn=NULL,pending_tlacos=NULL,plan_change_status=NULL,updated_at=now()
    RETURNING * INTO v_sub;
  RETURN to_jsonb(v_sub)||jsonb_build_object('claimed',true);
END;
$$;

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE FUNCTION public.studio_confirm_plan_change(p_subscription_id uuid,p_plan_code text,p_amount numeric) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_sub tenant_studio_subscriptions;
BEGIN
  SELECT * INTO v_sub FROM tenant_studio_subscriptions WHERE id=p_subscription_id FOR UPDATE;
  IF NOT FOUND OR v_sub.status<>'active' OR v_sub.cancel_at_period_end THEN RETURN false; END IF;
  IF v_sub.pending_plan_code IS NULL AND v_sub.plan_code=p_plan_code AND v_sub.contracted_amount_mxn=p_amount THEN RETURN true; END IF;
  IF v_sub.pending_plan_code IS DISTINCT FROM p_plan_code OR v_sub.pending_amount_mxn IS DISTINCT FROM p_amount THEN RETURN false; END IF;
  UPDATE tenant_studio_subscriptions SET plan_change_status='confirmed',updated_at=now() WHERE id=p_subscription_id;
  RETURN true;
END;
$$;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE FUNCTION public.studio_cron_tick() RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_url text; v_secret text;
BEGIN
  SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name='studio_worker_url';
  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name='studio_worker_secret';
  IF v_url IS NULL OR v_secret IS NULL THEN RETURN NULL; END IF;
  RETURN net.http_post(url:=v_url,body:='{}'::jsonb,headers:=jsonb_build_object('Content-Type','application/json','x-studio-worker-secret',v_secret),timeout_milliseconds:=5000);
END;
$$;
CREATE FUNCTION public.studio_reconcile_tick() RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_url text; v_secret text;
BEGIN
  SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name='studio_reconcile_url';
  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name='studio_reconcile_secret';
  IF v_url IS NULL OR v_secret IS NULL THEN RETURN NULL; END IF;
  RETURN net.http_post(url:=v_url,body:='{}'::jsonb,headers:=jsonb_build_object('Content-Type','application/json','x-studio-cron-secret',v_secret),timeout_milliseconds:=55000);
END;
$$;
CREATE FUNCTION public.studio_take_job() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_message record; v_job jsonb; v_status text;
BEGIN
  SELECT * INTO v_message FROM pgmq.read('studio_ai',420,1);
  IF NOT FOUND THEN RETURN NULL; END IF;
  v_job:=studio_claim_job((v_message.message->>'job_id')::uuid);
  IF v_job IS NULL THEN
    SELECT status INTO v_status FROM studio_ai_jobs WHERE id=(v_message.message->>'job_id')::uuid;
    IF v_status IS NULL OR v_status IN ('succeeded','failed','cancelled') THEN PERFORM pgmq.archive('studio_ai',v_message.msg_id); END IF;
  END IF;
  RETURN v_job;
END;
$$;
CREATE FUNCTION public.studio_adjust_credits(p_tenant_id uuid,p_actor_id uuid,p_amount integer,p_reason text,p_key uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_grant uuid;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.platform_admins WHERE user_id=p_actor_id) THEN RAISE EXCEPTION 'STUDIO_FORBIDDEN'; END IF;
  IF p_amount NOT BETWEEN 1 AND 500 OR length(btrim(p_reason)) NOT BETWEEN 10 AND 300 THEN RAISE EXCEPTION 'STUDIO_INVALID_ADJUSTMENT'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('studio:'||p_tenant_id::text,0));
  SELECT id INTO v_grant FROM studio_credit_grants WHERE tenant_id=p_tenant_id AND external_reference='adjustment:'||p_key;
  IF FOUND THEN RETURN v_grant; END IF;
  INSERT INTO studio_credit_grants(tenant_id,kind,amount,remaining,external_reference) VALUES(p_tenant_id,'adjustment',p_amount,p_amount,'adjustment:'||p_key) RETURNING id INTO v_grant;
  INSERT INTO studio_credit_ledger(tenant_id,grant_id,delta,reason,external_reference) VALUES(p_tenant_id,v_grant,p_amount,'adjustment','adjustment:'||p_key);
  INSERT INTO studio_activity_events(tenant_id,actor_id,action,entity_id,metadata) VALUES(p_tenant_id,p_actor_id,'credits.adjusted',v_grant,jsonb_build_object('amount',p_amount,'reason',p_reason));
  RETURN v_grant;
END;
$$;
CREATE FUNCTION public.studio_pending_job(p_job_id uuid,p_lease_token uuid,p_request_id text,p_polling_url text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_job studio_ai_jobs;
BEGIN
  SELECT * INTO v_job FROM studio_ai_jobs WHERE id=p_job_id FOR UPDATE;
  IF NOT FOUND OR v_job.status<>'processing' OR v_job.lease_token<>p_lease_token OR v_job.lease_until<=now() THEN RETURN false; END IF;
  UPDATE studio_ai_jobs SET provider_request_id=p_request_id,polling_url=p_polling_url,lease_until=now(),available_at=now()+interval '10 seconds',updated_at=now() WHERE id=p_job_id;
  PERFORM pgmq.set_vt('studio_ai',v_job.queue_message_id,10);
  RETURN true;
END;
$$;
CREATE FUNCTION public.studio_resolve_credit_review(p_tenant_id uuid,p_actor_id uuid,p_reason text,p_key uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.platform_admins WHERE user_id=p_actor_id) THEN RAISE EXCEPTION 'STUDIO_FORBIDDEN'; END IF;
  IF length(btrim(p_reason)) NOT BETWEEN 10 AND 300 THEN RAISE EXCEPTION 'STUDIO_VALIDATION'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('studio:'||p_tenant_id::text,0));
  IF EXISTS(SELECT 1 FROM studio_activity_events WHERE tenant_id=p_tenant_id AND entity_id=p_key AND action='payment.review_resolved') THEN RETURN true; END IF;
  UPDATE tenant_studio_subscriptions SET ai_blocked=false,updated_at=now() WHERE tenant_id=p_tenant_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'STUDIO_NOT_FOUND'; END IF;
  INSERT INTO studio_activity_events(tenant_id,actor_id,action,entity_id,metadata) VALUES(p_tenant_id,p_actor_id,'payment.review_resolved',p_key,jsonb_build_object('reason',p_reason));
  RETURN true;
END;
$$;
CREATE FUNCTION public.studio_retry_job(p_job_id uuid,p_lease_token uuid,p_error text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_job studio_ai_jobs; v_delay integer; v_next uuid;
BEGIN
  SELECT * INTO v_job FROM studio_ai_jobs WHERE id=p_job_id FOR UPDATE;
  IF NOT FOUND OR v_job.status<>'processing' OR v_job.lease_token<>p_lease_token OR v_job.lease_until<=now() THEN RETURN false; END IF;
  IF v_job.provider_request_id IS NULL THEN
    SELECT (candidate->>'id')::uuid INTO v_next FROM jsonb_array_elements(v_job.route_snapshot) WITH ORDINALITY AS routes(candidate,position)
      JOIN studio_ai_routes route ON route.id=(candidate->>'id')::uuid AND route.is_active
      WHERE route.id<>v_job.route_id ORDER BY position LIMIT 1;
  END IF;
  v_delay:=least(120,30*(2^least(v_job.attempt_count,3))::integer);
  UPDATE studio_ai_jobs SET status='queued',route_id=coalesce(v_next,route_id),lease_token=NULL,lease_until=NULL,error_code=p_error,available_at=now()+make_interval(secs=>v_delay),updated_at=now() WHERE id=p_job_id;
  PERFORM pgmq.set_vt('studio_ai',v_job.queue_message_id,v_delay);
  RETURN true;
END;
$$;
CREATE FUNCTION public.studio_reconcile_state() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_job studio_ai_jobs; v_candidate record; v_tenant uuid; v_released integer:=0; v_placements integer;
BEGIN
  FOR v_candidate IN SELECT id,tenant_id FROM studio_ai_jobs WHERE (status IN ('queued','processing') AND created_at<now()-interval '15 minutes') OR (status='processing' AND lease_until<now()-interval '3 minutes') LOOP
    PERFORM pg_advisory_xact_lock(hashtextextended('studio:'||v_candidate.tenant_id::text,0));
    SELECT * INTO v_job FROM studio_ai_jobs WHERE id=v_candidate.id AND status IN ('queued','processing') FOR UPDATE SKIP LOCKED;
    IF NOT FOUND THEN CONTINUE; END IF;
    PERFORM release_studio_credits(v_job.tenant_id,v_job.id);
    UPDATE studio_ai_jobs SET status='failed',error_code='JOB_TIMEOUT',updated_at=now() WHERE id=v_job.id;
    IF v_job.queue_message_id IS NOT NULL THEN PERFORM pgmq.archive('studio_ai',v_job.queue_message_id); END IF;
    v_released:=v_released+1;
  END LOOP;
  FOR v_tenant IN SELECT DISTINCT tenant_id FROM studio_credit_grants WHERE expires_at<=now() AND remaining>reserved LOOP PERFORM expire_studio_credits(v_tenant); END LOOP;
  UPDATE studio_placements SET is_active=false,disabled_reason=CASE WHEN ends_at<=now() THEN 'expired' ELSE 'source_changed' END WHERE is_active AND ((ends_at IS NOT NULL AND ends_at<=now()) OR NOT studio_source_eligible(tenant_id,source_type,source_id,channel,source_hash));
  GET DIAGNOSTICS v_placements=ROW_COUNT;
  UPDATE tenant_studio_subscriptions SET status='cancelled',updated_at=now() WHERE status='cancelling' AND current_period_end<=now();
  UPDATE studio_ai_reviews SET status='failed' WHERE status='processing' AND created_at<now()-interval '10 minutes';
  DELETE FROM studio_rate_limits WHERE window_start<now()-interval '1 day';
  DELETE FROM studio_ai_quotes WHERE expires_at<now()-interval '1 day' AND NOT EXISTS(SELECT 1 FROM studio_ai_jobs WHERE quote_id=studio_ai_quotes.id);
  RETURN jsonb_build_object('released',v_released,'suspended',v_placements);
END;
$$;
CREATE FUNCTION public.studio_orphan_storage_paths(p_limit integer DEFAULT 25) RETURNS TABLE(storage_path text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT object.name FROM storage.objects object WHERE object.bucket_id='studio-assets' AND object.created_at<now()-interval '24 hours'
    AND NOT EXISTS(SELECT 1 FROM studio_assets asset WHERE asset.storage_path=object.name)
    ORDER BY object.created_at LIMIT least(greatest(p_limit,1),100);
$$;
DO $$ DECLARE v_function record; BEGIN
  FOR v_function IN SELECT oid::regprocedure AS signature FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname IN ('studio_rate_limit','studio_begin_checkout','studio_confirm_plan_change','studio_cron_tick','studio_reconcile_tick','studio_reconcile_state','studio_take_job','studio_pending_job','studio_retry_job','studio_adjust_credits','studio_resolve_credit_review','studio_orphan_storage_paths') LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',v_function.signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',v_function.signature);
  END LOOP;
END $$;
