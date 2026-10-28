-- Reverts the growth migrations (20261029000001 to 20261030000002). Only growth
-- objects are touched; set GROWTH_ENABLED=false and deploy the code without growth
-- before running it.
BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'cron') THEN
    PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'growth-tick';
  END IF;
END $$;

DROP FUNCTION IF EXISTS public.growth_update_lead_phone(uuid, text);
DROP FUNCTION IF EXISTS public.growth_sweep_remaining(text, text, text);
DROP FUNCTION IF EXISTS public.growth_follow_up(uuid, text, timestamptz, text);
DROP FUNCTION IF EXISTS public.growth_pipeline_counts(text, text);
DROP FUNCTION IF EXISTS public.growth_leads_next_step() CASCADE;
DROP FUNCTION IF EXISTS public.growth_cron_tick();
DROP FUNCTION IF EXISTS public.growth_claim_due_messages(integer);
DROP FUNCTION IF EXISTS public.growth_mailbox_usage_today(uuid);
DROP FUNCTION IF EXISTS public.growth_enroll_email_leads(integer);
DROP FUNCTION IF EXISTS public.growth_funnel(timestamptz, timestamptz);
DROP FUNCTION IF EXISTS public.growth_save_template_version(text, text, text, text, text, text, uuid);
DROP FUNCTION IF EXISTS public.growth_link_registration(uuid, text, text, text, text, jsonb);
DROP FUNCTION IF EXISTS public.growth_track_link(text, text, integer);
DROP FUNCTION IF EXISTS public.growth_nearby_leads(double precision, double precision, integer);
DROP FUNCTION IF EXISTS public.growth_reserve_batch(text, text, text, integer, integer);
DROP FUNCTION IF EXISTS public.growth_record_outcome(uuid, text, text, jsonb, date, uuid);
DROP FUNCTION IF EXISTS public.growth_upsert_leads(jsonb);
DROP FUNCTION IF EXISTS public.growth_next_channel(public.growth_leads);
DROP FUNCTION IF EXISTS public.growth_is_suppressed(text, text);

DROP TABLE IF EXISTS public.growth_messages;
DROP TABLE IF EXISTS public.growth_enrollments;
DROP TABLE IF EXISTS public.growth_mailboxes;
DROP TABLE IF EXISTS public.growth_operator_chats;
DROP TABLE IF EXISTS public.growth_templates;
DROP TABLE IF EXISTS public.tenant_acquisitions;
DROP TABLE IF EXISTS public.growth_suppressions;
DROP TABLE IF EXISTS public.growth_lead_links;
DROP TABLE IF EXISTS public.growth_lead_events;
DROP TABLE IF EXISTS public.growth_leads;
DROP TABLE IF EXISTS public.growth_settings;

COMMIT;
