-- Reverts 20261123000001_studio_free_creation.sql: saving and versioning
-- require a membership again. Starter Tlacos already granted are kept; only
-- the function that grants new ones is removed.

CREATE OR REPLACE FUNCTION public.studio_save_design(p_tenant_id uuid,p_actor_id uuid,p_design_id uuid,p_revision integer,p_changes jsonb)
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

CREATE OR REPLACE FUNCTION public.studio_create_version(p_tenant_id uuid,p_actor_id uuid,p_design_id uuid,p_revision integer,p_preparation boolean,p_scene jsonb)
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

DROP FUNCTION IF EXISTS public.studio_grant_starter_credits(uuid);
