-- Studio images with Gemini, run inside the app (no Edge worker needed):
-- * Gemini routes on: economy uses STUDIO_GEMINI_IMAGE_MODEL (1 Tlaco),
--   premium uses STUDIO_GEMINI_PREMIUM_MODEL (2 Tlacos). Other providers off.
-- * A generation can carry a second image (reference_asset_id): "same scene,
--   another product".
-- * Budgets so a business cannot run up the bill; generated images are listed
--   per business so they can be reused in other ads.
-- Rollback: supabase/snippets/studio_gemini_images_rollback.sql

ALTER TABLE public.studio_ai_routes DROP CONSTRAINT IF EXISTS studio_ai_routes_model_env_check;
ALTER TABLE public.studio_ai_routes ADD CONSTRAINT studio_ai_routes_model_env_check CHECK(model_env IN ('STUDIO_GEMINI_IMAGE_MODEL','STUDIO_GEMINI_PREMIUM_MODEL','STUDIO_GEMINI_REVIEW_MODEL','STUDIO_OPENAI_IMAGE_MODEL','STUDIO_OPENAI_REVIEW_MODEL','STUDIO_FLUX_IMAGE_MODEL'));

UPDATE public.studio_ai_routes SET is_active=false WHERE provider<>'gemini' AND is_active;
UPDATE public.studio_ai_routes
  SET is_active=true,
      model_env=CASE quality WHEN 'premium' THEN 'STUDIO_GEMINI_PREMIUM_MODEL' ELSE 'STUDIO_GEMINI_IMAGE_MODEL' END,
      estimated_cost_usd=CASE quality WHEN 'premium' THEN 0.14 ELSE 0.04 END
  WHERE provider='gemini' AND operation IN ('improve_photo','style','variation');

UPDATE public.studio_runtime_limits
  SET daily_budget_usd=GREATEST(daily_budget_usd,25),
      tenant_monthly_budget_usd=GREATEST(tenant_monthly_budget_usd,6),
      max_concurrent=GREATEST(max_concurrent,3);

ALTER TABLE public.studio_ai_quotes ADD COLUMN IF NOT EXISTS reference_asset_id uuid;
ALTER TABLE public.studio_ai_jobs ADD COLUMN IF NOT EXISTS reference_asset_id uuid;

CREATE INDEX IF NOT EXISTS studio_assets_generated_idx
  ON public.studio_assets(tenant_id,created_at DESC) WHERE kind='generated' AND status='ready';

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
  IF EXISTS(SELECT 1 FROM tenant_studio_subscriptions WHERE tenant_id=v_quote.tenant_id AND ai_blocked) THEN RAISE EXCEPTION 'STUDIO_FORBIDDEN'; END IF;
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
  INSERT INTO studio_ai_jobs(id,tenant_id,design_id,requested_by,quote_id,input_asset_id,operation,quality,instructions,route_id,idempotency_key,reserved_tlacos,route_snapshot,budget_usd,reference_asset_id)
    VALUES(v_id,v_quote.tenant_id,v_quote.design_id,p_actor_id,p_quote_id,v_quote.asset_id,v_quote.operation,v_quote.quality,v_quote.instructions,v_quote.route_id,p_idempotency_key,v_quote.cost,v_quote.route_snapshot,v_quote.budget_usd,v_quote.reference_asset_id);
  PERFORM reserve_studio_credits(v_quote.tenant_id,v_id,v_quote.cost);
  SELECT pgmq.send('studio_ai',jsonb_build_object('job_id',v_id)) INTO v_msg;
  UPDATE studio_ai_jobs SET queue_message_id=v_msg WHERE id=v_id RETURNING * INTO v_job;
  RETURN to_jsonb(v_job);
END;
$$;
