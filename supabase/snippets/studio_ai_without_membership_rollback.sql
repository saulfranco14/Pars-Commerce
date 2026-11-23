-- Rollback of 20261124000001_studio_ai_without_membership: AI requires an active membership again.

CREATE OR REPLACE FUNCTION public.studio_enqueue_generation(p_quote_id uuid,p_actor_id uuid,p_idempotency_key uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_quote studio_ai_quotes; v_job studio_ai_jobs; v_route studio_ai_routes; v_id uuid:=gen_random_uuid(); v_msg bigint; v_limits studio_runtime_limits; v_spend numeric;
BEGIN
  SELECT * INTO v_quote FROM studio_ai_quotes WHERE id=p_quote_id;
  IF NOT FOUND OR v_quote.requested_by<>p_actor_id THEN RAISE EXCEPTION 'STUDIO_NOT_FOUND'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('studio:'||v_quote.tenant_id::text,0));
  SELECT * INTO v_job FROM studio_ai_jobs WHERE tenant_id=v_quote.tenant_id AND (idempotency_key=p_idempotency_key OR quote_id=p_quote_id);
  IF FOUND THEN RETURN to_jsonb(v_job); END IF;
  IF NOT studio_has_permission(v_quote.tenant_id,'studio.create',p_actor_id) THEN RAISE EXCEPTION 'STUDIO_FORBIDDEN'; END IF;
  IF NOT studio_membership_active(v_quote.tenant_id) THEN RAISE EXCEPTION 'STUDIO_MEMBERSHIP_REQUIRED'; END IF;
  SELECT * INTO v_route FROM studio_ai_routes WHERE id=v_quote.route_id AND is_active;
  IF NOT FOUND OR v_quote.expires_at<=now() OR v_route.config_version<>v_quote.route_version OR v_route.tlacos<>v_quote.cost THEN RAISE EXCEPTION 'STUDIO_QUOTE_EXPIRED'; END IF;
  IF NOT EXISTS(SELECT 1 FROM studio_assets WHERE id=v_quote.asset_id AND tenant_id=v_quote.tenant_id AND status='ready') THEN RAISE EXCEPTION 'STUDIO_ASSET_NOT_READY'; END IF;
  SELECT * INTO v_limits FROM studio_runtime_limits WHERE id FOR UPDATE;
  IF v_limits.daily_budget_usd<=0 OR v_limits.tenant_monthly_budget_usd<=0 THEN RAISE EXCEPTION 'STUDIO_BUDGET_NOT_CONFIGURED'; END IF;
  SELECT coalesce(sum(cost),0) INTO v_spend FROM (SELECT budget_usd AS cost FROM studio_ai_jobs WHERE created_at>=date_trunc('day',now()) AND status<>'cancelled' UNION ALL SELECT estimated_cost_usd FROM studio_ai_reviews WHERE created_at>=date_trunc('day',now())) usage;
  IF v_spend+v_quote.budget_usd>v_limits.daily_budget_usd THEN RAISE EXCEPTION 'STUDIO_BUDGET_EXCEEDED'; END IF;
  SELECT coalesce(sum(cost),0) INTO v_spend FROM (SELECT budget_usd AS cost FROM studio_ai_jobs WHERE tenant_id=v_quote.tenant_id AND created_at>=date_trunc('month',now()) AND status<>'cancelled' UNION ALL SELECT estimated_cost_usd FROM studio_ai_reviews WHERE tenant_id=v_quote.tenant_id AND created_at>=date_trunc('month',now())) usage;
  IF v_spend+v_quote.budget_usd>v_limits.tenant_monthly_budget_usd THEN RAISE EXCEPTION 'STUDIO_BUDGET_EXCEEDED'; END IF;
  IF (SELECT count(*) FROM studio_ai_jobs WHERE tenant_id=v_quote.tenant_id AND status IN ('queued','processing'))>=v_limits.max_concurrent THEN RAISE EXCEPTION 'STUDIO_TOO_MANY_JOBS'; END IF;
  INSERT INTO studio_ai_jobs(id,tenant_id,design_id,requested_by,quote_id,input_asset_id,operation,quality,instructions,route_id,idempotency_key,reserved_tlacos,route_snapshot,budget_usd)
    VALUES(v_id,v_quote.tenant_id,v_quote.design_id,p_actor_id,p_quote_id,v_quote.asset_id,v_quote.operation,v_quote.quality,v_quote.instructions,v_quote.route_id,p_idempotency_key,v_quote.cost,v_quote.route_snapshot,v_quote.budget_usd);
  PERFORM reserve_studio_credits(v_quote.tenant_id,v_id,v_quote.cost);
  SELECT pgmq.send('studio_ai',jsonb_build_object('job_id',v_id)) INTO v_msg;
  UPDATE studio_ai_jobs SET queue_message_id=v_msg WHERE id=v_id RETURNING * INTO v_job;
  RETURN to_jsonb(v_job);
