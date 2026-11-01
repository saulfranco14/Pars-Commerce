-- =============================================================================
-- GROWTH: Tlaco IA answer cache. A question asked once is answered from here for
-- everyone, so the AI is not paid twice for the same doubt. `question_key` is the
-- normalized question (questionKey in TypeScript); `knowledge_version` is a hash of
-- what Tlaco IA knew, so a price or fee change makes old answers stale on its own.
-- Only the service role touches it (RLS on, no policies).
-- Reverted by supabase/snippets/growth_ai_answers_rollback.sql.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.growth_ai_answers (
  question_key text NOT NULL,
  knowledge_version text NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  source text,
  hits integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_asked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (question_key, knowledge_version)
);

ALTER TABLE public.growth_ai_answers ENABLE ROW LEVEL SECURITY;

-- Counts a repeated question without a read-modify-write race.
CREATE OR REPLACE FUNCTION public.growth_ai_answer_hit(p_question_key text, p_knowledge_version text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.growth_ai_answers
  SET hits = hits + 1, last_asked_at = now()
  WHERE question_key = p_question_key AND knowledge_version = p_knowledge_version;
$$;

REVOKE ALL ON FUNCTION public.growth_ai_answer_hit(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.growth_ai_answer_hit(text, text) TO service_role;
