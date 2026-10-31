-- Reverts 20261031000008_platform_users_overview.sql.
BEGIN;

DROP FUNCTION IF EXISTS public.platform_users_overview(jsonb, text, boolean, integer, integer);

COMMIT;
