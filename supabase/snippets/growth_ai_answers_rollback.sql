-- Reverts supabase/migrations/20261101000003_growth_ai_answers.sql.
BEGIN;

DROP FUNCTION IF EXISTS public.growth_ai_answer_hit(text, text);
DROP TABLE IF EXISTS public.growth_ai_answers;

COMMIT;
