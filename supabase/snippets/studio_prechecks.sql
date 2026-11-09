-- Read-only prerequisite checks; run before applying the Studio migrations.
SELECT name,installed_version,default_version FROM pg_available_extensions WHERE name IN ('pg_cron','pg_net','pgmq');
SELECT version FROM supabase_migrations.schema_migrations WHERE version LIKE '20261102%' ORDER BY version;
-- Existing businesses affected by the only legacy-row update in migration 1.
SELECT count(*) AS existing_system_member_roles,
       count(*) FILTER (WHERE NOT (permissions ? 'studio.read') OR NOT (permissions ? 'studio.create')) AS roles_receiving_studio_permissions
FROM public.tenant_roles WHERE is_system AND name = 'member';
-- A pre-existing bucket with this name would be configured as private by migration 1.
SELECT id, public, file_size_limit FROM storage.buckets WHERE id = 'studio-assets';
SELECT table_name,column_name FROM information_schema.columns WHERE table_schema='public' AND
  ((table_name='tenant_memberships' AND column_name IN ('accepted_at','status','invitation_expires_at')) OR
   (table_name='product_variants' AND column_name IN ('product_id','price','archived_at')) OR
   (table_name='promotions' AND column_name IN ('sales_channels','product_ids','bundle_product_ids','subcatalog_ids')));
DO $$ BEGIN
  IF to_regclass('public.offer_plans') IS NULL OR to_regclass('public.offer_plan_items') IS NULL OR to_regclass('public.promotion_items') IS NULL OR to_regclass('public.product_variants') IS NULL THEN
    RAISE EXCEPTION 'Apply the existing commerce migrations before Studio';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_available_extensions WHERE name='pgmq') THEN RAISE EXCEPTION 'Supabase Queues/pgmq is not available in this environment'; END IF;
  IF to_regclass('vault.decrypted_secrets') IS NULL THEN RAISE EXCEPTION 'Configure the existing Supabase Vault extension first'; END IF;
END $$;
