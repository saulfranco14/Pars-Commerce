-- Read-only operational checks after migration. Do not print Vault secrets.
SELECT code,amount_mxn,monthly_tlacos,monthly_reviews,catalog_version,is_active FROM public.studio_plans;
SELECT id,daily_budget_usd,tenant_monthly_budget_usd,max_concurrent FROM public.studio_runtime_limits;
SELECT provider,operation,quality,model_env,is_active,estimated_cost_usd,config_version FROM public.studio_ai_routes ORDER BY operation,quality,priority;
SELECT status,count(*),min(created_at) AS oldest FROM public.studio_ai_jobs GROUP BY status;
SELECT tenant_id,id,job_id,amount,expires_at FROM public.studio_credit_reservations WHERE status='held' AND expires_at<now();
SELECT count(*) AS invalid_grants FROM public.studio_credit_grants WHERE remaining<0 OR reserved<0 OR reserved>remaining;
SELECT status,count(*) FROM public.studio_payment_events GROUP BY status;
SELECT count(*) AS stale_placements FROM public.studio_placements WHERE is_active AND NOT public.studio_source_eligible(tenant_id,source_type,source_id,channel,source_hash);
SELECT id,public,file_size_limit,allowed_mime_types FROM storage.buckets WHERE id='studio-assets';
SELECT jobname,schedule,active FROM cron.job WHERE jobname IN ('studio-worker','studio-reconcile');
SELECT has_function_privilege('authenticated','public.reserve_studio_credits(uuid,uuid,integer)','execute') AS browser_can_reserve;
SELECT * FROM public.studio_orphan_storage_paths(25);
