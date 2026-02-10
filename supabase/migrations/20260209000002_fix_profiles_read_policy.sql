DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Authenticated can read all profiles" ON public.profiles FOR
SELECT TO authenticated USING (true);