CREATE EXTENSION IF NOT EXISTS pgmq;
SELECT pgmq.create('studio_ai');
REVOKE ALL ON SCHEMA pgmq FROM PUBLIC,anon,authenticated;
GRANT USAGE ON SCHEMA pgmq TO service_role;
REVOKE ALL ON ALL TABLES IN SCHEMA pgmq FROM PUBLIC,anon,authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA pgmq FROM PUBLIC,anon,authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA pgmq FROM PUBLIC,anon,authenticated;
GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA pgmq TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA pgmq TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA pgmq TO service_role;
DO $$ BEGIN
  IF to_regnamespace('pgmq_public') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON SCHEMA pgmq_public FROM PUBLIC,anon,authenticated';
    EXECUTE 'REVOKE ALL ON ALL FUNCTIONS IN SCHEMA pgmq_public FROM PUBLIC,anon,authenticated';
  END IF;
END $$;
CREATE TABLE public.studio_ai_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), operation text NOT NULL CHECK(operation IN ('improve_photo','style','variation','review')),
  quality text NOT NULL CHECK(quality IN ('economy','premium')), provider text NOT NULL CHECK(provider IN ('gemini','openai','flux')),
  model_env text NOT NULL CHECK(model_env IN ('STUDIO_GEMINI_IMAGE_MODEL','STUDIO_GEMINI_REVIEW_MODEL','STUDIO_OPENAI_IMAGE_MODEL','STUDIO_OPENAI_REVIEW_MODEL','STUDIO_FLUX_IMAGE_MODEL')), tlacos integer NOT NULL CHECK(tlacos BETWEEN 0 AND 20), estimated_cost_usd numeric(12,6) NOT NULL CHECK(estimated_cost_usd>=0),
  is_active boolean NOT NULL DEFAULT false, config_version integer NOT NULL DEFAULT 1, priority integer NOT NULL DEFAULT 0,
  UNIQUE(operation,quality,provider), CHECK((operation='review' AND tlacos=0) OR (operation<>'review' AND tlacos=CASE WHEN quality='premium' THEN 2 ELSE 1 END))
);
CREATE FUNCTION public.studio_route_revision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (to_jsonb(NEW)-'config_version') IS DISTINCT FROM (to_jsonb(OLD)-'config_version') THEN NEW.config_version:=OLD.config_version+1;
  ELSE NEW.config_version:=OLD.config_version; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER studio_route_revision BEFORE UPDATE ON public.studio_ai_routes FOR EACH ROW EXECUTE FUNCTION public.studio_route_revision();
INSERT INTO public.studio_ai_routes(operation,quality,provider,model_env,tlacos,estimated_cost_usd)
SELECT op,q,p,CASE p WHEN 'gemini' THEN 'STUDIO_GEMINI_IMAGE_MODEL' WHEN 'openai' THEN 'STUDIO_OPENAI_IMAGE_MODEL' ELSE 'STUDIO_FLUX_IMAGE_MODEL' END,
  CASE q WHEN 'premium' THEN 2 ELSE 1 END,0 FROM unnest(ARRAY['improve_photo','style','variation']) op CROSS JOIN unnest(ARRAY['economy','premium']) q CROSS JOIN unnest(ARRAY['gemini','openai','flux']) p;
