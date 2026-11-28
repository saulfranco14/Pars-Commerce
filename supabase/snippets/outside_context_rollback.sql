-- Reverts 20261128000003_outside_context.sql. Deploy the code without the weekly report's «afuera» first.
BEGIN;
DROP TABLE IF EXISTS public.ai_outside_context;
COMMIT;
