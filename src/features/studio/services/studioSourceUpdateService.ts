import "server-only";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/requirePermission";
import { requireStudioAccess } from "./studioAccessService";
import { StudioError, requireStudioData } from "./studioErrors";
import { STUDIO_BUCKET } from "../constants/studio";
import { uuidSchema } from "../validations/studioSchemas";
import type { StudioDb } from "./studioDb";
import type { StudioSourceType } from "../interfaces/studio";

const TABLES = {
  product: "products",
  promotion: "promotions",
  subscription_plan: "offer_plans",
} as const;

/**
 * Answers the merchant gives inside Studio go back to the catalog, so no ad
 * asks twice. Each write needs the catalog's own write permission.
 */
async function sourceOf(tenantId: string, designId: string) {
  const { db, user } = await requireStudioAccess(
    tenantId,
    "studio.create",
    "create",
  );
  const design = requireStudioData(
    await db
      .from("studio_designs")
      .select("source_type,source_id")
      .eq("tenant_id", tenantId)
      .eq("id", designId)
      .single(),
  ) as { source_type: StudioSourceType; source_id: string | null };
  if (design.source_type === "custom" || !design.source_id)
    throw new StudioError("VALIDATION", "Esta campaña no viene del catálogo.");
  const permission =
    design.source_type === "product" ? "products.write" : "promotions.write";
  if (!(await requirePermission(user.id, tenantId, permission)))
    throw new StudioError(
      "FORBIDDEN",
      "Necesitas permiso para editar tu catálogo. El propietario puede dártelo desde Equipo.",
    );
  return {
    db,
    type: design.source_type,
    id: design.source_id,
    table: TABLES[design.source_type],
  };
}

const describeSchema = z.object({
  tenant_id: uuidSchema,
  description: z.string().trim().min(2).max(500),
});

export async function describeStudioSource(designId: string, raw: unknown) {
  const input = describeSchema.parse(raw);
  const { db, table, id } = await sourceOf(input.tenant_id, designId);
  requireStudioData(
    await db
      .from(table)
      .update({ description: input.description })
      .eq("tenant_id", input.tenant_id)
      .eq("id", id)
      .select("id")
      .single(),
  );
  return { saved: true };
}

const validitySchema = z.object({
  tenant_id: uuidSchema,
  valid_until: z.string().datetime({ offset: true }),
});

export async function extendStudioPromotion(designId: string, raw: unknown) {
  const input = validitySchema.parse(raw);
  if (new Date(input.valid_until) <= new Date())
    throw new StudioError("VALIDATION", "Elige una fecha que todavía no pase.");
  const { db, type, id } = await sourceOf(input.tenant_id, designId);
  if (type !== "promotion")
    throw new StudioError(
      "VALIDATION",
      "Solo las promociones tienen vigencia.",
    );
  const row = requireStudioData(
    await db
      .from("promotions")
      .select("valid_from,status")
      .eq("tenant_id", input.tenant_id)
      .eq("id", id)
      .single(),
  );
  if (row.status === "archived")
    throw new StudioError("VALIDATION", "Esta promoción está archivada.");
  requireStudioData(
    await db
      .from("promotions")
      .update({
        valid_until: input.valid_until,
        ...(row.valid_from &&
        new Date(row.valid_from) > new Date(input.valid_until)
          ? { valid_from: null }
          : {}),
      })
      .eq("tenant_id", input.tenant_id)
      .eq("id", id)
      .select("id")
      .single(),
  );
  return { saved: true };
}

const photoSchema = z.object({
  tenant_id: uuidSchema,
  asset_id: uuidSchema,
});

async function copyToCatalog(
  db: StudioDb,
  tenantId: string,
  designId: string,
  assetId: string,
) {
  const asset = requireStudioData(
    await db
      .from("studio_assets")
      .select("storage_path,mime_type,kind")
      .eq("tenant_id", tenantId)
      .eq("design_id", designId)
      .eq("id", assetId)
      .eq("status", "ready")
      .single(),
  );
  if (asset.kind !== "original") throw new StudioError("VALIDATION");
  const file = await db.storage
    .from(STUDIO_BUCKET)
    .download(asset.storage_path);
  if (file.error || !file.data) throw new StudioError("INTERNAL");
  const extension =
      asset.mime_type === "image/png"
        ? "png"
        : asset.mime_type === "image/webp"
          ? "webp"
          : "jpg",
    path = `${tenantId}/studio/${assetId}.${extension}`;
  const upload = await db.storage
    .from("product-images")
    .upload(path, file.data, { contentType: asset.mime_type, upsert: true });
  if (upload.error) throw new StudioError("INTERNAL");
  return db.storage.from("product-images").getPublicUrl(path).data.publicUrl;
}

/** The photo the merchant took for an ad becomes the item's photo when it had none. */
export async function saveStudioPhotoToCatalog(designId: string, raw: unknown) {
  const input = photoSchema.parse(raw);
  const { db, type, id, table } = await sourceOf(input.tenant_id, designId);
  const current = requireStudioData(
    await db
      .from(table)
      .select("image_url")
      .eq("tenant_id", input.tenant_id)
      .eq("id", id)
      .single(),
  ) as { image_url: string | null };
  if (type === "product") {
    const { count } = await db
      .from("product_images")
      .select("id", { count: "exact", head: true })
      .eq("product_id", id);
    if (current.image_url || count) return { saved: false };
    const url = await copyToCatalog(
      db,
      input.tenant_id,
      designId,
      input.asset_id,
    );
    requireStudioData(
      await db
        .from("product_images")
        .insert({ product_id: id, url, position: 0 })
        .select("id")
        .single(),
    );
    requireStudioData(
      await db
        .from("products")
        .update({ image_url: url })
        .eq("tenant_id", input.tenant_id)
        .eq("id", id)
        .select("id")
        .single(),
    );
    return { saved: true };
  }
  if (current.image_url) return { saved: false };
  const url = await copyToCatalog(
    db,
    input.tenant_id,
    designId,
    input.asset_id,
  );
  requireStudioData(
    await db
      .from(table)
      .update({ image_url: url })
      .eq("tenant_id", input.tenant_id)
      .eq("id", id)
      .select("id")
      .single(),
  );
  return { saved: true };
}
