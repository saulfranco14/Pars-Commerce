-- Reverts every growth migration (20261029000001 onwards). Only growth objects are
-- touched; set GROWTH_ENABLED=false and deploy the code without growth before running it.
BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'cron') THEN
    PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'growth-tick';
  END IF;
END $$;

-- 20261031000005_growth_map_imports
DROP FUNCTION IF EXISTS public.growth_map_points(uuid, uuid, double precision, double precision, double precision, double precision, text, text, integer);
DROP FUNCTION IF EXISTS public.growth_claim_import(uuid, integer);
DROP TABLE IF EXISTS public.growth_imports;

-- 20261031000004_growth_my_day
DROP FUNCTION IF EXISTS public.growth_my_day(uuid, uuid);

-- 20261031000003_growth_assisted_registration
DROP FUNCTION IF EXISTS public.growth_mark_registered(uuid, uuid, uuid);

-- 20261031000002_growth_next_action
DROP FUNCTION IF EXISTS public.growth_lead_next_action(uuid);

-- 20261031000001_growth_workspaces
DROP FUNCTION IF EXISTS public.growth_add_lead(uuid, uuid, jsonb);
DROP FUNCTION IF EXISTS public.growth_assign_leads(uuid, uuid, uuid[], uuid);
DROP FUNCTION IF EXISTS public.growth_contact_owner(uuid, text, text);
DROP FUNCTION IF EXISTS public.growth_update_lead_email(uuid, text, uuid);
DROP FUNCTION IF EXISTS public.growth_update_lead_phone(uuid, text, uuid);
DROP FUNCTION IF EXISTS public.growth_follow_up(uuid, text, timestamptz, text, uuid);
DROP FUNCTION IF EXISTS public.growth_pipeline_counts(text, text, uuid, uuid);
DROP FUNCTION IF EXISTS public.growth_nearby_leads(double precision, double precision, integer, uuid, uuid);
DROP FUNCTION IF EXISTS public.growth_sweep_remaining(text, text, text, uuid, uuid);
DROP FUNCTION IF EXISTS public.growth_reserve_batch(text, text, text, integer, integer, uuid, uuid);
DROP FUNCTION IF EXISTS public.growth_record_outcome(uuid, text, text, jsonb, date, uuid, uuid);
DROP FUNCTION IF EXISTS public.growth_upsert_leads(jsonb, uuid);
DROP FUNCTION IF EXISTS public.growth_save_template_version(text, text, text, text, text, text, uuid, uuid);
DROP FUNCTION IF EXISTS public.growth_enroll_email_leads(integer, uuid);
DROP FUNCTION IF EXISTS public.growth_funnel(timestamptz, timestamptz, uuid);
DROP FUNCTION IF EXISTS public.growth_lock_for_actor(uuid, uuid);
DROP FUNCTION IF EXISTS public.growth_can_act_on(uuid, uuid);
DROP FUNCTION IF EXISTS public.growth_can_act(public.growth_leads, uuid);
DROP FUNCTION IF EXISTS public.growth_in_zones(text, text, jsonb);
DROP FUNCTION IF EXISTS public.growth_member_role(uuid, uuid);
DROP FUNCTION IF EXISTS public.growth_is_suppressed(text, text, uuid);

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
DROP FUNCTION IF EXISTS public.growth_track_link(text, text, integer, jsonb);
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
DROP TABLE IF EXISTS public.growth_members;
DROP TABLE IF EXISTS public.growth_workspaces;

COMMIT;
