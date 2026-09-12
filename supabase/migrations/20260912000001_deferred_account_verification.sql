-- The Auth confirmation flag controls whether Supabase will issue a password
-- session. Tlaco keeps its business-review state separately so an email
-- provider outage never blocks a new account from entering the product.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_verification_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS email_verification_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_verification_reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_email_verification_status_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_email_verification_status_check
  CHECK (email_verification_status IN ('pending', 'active'));

-- Preserve the review requirement for accounts that were previously created
-- but never confirmed in Supabase Auth. Existing confirmed accounts stay active.
UPDATE public.profiles AS profile
SET email_verification_status = 'pending'
FROM auth.users AS auth_user
WHERE auth_user.id = profile.id
  AND auth_user.email_confirmed_at IS NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    display_name,
    role_type,
    email_verification_status,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    1,
    'pending',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(NULLIF(profiles.display_name, ''), EXCLUDED.display_name),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The public profile RLS policy intentionally allows people to edit their own
-- name, avatar and phone. These three review fields must remain platform-only.
CREATE OR REPLACE FUNCTION public.protect_profile_verification_fields()
RETURNS trigger AS $$
BEGIN
  IF (
    NEW.email_verification_status IS DISTINCT FROM OLD.email_verification_status
    OR NEW.email_verification_reviewed_at IS DISTINCT FROM OLD.email_verification_reviewed_at
    OR NEW.email_verification_reviewed_by IS DISTINCT FROM OLD.email_verification_reviewed_by
  )
  AND auth.role() <> 'service_role'
  AND current_user <> 'postgres' THEN
    RAISE EXCEPTION 'Only the platform may update account verification';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protect_profile_verification_fields ON public.profiles;
CREATE TRIGGER protect_profile_verification_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_verification_fields();
