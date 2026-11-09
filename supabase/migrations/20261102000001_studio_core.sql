CREATE OR REPLACE FUNCTION public.studio_has_permission(p_tenant_id uuid, p_permission text, p_actor_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_memberships m JOIN public.tenant_roles r ON r.id = m.role_id AND r.tenant_id = m.tenant_id
    WHERE m.tenant_id = p_tenant_id AND m.user_id = p_actor_id AND m.accepted_at IS NOT NULL
      AND coalesce(to_jsonb(m)->>'status', 'accepted') NOT IN ('invited', 'suspended')
      AND ((to_jsonb(m)->>'invitation_expires_at') IS NULL OR (to_jsonb(m)->>'invitation_expires_at')::timestamptz > now())
      AND (r.name = 'owner' OR (r.permissions ? 'studio.read' AND r.permissions ? p_permission))
  ) AND (p_actor_id = auth.uid() OR auth.role() = 'service_role');
$$;
REVOKE ALL ON FUNCTION public.studio_has_permission(uuid,text,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.studio_has_permission(uuid,text,uuid) TO authenticated, service_role;

CREATE FUNCTION public.studio_seed_member_permissions() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.is_system AND NEW.name = 'member' THEN
    SELECT jsonb_agg(DISTINCT value) INTO NEW.permissions FROM jsonb_array_elements_text(coalesce(NEW.permissions, '[]'::jsonb) || '["studio.read","studio.create"]'::jsonb) AS permissions(value);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER studio_member_permissions BEFORE INSERT ON public.tenant_roles FOR EACH ROW EXECUTE FUNCTION public.studio_seed_member_permissions();
UPDATE public.tenant_roles r SET permissions = (
  SELECT jsonb_agg(DISTINCT value) FROM jsonb_array_elements_text(coalesce(r.permissions,'[]') || '["studio.read","studio.create"]'::jsonb) AS permissions(value)
) WHERE r.is_system AND r.name = 'member';

CREATE TABLE public.studio_plans (
  code text PRIMARY KEY CHECK (code IN ('basic','pro','business')), name text NOT NULL,
  amount_mxn numeric(12,2) NOT NULL CHECK(amount_mxn > 0), monthly_tlacos integer NOT NULL CHECK(monthly_tlacos > 0),
  monthly_reviews integer NOT NULL CHECK(monthly_reviews >= 0), catalog_version integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true, updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.studio_plans(code,name,amount_mxn,monthly_tlacos,monthly_reviews) VALUES
 ('basic','Studio Básico',99,20,40),('pro','Studio Pro',199,60,120),('business','Studio Negocio',349,140,280);
CREATE TABLE public.studio_credit_packs (
  code text PRIMARY KEY, name text NOT NULL, amount_mxn numeric(12,2) NOT NULL CHECK(amount_mxn > 0),
  tlacos integer NOT NULL CHECK(tlacos > 0), catalog_version integer NOT NULL DEFAULT 1, is_active boolean NOT NULL DEFAULT true
);
INSERT INTO public.studio_credit_packs(code,name,amount_mxn,tlacos) VALUES
 ('mini','Recarga Mini',49,10),('frequent','Recarga Frecuente',129,30),('business','Recarga Negocio',279,75);

CREATE FUNCTION public.studio_catalog_revision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (to_jsonb(NEW)-'catalog_version'-'updated_at') IS DISTINCT FROM (to_jsonb(OLD)-'catalog_version'-'updated_at') THEN
    NEW.catalog_version:=OLD.catalog_version+1;
  ELSE NEW.catalog_version:=OLD.catalog_version; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER studio_plan_revision BEFORE UPDATE ON public.studio_plans FOR EACH ROW EXECUTE FUNCTION public.studio_catalog_revision();
CREATE TRIGGER studio_pack_revision BEFORE UPDATE ON public.studio_credit_packs FOR EACH ROW EXECUTE FUNCTION public.studio_catalog_revision();

CREATE TABLE public.tenant_studio_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL UNIQUE REFERENCES public.tenants(id),
  plan_code text NOT NULL REFERENCES public.studio_plans(code),
  status text NOT NULL DEFAULT 'pending_payment' CHECK(status IN ('pending_payment','active','past_due','cancelling','cancelled')),
  mp_preapproval_id text UNIQUE, mp_init_point text, checkout_key uuid UNIQUE,
  current_period_start timestamptz, current_period_end timestamptz, cancel_at_period_end boolean NOT NULL DEFAULT false,
  pending_plan_code text REFERENCES public.studio_plans(code),
  contracted_amount_mxn numeric(12,2) NOT NULL, contracted_tlacos integer NOT NULL,
  pending_amount_mxn numeric(12,2), pending_tlacos integer, plan_change_status text CHECK(plan_change_status IN ('pending','confirmed')),
  ai_blocked boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id,id)
);
CREATE FUNCTION public.studio_membership_active(p_tenant_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM tenant_studio_subscriptions WHERE tenant_id=p_tenant_id AND status IN ('active','cancelling') AND current_period_start<=now() AND current_period_end > now());
$$;
REVOKE ALL ON FUNCTION public.studio_membership_active(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.studio_membership_active(uuid) TO service_role;

CREATE TABLE public.studio_designs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES public.tenants(id), created_by uuid NOT NULL REFERENCES auth.users(id),
  title text NOT NULL CHECK(length(title) BETWEEN 1 AND 120), source_type text NOT NULL CHECK(source_type IN ('product','promotion','subscription_plan','custom')),
  source_id uuid, source_snapshot jsonb NOT NULL, source_hash text NOT NULL,
  draft_scene jsonb NOT NULL CHECK(jsonb_typeof(draft_scene)='object'), revision integer NOT NULL DEFAULT 1 CHECK(revision > 0),
  status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','ready','archived')), active_version_id uuid,
  copy text NOT NULL DEFAULT '', destination_url text NOT NULL DEFAULT '', idempotency_key uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id,id), UNIQUE(tenant_id,idempotency_key), CHECK((source_type='custom')=(source_id IS NULL))
);
CREATE INDEX studio_designs_library_idx ON public.studio_designs(tenant_id,status,updated_at DESC,id);
CREATE TABLE public.studio_design_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, design_id uuid NOT NULL,
  version integer NOT NULL CHECK(version > 0), scene_json jsonb NOT NULL, scene_schema_version integer NOT NULL DEFAULT 1 CHECK(scene_schema_version=1),
  scene_hash text NOT NULL, source_snapshot jsonb NOT NULL, source_hash text NOT NULL,
  is_preparation boolean NOT NULL DEFAULT false, created_by uuid NOT NULL REFERENCES auth.users(id), created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id,id), UNIQUE(tenant_id,design_id,id), UNIQUE(design_id,version),
  FOREIGN KEY(tenant_id,design_id) REFERENCES public.studio_designs(tenant_id,id)
);
ALTER TABLE public.studio_designs ADD CONSTRAINT studio_design_active_version_fk FOREIGN KEY(tenant_id,id,active_version_id) REFERENCES public.studio_design_versions(tenant_id,design_id,id) DEFERRABLE INITIALLY DEFERRED;
CREATE TABLE public.studio_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, design_id uuid NOT NULL,
  kind text NOT NULL CHECK(kind IN ('original','generated','render','preview')), status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','ready')),
  storage_path text NOT NULL UNIQUE, mime_type text NOT NULL CHECK(mime_type IN ('image/png','image/jpeg','image/webp')),
  width integer CHECK(width > 0), height integer CHECK(height > 0), byte_size integer CHECK(byte_size BETWEEN 1 AND 12582912), checksum text,
  source_asset_id uuid, provider text, metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id,id), UNIQUE(tenant_id,design_id,id),
  FOREIGN KEY(tenant_id,design_id) REFERENCES public.studio_designs(tenant_id,id),
  FOREIGN KEY(tenant_id,design_id,source_asset_id) REFERENCES public.studio_assets(tenant_id,design_id,id)
);
CREATE INDEX studio_assets_design_idx ON public.studio_assets(tenant_id,design_id);
CREATE TABLE public.studio_renders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, design_id uuid NOT NULL, design_version_id uuid NOT NULL, asset_id uuid NOT NULL,
  format text NOT NULL CHECK(format IN ('square','portrait','story','banner')), surface text NOT NULL DEFAULT 'social', renderer_version integer NOT NULL DEFAULT 1 CHECK(renderer_version>0),
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,id), UNIQUE(tenant_id,design_version_id,surface,format,renderer_version),
  FOREIGN KEY(tenant_id,design_id,design_version_id) REFERENCES public.studio_design_versions(tenant_id,design_id,id),
  FOREIGN KEY(tenant_id,design_id,asset_id) REFERENCES public.studio_assets(tenant_id,design_id,id)
);
CREATE TABLE public.tenant_studio_brand_settings (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants(id), colors text[] NOT NULL DEFAULT ARRAY['#3483fa','#172033','#ffffff'],
  font text NOT NULL DEFAULT 'Arial' CHECK(font IN ('Arial','Georgia','Verdana')),
  default_format text NOT NULL DEFAULT 'square' CHECK(default_format IN ('square','portrait','story','banner')), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.studio_activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES public.tenants(id), actor_id uuid,
  action text NOT NULL, entity_id uuid, metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX studio_activity_tenant_idx ON public.studio_activity_events(tenant_id,created_at DESC);

CREATE FUNCTION public.studio_source_fingerprint(p_tenant_id uuid,p_type text,p_source_id uuid) RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_data jsonb;
BEGIN
  IF p_type='custom' AND p_source_id IS NULL THEN RETURN md5(p_tenant_id::text || ':custom'); END IF;
  IF p_type='product' THEN
    SELECT jsonb_build_object('name',p.name,'description',p.description,'price',p.price,'image',p.image_url,'public',p.is_public,'deleted',p.deleted_at,'images',(SELECT coalesce(jsonb_agg(i.url ORDER BY i.position,i.url),'[]') FROM product_images i WHERE i.product_id=p.id),
      'variants',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',v.id,'price',v.price,'active',v.is_active,'archived',v.archived_at) ORDER BY v.id),'[]') FROM product_variants v WHERE v.product_id=p.id))
      INTO v_data FROM products p WHERE p.id=p_source_id AND p.tenant_id=p_tenant_id;
  ELSIF p_type='promotion' THEN
    SELECT (to_jsonb(p)-'created_at'-'updated_at') || jsonb_build_object('items',(
      SELECT coalesce(jsonb_agg(jsonb_build_object('id',x.id,'qty',coalesce(i.quantity,1),'name',x.name,'price',x.price,'deleted',x.deleted_at,'image',x.image_url,'public',x.is_public,'variants',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',variant.id,'price',variant.price,'active',variant.is_active,'archived',variant.archived_at) ORDER BY variant.id),'[]') FROM product_variants variant WHERE variant.product_id=x.id)) ORDER BY x.id),'[]')
      FROM products x LEFT JOIN promotion_items i ON i.product_id=x.id AND i.promotion_id=p.id WHERE x.tenant_id=p_tenant_id AND
        (i.product_id IS NOT NULL OR x.id=ANY(coalesce(p.product_ids,'{}'::uuid[])||coalesce(p.bundle_product_ids,'{}'::uuid[])) OR p.applies_to='all' OR x.subcatalog_id=ANY(coalesce(p.subcatalog_ids,'{}'::uuid[])))
    )) INTO v_data FROM promotions p WHERE p.id=p_source_id AND p.tenant_id=p_tenant_id;
  ELSIF p_type='subscription_plan' THEN
    SELECT (to_jsonb(p)-'created_at'-'updated_at'-'sort_order') || jsonb_build_object('items',(
      SELECT coalesce(jsonb_agg(jsonb_build_object('id',i.product_id,'qty',i.quantity,'variant',i.product_variant_id,'name',x.name,'price',x.price,'deleted',x.deleted_at,'variant_price',v.price) ORDER BY i.product_id,i.product_variant_id),'[]')
      FROM offer_plan_items i JOIN products x ON x.id=i.product_id LEFT JOIN product_variants v ON v.id=i.product_variant_id WHERE i.plan_id=p.id
    )) INTO v_data FROM offer_plans p WHERE p.id=p_source_id AND p.tenant_id=p_tenant_id;
  END IF;
  RETURN CASE WHEN v_data IS NULL THEN NULL ELSE md5(v_data::text) END;
END;
$$;
REVOKE ALL ON FUNCTION public.studio_source_fingerprint(uuid,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.studio_source_fingerprint(uuid,text,uuid) TO service_role;

CREATE FUNCTION public.studio_validate_design_source() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF public.studio_source_fingerprint(NEW.tenant_id,NEW.source_type,NEW.source_id) IS NULL THEN RAISE EXCEPTION 'STUDIO_SOURCE_NOT_FOUND'; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER studio_design_source_guard BEFORE INSERT OR UPDATE OF source_type,source_id,tenant_id ON public.studio_designs FOR EACH ROW EXECUTE FUNCTION public.studio_validate_design_source();

CREATE FUNCTION public.studio_save_design(p_tenant_id uuid,p_actor_id uuid,p_design_id uuid,p_revision integer,p_changes jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row studio_designs;
BEGIN
  IF NOT studio_has_permission(p_tenant_id,'studio.create',p_actor_id) THEN RAISE EXCEPTION 'STUDIO_FORBIDDEN'; END IF;
  IF NOT studio_membership_active(p_tenant_id) THEN RAISE EXCEPTION 'STUDIO_MEMBERSHIP_REQUIRED'; END IF;
  SELECT * INTO v_row FROM studio_designs WHERE id=p_design_id AND tenant_id=p_tenant_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'STUDIO_NOT_FOUND'; END IF;
  IF v_row.revision<>p_revision THEN RAISE EXCEPTION 'STUDIO_REVISION_CONFLICT'; END IF;
  UPDATE studio_designs SET title=coalesce(p_changes->>'title',title), draft_scene=coalesce(p_changes->'draft_scene',draft_scene),
    copy=coalesce(p_changes->>'copy',copy), destination_url=coalesce(p_changes->>'destination_url',destination_url),
    status=coalesce(p_changes->>'status',status), source_snapshot=coalesce(p_changes->'source_snapshot',source_snapshot),
    source_hash=coalesce(p_changes->>'source_hash',source_hash), revision=revision+1, updated_at=now()
    WHERE id=p_design_id AND tenant_id=p_tenant_id RETURNING * INTO v_row;
  RETURN to_jsonb(v_row);
END;
$$;
CREATE FUNCTION public.studio_create_version(p_tenant_id uuid,p_actor_id uuid,p_design_id uuid,p_revision integer,p_preparation boolean,p_scene jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_design studio_designs; v_version studio_design_versions; v_no integer; v_hash text;
BEGIN
  IF NOT studio_has_permission(p_tenant_id,'studio.create',p_actor_id) THEN RAISE EXCEPTION 'STUDIO_FORBIDDEN'; END IF;
  IF NOT studio_membership_active(p_tenant_id) THEN RAISE EXCEPTION 'STUDIO_MEMBERSHIP_REQUIRED'; END IF;
  SELECT * INTO v_design FROM studio_designs WHERE id=p_design_id AND tenant_id=p_tenant_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'STUDIO_NOT_FOUND'; END IF;
  IF v_design.revision<>p_revision THEN RAISE EXCEPTION 'STUDIO_REVISION_CONFLICT'; END IF;
  IF jsonb_typeof(p_scene)<>'object' THEN RAISE EXCEPTION 'STUDIO_VALIDATION'; END IF;
  v_hash:=md5(p_scene::text);
  SELECT * INTO v_version FROM studio_design_versions WHERE design_id=p_design_id AND scene_hash=v_hash AND source_hash=v_design.source_hash AND is_preparation=p_preparation ORDER BY version DESC LIMIT 1;
  IF FOUND THEN
    UPDATE studio_designs SET active_version_id=v_version.id,status=CASE WHEN status='archived' THEN status WHEN p_preparation THEN 'draft' ELSE 'ready' END WHERE id=p_design_id;
    RETURN to_jsonb(v_version);
  END IF;
  SELECT coalesce(max(version),0)+1 INTO v_no FROM studio_design_versions WHERE design_id=p_design_id;
  INSERT INTO studio_design_versions(tenant_id,design_id,version,scene_json,scene_hash,source_snapshot,source_hash,created_by,is_preparation)
    VALUES(p_tenant_id,p_design_id,v_no,p_scene,v_hash,v_design.source_snapshot,v_design.source_hash,p_actor_id,p_preparation) RETURNING * INTO v_version;
  UPDATE studio_designs SET active_version_id=v_version.id,status=CASE WHEN status='archived' THEN status WHEN p_preparation THEN 'draft' ELSE 'ready' END WHERE id=p_design_id;
  RETURN to_jsonb(v_version);
END;
$$;
REVOKE ALL ON FUNCTION public.studio_save_design(uuid,uuid,uuid,integer,jsonb),public.studio_create_version(uuid,uuid,uuid,integer,boolean,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.studio_save_design(uuid,uuid,uuid,integer,jsonb),public.studio_create_version(uuid,uuid,uuid,integer,boolean,jsonb) TO service_role;

INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES
 ('studio-assets','studio-assets',false,12582912,ARRAY['image/jpeg','image/png','image/webp']) ON CONFLICT(id) DO UPDATE SET public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
REVOKE ALL ON public.studio_design_versions FROM PUBLIC,anon,authenticated;
DO $$ DECLARE v_table text; BEGIN
  FOREACH v_table IN ARRAY ARRAY['studio_plans','studio_credit_packs','tenant_studio_subscriptions','studio_designs','studio_design_versions','studio_assets','studio_renders','tenant_studio_brand_settings','studio_activity_events'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',v_table);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',v_table);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated',v_table);
    EXECUTE format('GRANT ALL ON public.%I TO service_role',v_table);
    IF v_table IN ('studio_plans','studio_credit_packs') THEN
      EXECUTE format('CREATE POLICY studio_catalog_read ON public.%I FOR SELECT TO authenticated USING(is_active)',v_table);
    ELSE
      EXECUTE format('CREATE POLICY studio_tenant_read ON public.%I FOR SELECT TO authenticated USING(public.studio_has_permission(tenant_id,%L))',v_table,
        CASE WHEN v_table='studio_activity_events' THEN 'studio.manage' ELSE 'studio.read' END);
    END IF;
  END LOOP;
END $$;

REVOKE SELECT ON public.tenant_studio_subscriptions FROM authenticated;
GRANT SELECT(id,tenant_id,plan_code,status,current_period_start,current_period_end,cancel_at_period_end,pending_plan_code,pending_amount_mxn,contracted_amount_mxn,plan_change_status,ai_blocked) ON public.tenant_studio_subscriptions TO authenticated;
