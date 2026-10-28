-- =============================================================================
-- GROWTH ENGINE: cold email from the owner's Gmail mailboxes. Additive only:
--   * new tables: growth_mailboxes, growth_enrollments, growth_messages
-- Passwords never live here: a mailbox only names the env var that holds it.
-- Reverted by supabase/snippets/growth_rollback.sql.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.growth_mailboxes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text NOT NULL CHECK (address ~* '^[^@\s]+@[^@\s]+\.[a-z]{2,}$'),
  display_name text NOT NULL CHECK (char_length(btrim(display_name)) BETWEEN 2 AND 60),
  secret_env_key text NOT NULL CHECK (secret_env_key ~ '^GROWTH_MAILBOX_[A-Z0-9_]+$'),
  daily_cap integer NOT NULL DEFAULT 30 CHECK (daily_cap BETWEEN 1 AND 100),
  warmup_started_on date NOT NULL DEFAULT ((now() AT TIME ZONE 'America/Mexico_City')::date),
  is_active boolean NOT NULL DEFAULT false,
  paused_reason text,
  imap_last_uid bigint NOT NULL DEFAULT 0,
  imap_uid_validity bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS growth_mailboxes_address_key ON public.growth_mailboxes (lower(address));

CREATE TABLE IF NOT EXISTS public.growth_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL UNIQUE REFERENCES public.growth_leads(id) ON DELETE CASCADE,
  mailbox_id uuid REFERENCES public.growth_mailboxes(id) ON DELETE SET NULL,
  variant text NOT NULL DEFAULT 'A' CHECK (variant IN ('A', 'B', 'C')),
  current_step integer NOT NULL DEFAULT 0 CHECK (current_step BETWEEN 0 AND 3),
  next_send_at timestamptz NOT NULL DEFAULT now(),
  claimed_until timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'stopped')),
  stop_reason text,
  thread_message_id text,
  last_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS growth_enrollments_due_idx ON public.growth_enrollments (next_send_at) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS public.growth_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.growth_leads(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES public.growth_enrollments(id) ON DELETE SET NULL,
  mailbox_id uuid REFERENCES public.growth_mailboxes(id) ON DELETE SET NULL,
  channel text NOT NULL DEFAULT 'email' CHECK (channel IN ('email')),
  direction text NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  status text NOT NULL CHECK (status IN ('sent', 'failed', 'received')),
  step text,
  template_id uuid REFERENCES public.growth_templates(id) ON DELETE SET NULL,
  from_address text,
  to_address text,
  subject text,
  body text,
  provider_message_id text,
  in_reply_to text,
  classification text CHECK (classification IS NULL OR classification IN ('bounce', 'auto_reply', 'rejection', 'reply', 'unmatched')),
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS growth_messages_provider_key ON public.growth_messages (channel, provider_message_id) WHERE provider_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS growth_messages_mailbox_idx ON public.growth_messages (mailbox_id, direction, created_at DESC);
CREATE INDEX IF NOT EXISTS growth_messages_lead_idx ON public.growth_messages (lead_id, created_at DESC);

ALTER TABLE public.growth_mailboxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_messages ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  v_table text;
BEGIN
  FOREACH v_table IN ARRAY ARRAY['growth_mailboxes', 'growth_enrollments', 'growth_messages']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "growth: service role" ON public.%I', v_table);
    EXECUTE format('CREATE POLICY "growth: service role" ON public.%I FOR ALL USING (auth.role() = ''service_role'') WITH CHECK (auth.role() = ''service_role'')', v_table);
  END LOOP;
END $$;

-- ── Enroll email-only leads, best giros first, variant by weight ─────────────
CREATE OR REPLACE FUNCTION public.growth_enroll_email_leads(p_limit integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_weights jsonb;
  v_a numeric;
  v_b numeric;
  v_total numeric;
  v_count integer;
BEGIN
  SELECT email_variant_weights INTO v_weights FROM public.growth_settings WHERE id;
  v_a := greatest(coalesce((v_weights->>'A')::numeric, 0), 0);
  v_b := greatest(coalesce((v_weights->>'B')::numeric, 0), 0);
  v_total := greatest(v_a + v_b + greatest(coalesce((v_weights->>'C')::numeric, 0), 0), 1);

  WITH picked AS (
    SELECT g.id, random() * v_total AS roll
    FROM public.growth_leads g
    WHERE g.next_channel = 'correo'
      AND g.email IS NOT NULL
      AND g.email_status = 'desconocido'
      AND g.stage NOT IN ('registrado', 'descartado', 'conversando')
      AND (g.snoozed_until IS NULL OR g.snoozed_until < now())
      AND NOT EXISTS (SELECT 1 FROM public.growth_enrollments e WHERE e.lead_id = g.id)
      AND NOT public.growth_is_suppressed(NULL, g.email)
    ORDER BY CASE g.giro WHEN 'materiales' THEN 0 WHEN 'veterinaria' THEN 1 WHEN 'cafeteria' THEN 2 ELSE 3 END, g.created_at, g.id
    LIMIT greatest(0, least(p_limit, 200))
  ),
  inserted AS (
    INSERT INTO public.growth_enrollments (lead_id, variant)
    SELECT picked.id, CASE WHEN picked.roll < v_a THEN 'A' WHEN picked.roll < v_a + v_b THEN 'B' ELSE 'C' END
    FROM picked
    ON CONFLICT (lead_id) DO NOTHING
    RETURNING 1
  )
  SELECT count(*)::integer INTO v_count FROM inserted;
  RETURN v_count;
END;
$$;

-- ── Claim due enrollments once, even with overlapping ticks ──────────────────
CREATE OR REPLACE FUNCTION public.growth_claim_due_enrollments(p_limit integer)
RETURNS TABLE (
  enrollment_id uuid,
  lead_id uuid,
  mailbox_id uuid,
  variant text,
  current_step integer,
  thread_message_id text,
  business_name text,
  giro text,
  municipio text,
  colonia text,
  address text,
  email text,
  stage text,
  email_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH due AS (
    SELECT e.id
    FROM public.growth_enrollments e
    WHERE e.status = 'active'
      AND e.next_send_at <= now()
      AND (e.claimed_until IS NULL OR e.claimed_until < now())
    ORDER BY e.next_send_at
    LIMIT greatest(0, least(p_limit, 100))
    FOR UPDATE SKIP LOCKED
  ),
  claimed AS (
    UPDATE public.growth_enrollments e
    SET claimed_until = now() + interval '10 minutes'
    FROM due
    WHERE e.id = due.id
    RETURNING e.id, e.lead_id, e.mailbox_id, e.variant, e.current_step, e.thread_message_id
  )
  SELECT c.id, c.lead_id, c.mailbox_id, c.variant, c.current_step, c.thread_message_id,
         g.business_name, g.giro, g.municipio, g.colonia, g.address, g.email, g.stage, g.email_status
  FROM claimed c
  JOIN public.growth_leads g ON g.id = c.lead_id;
END;
$$;

REVOKE ALL ON FUNCTION public.growth_enroll_email_leads(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.growth_claim_due_enrollments(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.growth_enroll_email_leads(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.growth_claim_due_enrollments(integer) TO service_role;
