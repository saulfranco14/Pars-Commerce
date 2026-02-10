INSERT INTO public.profiles (id, email, display_name)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'display_name', split_part(au.email, '@', 1))
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = au.id
)
AND EXISTS (
  SELECT 1 FROM public.sales_commissions sc WHERE sc.user_id = au.id
  UNION
  SELECT 1 FROM public.orders o WHERE o.assigned_to = au.id
)
ON CONFLICT (id) DO NOTHING;