INSERT INTO public.studio_ai_routes(operation,quality,provider,model_env,tlacos,estimated_cost_usd) VALUES('review','economy','gemini','STUDIO_GEMINI_REVIEW_MODEL',0,0),('review','economy','openai','STUDIO_OPENAI_REVIEW_MODEL',0,0);
CREATE TABLE public.studio_runtime_limits (
  id boolean PRIMARY KEY DEFAULT true CHECK(id), daily_budget_usd numeric(12,4) NOT NULL DEFAULT 0 CHECK(daily_budget_usd>=0),
  tenant_monthly_budget_usd numeric(12,4) NOT NULL DEFAULT 0 CHECK(tenant_monthly_budget_usd>=0), max_concurrent integer NOT NULL DEFAULT 2 CHECK(max_concurrent BETWEEN 1 AND 5)
);
INSERT INTO public.studio_runtime_limits DEFAULT VALUES;
CREATE TABLE public.studio_ai_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, design_id uuid NOT NULL, asset_id uuid NOT NULL,
  requested_by uuid NOT NULL REFERENCES auth.users(id), route_id uuid NOT NULL REFERENCES public.studio_ai_routes(id),
  route_snapshot jsonb NOT NULL CHECK(jsonb_typeof(route_snapshot)='array' AND jsonb_array_length(route_snapshot)>0),
  budget_usd numeric(12,6) NOT NULL CHECK(budget_usd>0), route_version integer NOT NULL, cost integer NOT NULL CHECK(cost>0), operation text NOT NULL, quality text NOT NULL,
  instructions text NOT NULL CHECK(length(instructions)<=1000), expires_at timestamptz NOT NULL DEFAULT now()+interval '5 minutes',
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,id),
  FOREIGN KEY(tenant_id,design_id,asset_id) REFERENCES public.studio_assets(tenant_id,design_id,id)
);
CREATE TABLE public.studio_ai_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, design_id uuid NOT NULL, requested_by uuid NOT NULL REFERENCES auth.users(id),
  quote_id uuid NOT NULL UNIQUE REFERENCES public.studio_ai_quotes(id), input_asset_id uuid NOT NULL, result_asset_id uuid,
  operation text NOT NULL, quality text NOT NULL, instructions text NOT NULL, route_id uuid NOT NULL REFERENCES public.studio_ai_routes(id),
  route_snapshot jsonb NOT NULL, budget_usd numeric(12,6) NOT NULL CHECK(budget_usd>0),
  status text NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','processing','succeeded','failed','cancelled')),
  idempotency_key uuid NOT NULL, reserved_tlacos integer NOT NULL CHECK(reserved_tlacos>0),
  attempt_count integer NOT NULL DEFAULT 0, lease_token uuid, lease_until timestamptz, queue_message_id bigint,
  provider_request_id text, polling_url text, error_code text, available_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id,id), UNIQUE(tenant_id,idempotency_key),
  FOREIGN KEY(tenant_id,design_id) REFERENCES public.studio_designs(tenant_id,id),
  FOREIGN KEY(tenant_id,design_id,input_asset_id) REFERENCES public.studio_assets(tenant_id,design_id,id),
  FOREIGN KEY(tenant_id,design_id,result_asset_id) REFERENCES public.studio_assets(tenant_id,design_id,id)
);
ALTER TABLE public.studio_credit_ledger ADD CONSTRAINT studio_ledger_job_fk FOREIGN KEY(tenant_id,job_id) REFERENCES public.studio_ai_jobs(tenant_id,id);
CREATE INDEX studio_jobs_tenant_design_idx ON public.studio_ai_jobs(tenant_id,design_id,created_at DESC);
ALTER TABLE public.studio_credit_reservations ADD CONSTRAINT studio_reservation_job_fk FOREIGN KEY(tenant_id,job_id) REFERENCES public.studio_ai_jobs(tenant_id,id);
CREATE INDEX studio_ai_jobs_queue_idx ON public.studio_ai_jobs(status,available_at,lease_until);
CREATE TABLE public.studio_ai_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, job_id uuid NOT NULL, provider text NOT NULL, model text NOT NULL,
  external_request_id text, status text NOT NULL CHECK(status IN ('started','pending','succeeded','failed','unknown')),
  estimated_cost_usd numeric(12,6) NOT NULL DEFAULT 0, actual_cost_usd numeric(12,6), error_code text,
  created_at timestamptz NOT NULL DEFAULT now(), finished_at timestamptz,
  FOREIGN KEY(tenant_id,job_id) REFERENCES public.studio_ai_jobs(tenant_id,id)
);
CREATE TABLE public.studio_ai_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, design_id uuid NOT NULL, design_version_id uuid NOT NULL,
  scene_hash text NOT NULL, source_hash text NOT NULL, evaluator_version text NOT NULL, requested_by uuid NOT NULL REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'processing' CHECK(status IN ('processing','ready','improvable','needs_review','failed')),
  estimated_cost_usd numeric(12,6) NOT NULL CHECK(estimated_cost_usd>0),
  findings jsonb NOT NULL DEFAULT '[]', recommendations jsonb NOT NULL DEFAULT '[]', created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY(tenant_id,design_id,design_version_id) REFERENCES public.studio_design_versions(tenant_id,design_id,id)
);
CREATE UNIQUE INDEX studio_review_cache_idx ON public.studio_ai_reviews(tenant_id,scene_hash,source_hash,evaluator_version) WHERE status<>'failed';
CREATE INDEX studio_review_tenant_idx ON public.studio_ai_reviews(tenant_id,created_at);

