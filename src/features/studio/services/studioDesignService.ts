import "server-only";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/requirePermission";
import { createStudioScene, bindStudioScene } from "../helpers/scene";
import { isStudioDesign } from "../helpers/layout";
import { STUDIO_BUCKET, STUDIO_DEFAULT_TEMPLATE } from "../constants/studio";
import {
  createDesignSchema,
  saveDesignSchema,
  uuidSchema,
  studioSceneSchema,
  destinationSchema,
} from "../validations/studioSchemas";
import { requireStudioAccess } from "./studioAccessService";
import { importStudioSourceImage } from "./studioAssetService";
import { getStudioSource } from "./studioSourceService";
import { requireStudioData, StudioError } from "./studioErrors";
import type { Json } from "@/types/database.types";
import type {
  StudioDesign,
  StudioDesignDetail,
  StudioSourceType,
  StudioVersion,
} from "../interfaces/studio";
import type { StudioScene } from "../interfaces/scene";
import type { StudioDb } from "./studioDb";

export async function requireStudioSourcePermission(
  userId: string,
  tenantId: string,
  type: StudioSourceType,
) {
  if (type === "custom") return;
  if (
    !(await requirePermission(
      userId,
      tenantId,
      type === "product" ? "products.read" : "promotions.read",
    ))
  )
    throw new StudioError("FORBIDDEN");
}

export async function validateStudioSceneAssets(
  db: StudioDb,
  tenantId: string,
  designId: string,
  scene: StudioScene,
  sourceImages: string[],
) {
  const ids = scene.nodes.flatMap((n) => (n.assetId ? [n.assetId] : []));
  if (ids.length) {
    const rows = requireStudioData(
      await db
        .from("studio_assets")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("design_id", designId)
        .eq("status", "ready")
        .in("id", ids),
    );
    if (new Set(ids).size !== rows.length)
      throw new StudioError(
        "VALIDATION",
        "Alguna imagen no pertenece a este diseño.",
      );
  }
  for (const node of scene.nodes)
    if (node.imageUrl && !sourceImages.includes(node.imageUrl))
      throw new StudioError(
        "VALIDATION",
        "Selecciona una imagen del catálogo o sube tu archivo.",
      );
}

export async function createStudioDesign(raw: unknown): Promise<StudioDesign> {
  const input = createDesignSchema.parse(raw);
  const { db, user } = await requireStudioAccess(
    input.tenant_id,
    "studio.create",
    "create",
  );
  if (
    !requireStudioData(
      await db.rpc("studio_rate_limit", {
        p_scope: `design:${input.tenant_id}:${user.id}`,
        p_limit: 20,
      }),
    )
  )
    throw new StudioError("RATE_LIMIT");
  await requireStudioSourcePermission(
    user.id,
    input.tenant_id,
    input.source_type,
  );
  const existing = await db
    .from("studio_designs")
    .select("*")
    .eq("tenant_id", input.tenant_id)
    .eq("idempotency_key", input.idempotency_key)
    .maybeSingle();
  if (existing.data) return existing.data as unknown as StudioDesign;
  const source = await getStudioSource(
    db,
    input.tenant_id,
    input.source_type,
    input.source_type === "custom" ? null : (input.source_id ?? null),
    input.title,
  );
  const { data: brand } = await db
    .from("tenant_studio_brand_settings")
    .select("colors,font,default_format")
    .eq("tenant_id", input.tenant_id)
    .maybeSingle();
  let scene = createStudioScene(
    source,
    STUDIO_DEFAULT_TEMPLATE,
    brand?.default_format as StudioScene["format"] | undefined,
  );
  // The six designs carry their own typeface and photo colors.
  if (brand && !isStudioDesign(scene.template))
    scene = {
      ...scene,
      nodes: scene.nodes.map((node) => ({
        ...node,
        fontFamily: brand.font as StudioScene["nodes"][number]["fontFamily"],
        ...(node.kind === "price"
          ? { color: brand.colors[0] ?? node.color }
          : {}),
      })),
    };
  const created = await db
    .from("studio_designs")
    .upsert(
      {
        tenant_id: input.tenant_id,
        created_by: user.id,
        title: input.title,
        source_type: source.type,
        source_id: source.id,
        source_snapshot: source as unknown as NonNullable<Json>,
        source_hash: source.commercialHash,
        draft_scene: scene as unknown as NonNullable<Json>,
        destination_url: source.destinationUrl,
        idempotency_key: input.idempotency_key,
      },
      { onConflict: "tenant_id,idempotency_key", ignoreDuplicates: true },
    )
    .select("*")
    .maybeSingle();
  if (created.error) throw new StudioError("INTERNAL");
  const row =
    created.data ??
    requireStudioData(
      await db
        .from("studio_designs")
        .select("*")
        .eq("tenant_id", input.tenant_id)
        .eq("idempotency_key", input.idempotency_key)
        .single(),
    );
  return row as unknown as StudioDesign;
}

