-- Operational rollback preserves designs, subscriptions, payments and ledger.
-- First disable STUDIO_CHECKOUT_ENABLED and STUDIO_AI_ENABLED in both runtimes.
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname IN ('studio-worker','studio-reconcile');
UPDATE public.studio_ai_routes SET is_active=false;
UPDATE public.studio_placements SET is_active=false WHERE is_active;
-- Do not drop tables or cancel paid subscriptions without a reviewed financial recovery.