CREATE FUNCTION public.studio_enqueue_generation(p_quote_id uuid,p_actor_id uuid,p_idempotency_key uuid)
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
CREATE FUNCTION public.studio_claim_job(p_job_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
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
CREATE FUNCTION public.studio_finish_job(p_job_id uuid,p_lease_token uuid,p_asset_id uuid,p_error text DEFAULT NULL) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_job studio_ai_jobs; v_tenant uuid;
BEGIN
  SELECT tenant_id INTO v_tenant FROM studio_ai_jobs WHERE id=p_job_id;
  IF v_tenant IS NULL THEN RETURN false; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('studio:'||v_tenant::text,0));
  SELECT * INTO v_job FROM studio_ai_jobs WHERE id=p_job_id FOR UPDATE;
  IF NOT FOUND OR v_job.status<>'processing' OR v_job.lease_token<>p_lease_token OR v_job.lease_until<=now() THEN RETURN false; END IF;
  IF p_error IS NULL AND EXISTS(
    SELECT 1 FROM studio_credit_reservations reservation JOIN studio_credit_reservation_items item ON item.reservation_id=reservation.id
      JOIN studio_credit_grants grant_row ON grant_row.id=item.grant_id JOIN studio_payments payment ON payment.id=grant_row.payment_id
    WHERE reservation.job_id=v_job.id AND (payment.status IN ('refunded','disputed') OR (payment.refunded_mxn>0 AND EXISTS(SELECT 1 FROM tenant_studio_subscriptions WHERE tenant_id=v_job.tenant_id AND ai_blocked)))
  ) THEN p_error:='PAYMENT_REVERSED'; p_asset_id:=NULL; END IF;
  IF p_error IS NULL THEN
    IF NOT EXISTS(SELECT 1 FROM studio_assets WHERE id=p_asset_id AND tenant_id=v_job.tenant_id AND design_id=v_job.design_id AND kind='generated' AND status='pending' AND source_asset_id=v_job.input_asset_id) THEN RAISE EXCEPTION 'STUDIO_ASSET_NOT_READY'; END IF;
    UPDATE studio_assets SET status='ready' WHERE id=p_asset_id AND tenant_id=v_job.tenant_id;
    PERFORM capture_studio_credits(v_job.tenant_id,v_job.id);
  ELSE PERFORM release_studio_credits(v_job.tenant_id,v_job.id); END IF;
  UPDATE studio_ai_jobs SET status=CASE WHEN p_error IS NULL THEN 'succeeded' ELSE 'failed' END,result_asset_id=p_asset_id,error_code=p_error,lease_until=NULL,updated_at=now() WHERE id=p_job_id;
  IF v_job.queue_message_id IS NOT NULL THEN PERFORM pgmq.archive('studio_ai',v_job.queue_message_id); END IF;
  RETURN true;
