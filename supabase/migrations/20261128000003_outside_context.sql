-- «Lo que pasa afuera» in the weekly sales report: what Gemini found with Google Search for a giro, a place and a week.
-- Shared across businesses of the same giro and place, so one search serves all of them. Server only.
-- Reverse: supabase/snippets/outside_context_rollback.sql

CREATE TABLE IF NOT EXISTS public.ai_outside_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text NOT NULL UNIQUE CHECK (char_length(cache_key) BETWEEN 3 AND 300),
  giro text NOT NULL,
  place text NOT NULL,
  week_start date NOT NULL,
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_outside_context_week_idx ON public.ai_outside_context (week_start);
ALTER TABLE public.ai_outside_context ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_outside_context FROM anon, authenticated;
