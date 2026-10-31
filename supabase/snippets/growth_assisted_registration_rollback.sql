-- Reverts 20261031000003_growth_assisted_registration.sql. Registrations it recorded stay as data.
BEGIN;

DROP FUNCTION IF EXISTS public.growth_mark_registered(uuid, uuid, uuid);

COMMIT;