END;
$$;
CREATE FUNCTION public.studio_cancel_job(p_tenant_id uuid,p_actor_id uuid,p_job_id uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_job studio_ai_jobs; v_tenant uuid;
BEGIN
  SELECT tenant_id INTO v_tenant FROM studio_ai_jobs WHERE id=p_job_id;
  IF v_tenant IS NULL THEN RAISE EXCEPTION 'STUDIO_NOT_FOUND'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('studio:'||v_tenant::text,0));
  IF NOT studio_has_permission(p_tenant_id,'studio.create',p_actor_id) THEN RAISE EXCEPTION 'STUDIO_FORBIDDEN'; END IF;
  SELECT * INTO v_job FROM studio_ai_jobs WHERE id=p_job_id AND tenant_id=p_tenant_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'STUDIO_NOT_FOUND'; END IF;
  IF v_job.status='cancelled' THEN RETURN true; END IF;
  IF v_job.status<>'queued' THEN RAISE EXCEPTION 'STUDIO_JOB_ALREADY_STARTED'; END IF;
  PERFORM release_studio_credits(p_tenant_id,p_job_id);
  UPDATE studio_ai_jobs SET status='cancelled',updated_at=now() WHERE id=p_job_id;
  IF v_job.queue_message_id IS NOT NULL THEN PERFORM pgmq.archive('studio_ai',v_job.queue_message_id); END IF;
  RETURN true;
END;
$$;

CREATE TABLE public.studio_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, design_id uuid NOT NULL, design_version_id uuid NOT NULL, render_id uuid NOT NULL,
  channel text NOT NULL CHECK(channel IN ('public_store','table_qr')), surface text NOT NULL CHECK(surface IN ('store_home_campaign','promotion_card','promotion_detail','product_campaign','plan_card','plan_detail','qr_promotion','qr_menu_campaign')),
  idempotency_key uuid NOT NULL, target_key text NOT NULL, source_type text NOT NULL CHECK(source_type IN ('product','promotion','subscription_plan','custom')), source_id uuid, source_hash text NOT NULL,
  title text NOT NULL CHECK(length(title) BETWEEN 1 AND 120), alt_text text NOT NULL CHECK(length(alt_text) BETWEEN 1 AND 300), destination_url text NOT NULL DEFAULT '',
  starts_at timestamptz NOT NULL DEFAULT now(), ends_at timestamptz, is_active boolean NOT NULL DEFAULT true,
  disabled_reason text CHECK(disabled_reason IN ('retired','replaced','source_changed','expired')),
  applied_by uuid NOT NULL REFERENCES auth.users(id), created_at timestamptz NOT NULL DEFAULT now(),
  CHECK(ends_at IS NULL OR ends_at>starts_at), UNIQUE(tenant_id,id), UNIQUE(tenant_id,surface,idempotency_key),
  FOREIGN KEY(tenant_id,design_id,design_version_id) REFERENCES public.studio_design_versions(tenant_id,design_id,id),
  FOREIGN KEY(tenant_id,render_id) REFERENCES public.studio_renders(tenant_id,id),
  CHECK((channel='table_qr')=(surface IN ('qr_promotion','qr_menu_campaign')))
);
CREATE UNIQUE INDEX studio_one_active_placement_idx ON public.studio_placements(tenant_id,channel,surface,target_key) WHERE is_active;
CREATE INDEX studio_placements_resolve_idx ON public.studio_placements(tenant_id,channel,surface) WHERE is_active;
CREATE TABLE public.studio_share_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, design_id uuid NOT NULL, design_version_id uuid NOT NULL,
  actor_id uuid NOT NULL REFERENCES auth.users(id), target text NOT NULL,
  action text NOT NULL CHECK(action IN ('exported','copy_text','share_sheet_opened','share_sheet_completed','share_sheet_cancelled','whatsapp_opened')),
  idempotency_key uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,idempotency_key),
  FOREIGN KEY(tenant_id,design_id,design_version_id) REFERENCES public.studio_design_versions(tenant_id,design_id,id)
);
CREATE FUNCTION public.studio_source_eligible(p_tenant_id uuid,p_type text,p_source_id uuid,p_channel text,p_source_hash text) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE v_ok boolean; v_tenant jsonb;
BEGIN
  SELECT to_jsonb(t) INTO v_tenant FROM tenants t WHERE id=p_tenant_id;
  IF v_tenant IS NULL OR (p_channel='public_store' AND coalesce((v_tenant->>'public_store_enabled')::boolean,false)=false) THEN RETURN false; END IF;
  IF studio_source_fingerprint(p_tenant_id,p_type,p_source_id) IS DISTINCT FROM p_source_hash THEN RETURN false; END IF;
  IF p_type='custom' THEN RETURN true; END IF;
  IF p_type='product' THEN SELECT is_public AND deleted_at IS NULL INTO v_ok FROM products WHERE tenant_id=p_tenant_id AND id=p_source_id;
  ELSIF p_type='subscription_plan' THEN SELECT status='active' INTO v_ok FROM offer_plans WHERE tenant_id=p_tenant_id AND id=p_source_id;
  ELSIF p_type='promotion' THEN
    IF p_channel='table_qr' AND coalesce((v_tenant->>'onsite_promotions_enabled')::boolean,true)=false THEN RETURN false; END IF;
    SELECT status='active' AND (valid_from IS NULL OR valid_from<=now()) AND (valid_until IS NULL OR valid_until>now())
      AND sales_channels @> ARRAY[CASE WHEN p_channel='table_qr' THEN 'onsite' ELSE 'public_store' END] INTO v_ok FROM promotions WHERE tenant_id=p_tenant_id AND id=p_source_id;
  END IF;
  RETURN coalesce(v_ok,false);
