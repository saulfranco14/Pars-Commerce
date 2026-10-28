-- =============================================================================
-- GROWTH ENGINE: the 10-minute tick. This only defines the function; nothing is
-- scheduled here. supabase/snippets/growth_cron_schedule.sql stores the URL and
-- secret in Vault and schedules the job when the owner decides to start.
-- Reverted by supabase/snippets/growth_rollback.sql.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.growth_cron_tick()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url text;
  v_secret text;
BEGIN
  SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'growth_cron_url';
  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'growth_cron_secret';
  IF v_url IS NULL OR v_secret IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN net.http_post(
    url := v_url,
    body := '{}'::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', v_secret),
    timeout_milliseconds := 55000
  );
END;
$$;

REVOKE ALL ON FUNCTION public.growth_cron_tick() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.growth_cron_tick() TO service_role;
