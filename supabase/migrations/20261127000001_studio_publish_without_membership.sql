-- Studio publishing without membership: placing an ad on the store, product
-- detail or table QR only needs the studio.publish permission and an eligible,
-- publishable version. Memberships no longer gate anything in Studio.
-- Rollback: supabase/snippets/studio_publish_without_membership_rollback.sql

CREATE OR REPLACE FUNCTION public.studio_apply_placement(p_tenant_id uuid,p_actor_id uuid,p_version_id uuid,p_render_id uuid,p_surface text,p_title text,p_alt text,p_url text,p_start timestamptz,p_end timestamptz,p_key uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_version studio_design_versions; v_design studio_designs; v_channel text; v_target text; v_row studio_placements;
BEGIN
  IF NOT studio_has_permission(p_tenant_id,'studio.publish',p_actor_id) THEN RAISE EXCEPTION 'STUDIO_FORBIDDEN'; END IF;
  SELECT * INTO v_version FROM studio_design_versions WHERE tenant_id=p_tenant_id AND id=p_version_id;
  IF NOT FOUND OR v_version.is_preparation THEN RAISE EXCEPTION 'STUDIO_VERSION_NOT_PUBLISHABLE'; END IF;
  SELECT * INTO v_design FROM studio_designs WHERE tenant_id=p_tenant_id AND id=v_version.design_id;
  IF v_design.status='archived' THEN RAISE EXCEPTION 'STUDIO_VERSION_NOT_PUBLISHABLE'; END IF;
  IF NOT EXISTS(SELECT 1 FROM studio_renders r JOIN studio_assets a ON a.id=r.asset_id AND a.tenant_id=r.tenant_id WHERE r.id=p_render_id AND r.tenant_id=p_tenant_id AND r.design_version_id=p_version_id AND r.surface=p_surface AND a.status='ready') THEN RAISE EXCEPTION 'STUDIO_RENDER_MISMATCH'; END IF;
  IF p_surface NOT IN ('store_home_campaign','promotion_card','promotion_detail','product_campaign','plan_card','plan_detail','qr_promotion','qr_menu_campaign') THEN RAISE EXCEPTION 'STUDIO_INVALID_SURFACE'; END IF;
  IF (p_surface IN ('promotion_card','promotion_detail','qr_promotion') AND v_design.source_type<>'promotion') OR (p_surface IN ('plan_card','plan_detail') AND v_design.source_type<>'subscription_plan') OR (p_surface='product_campaign' AND v_design.source_type<>'product') THEN RAISE EXCEPTION 'STUDIO_INVALID_SURFACE'; END IF;
  v_channel:=CASE WHEN p_surface IN ('qr_promotion','qr_menu_campaign') THEN 'table_qr' ELSE 'public_store' END;
  IF NOT studio_source_eligible(p_tenant_id,v_design.source_type,v_design.source_id,v_channel,v_version.source_hash) THEN RAISE EXCEPTION 'STUDIO_SOURCE_NOT_ELIGIBLE'; END IF;
  IF v_design.source_type='custom' AND p_end IS NULL THEN RAISE EXCEPTION 'STUDIO_CAMPAIGN_END_REQUIRED'; END IF;
  v_target:=CASE WHEN p_surface IN ('store_home_campaign','qr_menu_campaign') THEN 'campaign' ELSE v_design.source_type||':'||v_design.source_id::text END;
  PERFORM pg_advisory_xact_lock(hashtextextended('placement:'||p_tenant_id::text||':'||p_surface||':'||v_target,0));
  SELECT * INTO v_row FROM studio_placements WHERE tenant_id=p_tenant_id AND surface=p_surface AND idempotency_key=p_key;
  IF FOUND THEN RETURN to_jsonb(v_row); END IF;
  UPDATE studio_placements SET is_active=false,disabled_reason='replaced' WHERE tenant_id=p_tenant_id AND surface=p_surface AND target_key=v_target AND is_active;
  INSERT INTO studio_placements(tenant_id,design_id,design_version_id,render_id,channel,surface,idempotency_key,target_key,source_type,source_id,source_hash,title,alt_text,destination_url,starts_at,ends_at,applied_by)
    VALUES(p_tenant_id,v_design.id,p_version_id,p_render_id,v_channel,p_surface,p_key,v_target,v_design.source_type,v_design.source_id,v_version.source_hash,p_title,p_alt,p_url,p_start,p_end,p_actor_id) RETURNING * INTO v_row;
  INSERT INTO studio_activity_events(tenant_id,actor_id,action,entity_id) VALUES(p_tenant_id,p_actor_id,'placement.applied',v_row.id);
  RETURN to_jsonb(v_row);
END;
$$;
