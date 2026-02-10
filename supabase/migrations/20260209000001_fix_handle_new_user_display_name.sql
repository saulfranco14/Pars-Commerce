CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role, role_type, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    'user',
    1,
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

UPDATE public.profiles
SET
    display_name = COALESCE(
        NULLIF(display_name, ''),
        (
            SELECT COALESCE(
                    au.raw_user_meta_data ->> 'display_name', split_part (au.email, '@', 1)
                )
            FROM auth.users au
            WHERE
                au.id = profiles.id
        )
    )
WHERE
    display_name IS NULL
    OR display_name = '';