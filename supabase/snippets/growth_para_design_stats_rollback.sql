-- Reverts supabase/migrations/20261101000002_growth_para_design_stats.sql.
BEGIN;

DROP FUNCTION IF EXISTS public.growth_para_design_stats(uuid, timestamptz);

COMMIT;