END;
$$;
CREATE OR REPLACE FUNCTION public.studio_claim_job(p_job_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_job studio_ai_jobs; v_tenant uuid;
BEGIN
  SELECT tenant_id INTO v_tenant FROM studio_ai_jobs WHERE id=p_job_id;
  IF v_tenant IS NULL THEN RETURN NULL; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('studio:'||v_tenant::text,0));
  SELECT * INTO v_job FROM studio_ai_jobs WHERE id=p_job_id FOR UPDATE SKIP LOCKED;
  IF NOT FOUND OR v_job.status IN ('succeeded','failed','cancelled') OR (v_job.status='processing' AND v_job.lease_until>now()) OR v_job.available_at>now() THEN RETURN NULL; END IF;
  IF v_job.provider_request_id IS NULL AND (NOT studio_has_permission(v_job.tenant_id,'studio.create',v_job.requested_by) OR NOT studio_membership_active(v_job.tenant_id) OR EXISTS(SELECT 1 FROM tenant_studio_subscriptions WHERE tenant_id=v_job.tenant_id AND ai_blocked)) THEN
    PERFORM release_studio_credits(v_job.tenant_id,v_job.id);
    UPDATE studio_ai_jobs SET status='failed',error_code='MEMBERSHIP_OR_PERMISSION_CHANGED',updated_at=now() WHERE id=v_job.id; RETURN NULL;
  END IF;
  IF v_job.status='processing' AND v_job.provider_request_id IS NULL THEN
    PERFORM release_studio_credits(v_job.tenant_id,v_job.id);
    UPDATE studio_ai_jobs SET status='failed',error_code='PROVIDER_OUTCOME_UNKNOWN',updated_at=now() WHERE id=v_job.id; RETURN NULL;
  END IF;
  UPDATE studio_ai_jobs SET status='processing',lease_token=gen_random_uuid(),lease_until=now()+interval '7 minutes',attempt_count=attempt_count+CASE WHEN provider_request_id IS NULL THEN 1 ELSE 0 END,updated_at=now()
    WHERE id=v_job.id RETURNING * INTO v_job;
  RETURN to_jsonb(v_job);
END;
$$;

CREATE OR REPLACE FUNCTION public.studio_claim_review(p_tenant_id uuid,p_actor_id uuid,p_version_id uuid,p_evaluator text,p_route_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_version studio_design_versions; v_review studio_ai_reviews; v_limit integer; v_route studio_ai_routes; v_limits studio_runtime_limits; v_spend numeric;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('studio-review:'||p_tenant_id::text,0));
  IF NOT studio_has_permission(p_tenant_id,'studio.create',p_actor_id) THEN RAISE EXCEPTION 'STUDIO_FORBIDDEN'; END IF;
  IF NOT studio_membership_active(p_tenant_id) THEN RAISE EXCEPTION 'STUDIO_MEMBERSHIP_REQUIRED'; END IF;
  SELECT * INTO v_version FROM studio_design_versions WHERE id=p_version_id AND tenant_id=p_tenant_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'STUDIO_NOT_FOUND'; END IF;
  SELECT * INTO v_review FROM studio_ai_reviews WHERE tenant_id=p_tenant_id AND scene_hash=v_version.scene_hash AND source_hash=v_version.source_hash AND evaluator_version=p_evaluator AND status<>'failed';
  IF FOUND AND v_review.status<>'failed' THEN RETURN to_jsonb(v_review)||jsonb_build_object('cached',true); END IF;
  SELECT p.monthly_reviews INTO v_limit FROM tenant_studio_subscriptions s JOIN studio_plans p ON p.code=s.plan_code WHERE s.tenant_id=p_tenant_id;
  IF (SELECT count(*) FROM studio_ai_reviews WHERE tenant_id=p_tenant_id AND design_id=v_version.design_id AND status<>'failed')>=2 OR
    (SELECT count(*) FROM studio_ai_reviews WHERE tenant_id=p_tenant_id AND created_at>=(SELECT current_period_start FROM tenant_studio_subscriptions WHERE tenant_id=p_tenant_id) AND status<>'failed')>=v_limit THEN RAISE EXCEPTION 'STUDIO_REVIEW_QUOTA'; END IF;
  SELECT * INTO v_route FROM studio_ai_routes WHERE id=p_route_id AND operation='review' AND is_active;
  IF NOT FOUND OR v_route.estimated_cost_usd<=0 THEN RAISE EXCEPTION 'STUDIO_BUDGET_NOT_CONFIGURED'; END IF;
  SELECT * INTO v_limits FROM studio_runtime_limits WHERE id FOR UPDATE;
  IF v_limits.daily_budget_usd<=0 OR v_limits.tenant_monthly_budget_usd<=0 THEN RAISE EXCEPTION 'STUDIO_BUDGET_NOT_CONFIGURED'; END IF;
  SELECT coalesce(sum(cost),0) INTO v_spend FROM (SELECT budget_usd AS cost FROM studio_ai_jobs WHERE created_at>=date_trunc('day',now()) AND status<>'cancelled' UNION ALL SELECT estimated_cost_usd FROM studio_ai_reviews WHERE created_at>=date_trunc('day',now())) usage;
  IF v_spend+v_route.estimated_cost_usd>v_limits.daily_budget_usd THEN RAISE EXCEPTION 'STUDIO_BUDGET_EXCEEDED'; END IF;
  SELECT coalesce(sum(cost),0) INTO v_spend FROM (SELECT budget_usd AS cost FROM studio_ai_jobs WHERE tenant_id=p_tenant_id AND created_at>=date_trunc('month',now()) AND status<>'cancelled' UNION ALL SELECT estimated_cost_usd FROM studio_ai_reviews WHERE tenant_id=p_tenant_id AND created_at>=date_trunc('month',now())) usage;
  IF v_spend+v_route.estimated_cost_usd>v_limits.tenant_monthly_budget_usd THEN RAISE EXCEPTION 'STUDIO_BUDGET_EXCEEDED'; END IF;
  INSERT INTO studio_ai_reviews(tenant_id,design_id,design_version_id,scene_hash,source_hash,evaluator_version,requested_by,estimated_cost_usd)
    VALUES(p_tenant_id,v_version.design_id,p_version_id,v_version.scene_hash,v_version.source_hash,p_evaluator,p_actor_id,v_route.estimated_cost_usd) RETURNING * INTO v_review;
  RETURN to_jsonb(v_review)||jsonb_build_object('cached',false);
END;
$$;
