-- Configure these four secrets in Vault before scheduling; never commit values.
-- studio_worker_url: https://<project>.supabase.co/functions/v1/studio-worker
-- studio_worker_secret: same value as STUDIO_WORKER_SECRET in Edge Functions
-- studio_reconcile_url: https://tlaco.app/api/studio/reconcile
-- studio_reconcile_secret: same value as STUDIO_CRON_SECRET in Next
SELECT cron.schedule('studio-worker','* * * * *',$$SELECT public.studio_cron_tick()$$)
WHERE NOT EXISTS(SELECT 1 FROM cron.job WHERE jobname='studio-worker');
SELECT cron.schedule('studio-reconcile','*/5 * * * *',$$SELECT public.studio_reconcile_tick()$$)
WHERE NOT EXISTS(SELECT 1 FROM cron.job WHERE jobname='studio-reconcile');