END;
$$;
CREATE FUNCTION public.studio_resolve_placements(p_tenant_id uuid,p_channel text,p_surface text,p_source_ids uuid[] DEFAULT NULL)
RETURNS SETOF public.studio_placements LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT * FROM studio_placements p WHERE tenant_id=p_tenant_id AND channel=p_channel AND surface=p_surface AND is_active
    AND starts_at<=now() AND (ends_at IS NULL OR ends_at>now()) AND (p_source_ids IS NULL OR source_id=ANY(p_source_ids))
    AND studio_source_eligible(tenant_id,source_type,source_id,channel,source_hash);
$$;
CREATE FUNCTION public.studio_apply_placement(p_tenant_id uuid,p_actor_id uuid,p_version_id uuid,p_render_id uuid,p_surface text,p_title text,p_alt text,p_url text,p_start timestamptz,p_end timestamptz,p_key uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_version studio_design_versions; v_design studio_designs; v_channel text; v_target text; v_row studio_placements;
BEGIN
  IF NOT studio_has_permission(p_tenant_id,'studio.publish',p_actor_id) THEN RAISE EXCEPTION 'STUDIO_FORBIDDEN'; END IF;
  IF NOT studio_membership_active(p_tenant_id) THEN RAISE EXCEPTION 'STUDIO_MEMBERSHIP_REQUIRED'; END IF;
  SELECT * INTO v_version FROM studio_design_versions WHERE tenant_id=p_tenant_id AND id=p_version_id;
  IF NOT FOUND OR v_version.is_preparation THEN RAISE EXCEPTION 'STUDIO_VERSION_NOT_PUBLISHABLE'; END IF;
  SELECT * INTO v_design FROM studio_designs WHERE tenant_id=p_tenant_id AND id=v_version.design_id;
  IF v_design.status='archived' THEN RAISE EXCEPTION 'STUDIO_VERSION_NOT_PUBLISHABLE'; END IF;
  IF NOT EXISTS(SELECT 1 FROM studio_renders r JOIN studio_assets a ON a.id=r.asset_id AND a.tenant_id=r.tenant_id WHERE r.id=p_render_id AND r.tenant_id=p_tenant_id AND r.design_version_id=p_version_id AND r.surface=p_surface AND a.status='ready') THEN RAISE EXCEPTION 'STUDIO_RENDER_MISMATCH'; END IF;
  IF p_surface NOT IN ('store_home_campaign','promotion_card','promotion_detail','product_campaign','plan_card','plan_detail','qr_promotion','qr_menu_campaign') THEN RAISE EXCEPTION 'STUDIO_INVALID_SURFACE'; END IF;
  IF (p_surface IN ('promotion_card','promotion_detail','qr_promotion') AND v_design.source_type<>'promotion') OR (p_surface IN ('plan_card','plan_detail') AND v_design.source_type<>'subscription_plan') OR (p_surface='product_campaign' AND v_design.source_type<>'product') THEN RAISE EXCEPTION 'STUDIO_INVALID_SURFACE'; END IF;
  v_channel:=CASE WHEN p_surface IN ('qr_promotion','qr_menu_campaign') THEN 'table_qr' ELSE 'public_store' END;
  IF NOT studio_source_eligible(p_tenant_id,v_design.source_type,v_design.source_id,v_channel,v_version.source_hash) THEN RAISE EXCEPTION 'STUDIO_SOURCE_NOT_ELIGIBLE'; END IF;
  IF v_design.source_type='custom' AND p_end IS NULL THEN RAISE EXCEPTION 'STUDIO_CAMPAIGN_END_REQUIRED'; END IF;
  v_target:=CASE WHEN p_surface IN ('store_home_campaign','qr_menu_campaign') THEN 'campaign' ELSE v_design.source_type||':'||v_design.source_id::text END;
  PERFORM pg_advisory_xact_lock(hashtextextended('placement:'||p_tenant_id::text||':'||p_surface||':'||v_target,0));
  SELECT * INTO v_row FROM studio_placements WHERE tenant_id=p_tenant_id AND surface=p_surface AND idempotency_key=p_key;
  IF FOUND THEN RETURN to_jsonb(v_row); END IF;
  UPDATE studio_placements SET is_active=false,disabled_reason='replaced' WHERE tenant_id=p_tenant_id AND surface=p_surface AND target_key=v_target AND is_active;
  INSERT INTO studio_placements(tenant_id,design_id,design_version_id,render_id,channel,surface,idempotency_key,target_key,source_type,source_id,source_hash,title,alt_text,destination_url,starts_at,ends_at,applied_by)
    VALUES(p_tenant_id,v_design.id,p_version_id,p_render_id,v_channel,p_surface,p_key,v_target,v_design.source_type,v_design.source_id,v_version.source_hash,p_title,p_alt,p_url,p_start,p_end,p_actor_id) RETURNING * INTO v_row;
  INSERT INTO studio_activity_events(tenant_id,actor_id,action,entity_id) VALUES(p_tenant_id,p_actor_id,'placement.applied',v_row.id);
  RETURN to_jsonb(v_row);
END;
$$;

CREATE FUNCTION public.studio_claim_review(p_tenant_id uuid,p_actor_id uuid,p_version_id uuid,p_evaluator text,p_route_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
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

DO $$ DECLARE v_table text; v_function record; BEGIN
  FOREACH v_table IN ARRAY ARRAY['studio_ai_routes','studio_runtime_limits','studio_ai_quotes','studio_ai_jobs','studio_ai_attempts','studio_ai_reviews','studio_placements','studio_share_events'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',v_table);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',v_table);
    EXECUTE format('GRANT ALL ON public.%I TO service_role',v_table);
    IF v_table IN ('studio_ai_jobs','studio_ai_reviews','studio_placements','studio_share_events') THEN
      EXECUTE format('GRANT SELECT ON public.%I TO authenticated',v_table);
      EXECUTE format('CREATE POLICY studio_read ON public.%I FOR SELECT TO authenticated USING(public.studio_has_permission(tenant_id,''studio.read''))',v_table);
    END IF;
  END LOOP;
  FOR v_function IN SELECT oid::regprocedure AS signature FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname IN ('studio_enqueue_generation','studio_claim_job','studio_finish_job','studio_cancel_job','studio_source_eligible','studio_resolve_placements','studio_apply_placement','studio_claim_review') LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',v_function.signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',v_function.signature);
  END LOOP;
END $$;

REVOKE SELECT ON public.studio_ai_jobs,public.studio_ai_reviews FROM authenticated;
GRANT SELECT(id,tenant_id,design_id,status,operation,reserved_tlacos,result_asset_id,error_code,created_at,updated_at) ON public.studio_ai_jobs TO authenticated;
GRANT SELECT(id,tenant_id,design_id,design_version_id,status,findings,recommendations,created_at,requested_by) ON public.studio_ai_reviews TO authenticated;