export async function listStudioDesigns(
  tenantId: string,
  search: string,
  status: string | null,
  cursor: string | null,
) {
  const { db } = await requireStudioAccess(tenantId);
  let q = db
    .from("studio_designs")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("id", { ascending: false })
    .limit(21);
  if (search)
    q = q.ilike("title", `%${search.replace(/[%_,()]/g, "").slice(0, 80)}%`);
  if (status && ["draft", "ready", "archived"].includes(status))
    q = q.eq("status", status);
  else q = q.neq("status", "archived");
  if (cursor) q = q.lt("id", uuidSchema.parse(cursor));
  const rows = requireStudioData(await q);
  return {
    items: rows.slice(0, 20),
    nextCursor: rows.length > 20 ? rows[19].id : null,
  };
}

export async function getStudioDesign(
  tenantId: string,
  id: string,
): Promise<StudioDesignDetail> {
  const { db } = await requireStudioAccess(tenantId);
  const design = requireStudioData(
    await db
      .from("studio_designs")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .single(),
  ) as unknown as StudioDesign;
  const [versions, assets, source] = await Promise.all([
    db
      .from("studio_design_versions")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("design_id", id)
      .order("version", { ascending: false })
      .limit(30),
    db
      .from("studio_assets")
      .select(
        "id,design_id,kind,status,width,height,mime_type,source_asset_id,created_at",
      )
      .eq("tenant_id", tenantId)
      .eq("design_id", id)
      .eq("status", "ready")
      .order("created_at", { ascending: false })
      .limit(100),
    getStudioSource(
      db,
      tenantId,
      design.source_type,
      design.source_id,
      design.title,
    ).catch((error) => {
      if (error instanceof StudioError && error.code === "NOT_FOUND")
        return null;
      throw error;
    }),
  ]);
  return {
    design,
    source,
    stale: !source || source.commercialHash !== design.source_hash,
    versions: requireStudioData(versions) as unknown as StudioVersion[],
    assets: requireStudioData(assets).map((a) => ({
      ...a,
      url: `/api/studio/assets/${a.id}/file?tenant_id=${tenantId}`,
    })) as StudioDesignDetail["assets"],
  };
}

export async function saveStudioDesign(id: string, raw: unknown) {
  const input = saveDesignSchema.parse(raw);
  const { db, user } = await requireStudioAccess(
    input.tenant_id,
    "studio.create",
    "create",
  );
  const design = requireStudioData(
    await db
      .from("studio_designs")
      .select("*")
      .eq("tenant_id", input.tenant_id)
      .eq("id", id)
      .single(),
  ) as unknown as StudioDesign;
  let source = design.source_snapshot;
  if (input.refresh_source) {
    await requireStudioSourcePermission(
      user.id,
      input.tenant_id,
      design.source_type,
    );
    source = await getStudioSource(
      db,
      input.tenant_id,
      design.source_type,
      design.source_id,
      input.title,
    );
  }
  const scene = bindStudioScene(input.scene, source);
  await validateStudioSceneAssets(db, input.tenant_id, id, scene, [
    ...source.imageUrls,
    ...(source.logoUrl ? [source.logoUrl] : []),
  ]);
  return requireStudioData(
    await db.rpc("studio_save_design", {
      p_tenant_id: input.tenant_id,
      p_actor_id: user.id,
      p_design_id: id,
      p_revision: input.revision,
      p_changes: {
        title: input.title,
        draft_scene: scene as unknown as Json,
        copy: input.copy,
        destination_url: input.destination_url,
        ...(input.status ? { status: input.status } : {}),
        ...(input.refresh_source
          ? {
              source_snapshot: source as unknown as Json,
              source_hash: source.commercialHash,
            }
          : {}),
      },
    }),
  );
}

export async function createStudioVersion(
  tenantId: string,
  id: string,
  revision: number,
) {
  const { db, user } = await requireStudioAccess(
    tenantId,
    "studio.create",
    "create",
  );
  const design = requireStudioData(
    await db
      .from("studio_designs")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .single(),
  ) as unknown as StudioDesign;
  const source = await getStudioSource(
    db,
    tenantId,
    design.source_type,
    design.source_id,
    design.title,
  );
  if (source.commercialHash !== design.source_hash)
    throw new StudioError("STALE_SOURCE");
  const now = new Date();
  const preparation =
    source.status !== "active" ||
    (source.validFrom !== null && new Date(source.validFrom) > now) ||
    (source.validUntil !== null && new Date(source.validUntil) <= now);
  const scene = structuredClone(design.draft_scene),
    supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).host;
  for (const node of scene.nodes) {
    if (!node.imageUrl || node.assetId) continue;
    let owned = false;
    try {
      owned = new URL(node.imageUrl).host === supabaseHost;
    } catch {
      /* Repository sample images remain static references. */
    }
    if (!owned) continue;
    const index =
      node.kind === "logo"
        ? -1
        : design.source_snapshot.imageUrls.indexOf(node.imageUrl);
    if (index < 0 && node.kind !== "logo") throw new StudioError("VALIDATION");
    const asset = await importStudioSourceImage(tenantId, id, index);
    node.assetId = asset.assetId;
    delete node.imageUrl;
  }
  return requireStudioData(
    await db.rpc("studio_create_version", {
      p_tenant_id: tenantId,
      p_actor_id: user.id,
      p_design_id: id,
      p_revision: revision,
      p_preparation: preparation,
      p_scene: scene as unknown as Json,
    }),
  );
}

