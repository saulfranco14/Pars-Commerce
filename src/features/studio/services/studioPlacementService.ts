import "server-only";
import { z } from "zod";
import { STUDIO_BUCKET, STUDIO_SURFACES } from "../constants/studio";
import { destinationSchema, uuidSchema } from "../validations/studioSchemas";
import { requireStudioAccess } from "./studioAccessService";
import { requireStudioData, StudioError } from "./studioErrors";
import { studioDb } from "./studioDb";
import { studioFlags } from "./studioFlags";
import type {
  StudioArtwork,
  StudioChannel,
  StudioPlacement,
  StudioSurface,
} from "../interfaces/studio";

const placementSchema = z.object({
  tenant_id: uuidSchema,
  idempotency_key: uuidSchema,
  version_id: uuidSchema,
  title: z.string().trim().min(1).max(120),
  alt_text: z.string().trim().min(1).max(300),
  destination_url: destinationSchema,
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime().nullable(),
  targets: z
    .array(
      z.object({
        surface: z.enum(
          Object.keys(STUDIO_SURFACES) as [StudioSurface, ...StudioSurface[]],
        ),
        render_id: uuidSchema,
      }),
    )
    .min(1)
    .max(8),
});

export async function applyStudioPlacements(raw: unknown) {
  const input = placementSchema.parse(raw);
  const { db, user } = await requireStudioAccess(
    input.tenant_id,
    "studio.publish",
    true,
  );
  if (!studioFlags().publish) throw new StudioError("NOT_CONFIGURED");
  if (
    new Set(input.targets.map((t) => t.surface)).size !== input.targets.length
  )
    throw new StudioError("VALIDATION");
  const version = requireStudioData(
    await db
      .from("studio_design_versions")
      .select("source_snapshot")
      .eq("tenant_id", input.tenant_id)
      .eq("id", input.version_id)
      .single(),
  );
  const snapshot = version.source_snapshot as { validUntil?: string | null };
  const end =
    snapshot.validUntil &&
    (!input.ends_at || snapshot.validUntil < input.ends_at)
      ? snapshot.validUntil
      : input.ends_at;
  if (end && new Date(end) <= new Date(input.starts_at))
    throw new StudioError("VALIDATION", "El fin debe ser posterior al inicio.");
  const results = [];
  for (const target of input.targets) {
    try {
      const row = requireStudioData(
        await db.rpc("studio_apply_placement", {
          p_tenant_id: input.tenant_id,
          p_actor_id: user.id,
          p_version_id: input.version_id,
          p_render_id: target.render_id,
          p_surface: target.surface,
          p_title: input.title,
          p_alt: input.alt_text,
          p_url: input.destination_url,
          p_start: input.starts_at,
          p_end: end,
          p_key: input.idempotency_key,
        }),
      );
      results.push({ surface: target.surface, ok: true, placement: row });
    } catch (error) {
      if (!(error instanceof StudioError)) throw error;
      results.push({
        surface: target.surface,
        ok: false,
        error: error.message,
        code: error.code,
      });
    }
  }
  return { results };
}

export async function listStudioPlacements(tenantId: string) {
  const { db } = await requireStudioAccess(tenantId);
  return requireStudioData(
    await db
      .from("studio_placements")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(100),
  );
}

export async function removeStudioPlacement(tenantId: string, id: string) {
  const { db, user } = await requireStudioAccess(tenantId, "studio.publish");
  requireStudioData(
    await db
      .from("studio_placements")
      .update({ is_active: false, disabled_reason: "retired" })
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .select("id")
      .single(),
  );
  await db.from("studio_activity_events").insert({
    tenant_id: tenantId,
    actor_id: user.id,
    action: "placement.removed",
    entity_id: id,
  });
  return { removed: true };
}

export async function resolveStudioArtworkBatch(
  tenantId: string,
  channel: StudioChannel,
  surface: StudioSurface,
  sourceIds?: string[],
): Promise<Map<string, StudioArtwork>> {
  const output = new Map<string, StudioArtwork>();
  if (!studioFlags().publish || sourceIds?.length === 0) return output;
  try {
    const db = studioDb();
    const placements = requireStudioData(
      await db.rpc("studio_resolve_placements", {
        p_tenant_id: tenantId,
        p_channel: channel,
        p_surface: surface,
        p_source_ids: sourceIds,
      }),
    );
    if (!placements.length) return output;
    const renders = requireStudioData(
      await db
        .from("studio_renders")
        .select("id,asset_id")
        .eq("tenant_id", tenantId)
        .in(
          "id",
          placements.map((p) => p.render_id),
        ),
    );
    const assets = requireStudioData(
      await db
        .from("studio_assets")
        .select("id,width,height")
        .eq("tenant_id", tenantId)
        .eq("status", "ready")
        .in(
          "id",
          renders.map((r) => r.asset_id),
        ),
    );
    for (const p of placements) {
      const render = renders.find((r) => r.id === p.render_id),
        asset = assets.find((a) => a.id === render?.asset_id);
      if (!asset?.width || !asset.height) continue;
      output.set(p.source_id ?? "campaign", {
        placementId: p.id,
        url: `/api/public/studio/media/${p.id}`,
        alt: p.alt_text,
        href: p.destination_url || null,
        expiresAt: p.ends_at,
        width: asset.width,
        height: asset.height,
      });
      if (p.target_key === "campaign")
        output.set("campaign", output.get(p.source_id ?? "campaign")!);
    }
  } catch (error) {
    console.error("[studio] artwork fallback", {
      surface,
      tenantId,
      code: error instanceof StudioError ? error.code : "UNAVAILABLE",
    });
  }
  return output;
}

export async function publicStudioPlacement(
  id: string,
): Promise<StudioPlacement | null> {
  if (!studioFlags().publish) return null;
  const db = studioDb();
  const { data: row } = await db
    .from("studio_placements")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .lte("starts_at", new Date().toISOString())
    .maybeSingle();
  if (!row || (row.ends_at && new Date(row.ends_at) <= new Date())) return null;
  const eligible = await db.rpc("studio_source_eligible", {
    p_tenant_id: row.tenant_id,
    p_type: row.source_type,
    p_source_id: row.source_id,
    p_channel: row.channel,
    p_source_hash: row.source_hash,
  });
  return eligible.data === true ? (row as StudioPlacement) : null;
}

export async function getPublicStudioFile(id: string, head = false) {
  const placement = await publicStudioPlacement(id);
  if (!placement)
    return new Response(null, {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  const db = studioDb();
  const render = requireStudioData(
    await db
      .from("studio_renders")
      .select("asset_id")
      .eq("tenant_id", placement.tenant_id)
      .eq("id", placement.render_id)
      .eq("design_version_id", placement.design_version_id)
      .single(),
  );
  const asset = requireStudioData(
    await db
      .from("studio_assets")
      .select("storage_path,mime_type")
      .eq("tenant_id", placement.tenant_id)
      .eq("id", render.asset_id)
      .eq("status", "ready")
      .single(),
  );
  const headers = {
    "Content-Type": asset.mime_type,
    "Cache-Control": "no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, noimageindex",
  };
  if (head) return new Response(null, { headers });
  const file = await db.storage
    .from(STUDIO_BUCKET)
    .download(asset.storage_path);
  if (file.error || !file.data)
    return new Response(null, { status: 404, headers });
  return new Response(file.data, { headers });
}
