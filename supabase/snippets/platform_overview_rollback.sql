-- Reverts 20261031000007_platform_overview.sql. Store visit counts are lost.
BEGIN;

DROP FUNCTION IF EXISTS public.platform_overview(timestamptz, timestamptz);
DROP FUNCTION IF EXISTS public.track_storefront_view(uuid, text);
DROP TABLE IF EXISTS public.storefront_daily_views;

COMMIT;