export async function duplicateStudioDesign(
  tenantId: string,
  id: string,
  key: string,
  localCopy?: unknown,
) {
  const { db, user } = await requireStudioAccess(
    tenantId,
    "studio.create",
    "create",
  );
  const original = requireStudioData(
    await db
      .from("studio_designs")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .single(),
  ) as unknown as StudioDesign;
  const local = localCopy
    ? z
        .object({
          scene: studioSceneSchema,
          title: z.string().trim().min(1).max(120),
          copy: z.string().max(4000),
          destination_url: destinationSchema,
        })
        .parse(localCopy)
    : null;
  const originalScene = structuredClone(local?.scene ?? original.draft_scene);
  await validateStudioSceneAssets(db, tenantId, id, originalScene, [
    ...original.source_snapshot.imageUrls,
    ...(original.source_snapshot.logoUrl
      ? [original.source_snapshot.logoUrl]
      : []),
  ]);
  const design = await createStudioDesign({
    tenant_id: tenantId,
    source_type: original.source_type,
    source_id: original.source_id,
    title: `${(local?.title ?? original.title).slice(0, 110)} (copia)`,
    idempotency_key: key,
  });
  if (design.revision > 1) return design;
  const newImages = [
    ...design.source_snapshot.imageUrls,
    ...(design.source_snapshot.logoUrl ? [design.source_snapshot.logoUrl] : []),
  ];
  for (const node of originalScene.nodes) {
    if (!node.imageUrl || newImages.includes(node.imageUrl)) continue;
    const index =
      node.kind === "logo"
        ? -1
        : original.source_snapshot.imageUrls.indexOf(node.imageUrl);
    const imported = await importStudioSourceImage(tenantId, id, index);
    node.assetId = imported.assetId;
    delete node.imageUrl;
  }
  const refs = [
    ...new Set(
      originalScene.nodes.flatMap((n) => (n.assetId ? [n.assetId] : [])),
    ),
  ];
  const mapped = new Map<string, string>();
  for (const assetId of refs) {
    const cached = await db
      .from("studio_assets")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("design_id", design.id)
      .eq("status", "ready")
      .contains("metadata", { duplicate_source_asset_id: assetId })
      .limit(1)
      .maybeSingle();
    if (cached.data) {
      mapped.set(assetId, cached.data.id);
      continue;
    }
    const asset = requireStudioData(
      await db
        .from("studio_assets")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("design_id", id)
        .eq("id", assetId)
        .eq("status", "ready")
        .single(),
    );
    const newId = crypto.randomUUID(),
      path = `${tenantId}/${design.id}/original/${newId}.${asset.mime_type === "image/jpeg" ? "jpg" : asset.mime_type === "image/webp" ? "webp" : "png"}`;
    const copied = await db.storage
      .from(STUDIO_BUCKET)
      .copy(asset.storage_path, path);
    if (copied.error) throw new StudioError("INTERNAL");
    requireStudioData(
      await db
        .from("studio_assets")
        .insert({
          id: newId,
          tenant_id: tenantId,
          design_id: design.id,
          kind: "original",
          status: "ready",
          storage_path: path,
          mime_type: asset.mime_type,
          width: asset.width,
          height: asset.height,
          byte_size: asset.byte_size,
          checksum: asset.checksum,
          metadata: { duplicate_source_asset_id: assetId },
        })
        .select("id")
        .single(),
    );
    mapped.set(assetId, newId);
  }
  const scene = {
    ...originalScene,
    nodes: originalScene.nodes.map((n) =>
      n.assetId
        ? { ...n, assetId: mapped.get(n.assetId), id: crypto.randomUUID() }
        : { ...n, id: crypto.randomUUID() },
    ),
  };
  return requireStudioData(
    await db.rpc("studio_save_design", {
      p_tenant_id: tenantId,
      p_actor_id: user.id,
      p_design_id: design.id,
      p_revision: 1,
      p_changes: {
        draft_scene: bindStudioScene(
          scene,
          design.source_snapshot,
        ) as unknown as Json,
        copy: local?.copy ?? original.copy,
        destination_url: local?.destination_url ?? original.destination_url,
      },
    }),
  );
}
