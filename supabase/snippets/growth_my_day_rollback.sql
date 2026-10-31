-- Reverts 20261031000004_growth_my_day.sql.
BEGIN;

DROP FUNCTION IF EXISTS public.growth_my_day(uuid, uuid);

COMMIT;
