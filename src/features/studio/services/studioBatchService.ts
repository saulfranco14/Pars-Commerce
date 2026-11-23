import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { STUDIO_DESIGN_IDS } from "../constants/designs";
import { STUDIO_BATCH_CHUNK } from "../constants/studio";
import {
  restyleStudioScene,
  setStudioBackdrop,
  setStudioPhrase,
} from "../helpers/sceneStyle";
import { uuidSchema } from "../validations/studioSchemas";
import { requireStudioAccess } from "./studioAccessService";
import { importStudioSourceImage } from "./studioAssetService";
import { suggestStudioPhrases } from "./studioCopyService";
import { createStudioDesign } from "./studioDesignService";
import { requireStudioData, StudioError } from "./studioErrors";
import { studioFlags } from "./studioFlags";
import { copyStudioImage, enqueueStudioGeneration } from "./studioImageService";
import type { Json } from "@/types/database.types";
import type { StudioDb } from "./studioDb";
import type { StudioScene } from "../interfaces/scene";
import type { StudioSource } from "../interfaces/studio";

const batchSchema = z.object({
  tenant_id: uuidSchema,
  batch_key: uuidSchema,
  source_type: z.enum(["product", "promotion", "subscription_plan"]),
  items: z
    .array(
      z.object({ id: uuidSchema, name: z.string().trim().min(1).max(120) }),
    )
    .min(1)
    .max(STUDIO_BATCH_CHUNK),
  mode: z.enum(["shared", "each"]),
  asset_id: uuidSchema.optional(),
  template: z.enum(STUDIO_DESIGN_IDS).default("impact"),
  scene: z.enum(["local", "street", "studio", "surprise"]).default("local"),
  quality: z.enum(["economy", "premium"]).default("economy"),
});

/** Stable per item, so retrying a chunk never duplicates designs or charges twice. */
function itemKey(batchKey: string, itemId: string, purpose: string): string {
  const hex = createHash("sha256")
    .update(`${batchKey}:${itemId}:${purpose}`)
    .digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

async function saveScene(
  db: StudioDb,
  tenantId: string,
  userId: string,
  designId: string,
  scene: StudioScene,
) {
  const design = requireStudioData(
    await db
      .from("studio_designs")
      .select("revision")
      .eq("tenant_id", tenantId)
      .eq("id", designId)
      .single(),
  );
  requireStudioData(
    await db.rpc("studio_save_design", {
      p_tenant_id: tenantId,
      p_actor_id: userId,
      p_design_id: designId,
      p_revision: design.revision,
      p_changes: { draft_scene: scene } as unknown as Json,
    }),
  );
}

/** Creates one ad per item (a chunk of a bigger batch): shared image, or one AI image each (queued). */
export async function createStudioBatch(raw: unknown) {
  const input = batchSchema.parse(raw);
  const { db, user } = await requireStudioAccess(
    input.tenant_id,
    "studio.create",
    "create",
  );
  if (input.mode === "shared" && !input.asset_id)
    throw new StudioError("VALIDATION");
  if (input.mode === "each" && !studioFlags().ai)
    throw new StudioError("NOT_CONFIGURED");
  const tenant = requireStudioData(
    await db.from("tenants").select("name").eq("id", input.tenant_id).single(),
  );
  const phrases = await suggestStudioPhrases(
    tenant.name,
    input.items.map((item) => item.name),
  );
  const designs: Array<{ id: string; title: string; sourceId: string }> = [],
    jobs: Array<{ id: string; designId: string }> = [],
    skipped: Array<{ id: string; reason: string }> = [];
  for (const [index, item] of input.items.entries()) {
    try {
      const design = await createStudioDesign({
        tenant_id: input.tenant_id,
        source_type: input.source_type,
        source_id: item.id,
        title: item.name,
        idempotency_key: itemKey(input.batch_key, item.id, "design"),
      });
      designs.push({ id: design.id, title: design.title, sourceId: item.id });
      const source = design.source_snapshot as unknown as StudioSource;
      let scene = setStudioPhrase(
        restyleStudioScene(design.draft_scene, source, input.template),
        source,
        phrases[index] ?? item.name,
      );
      if (input.mode === "shared") {
        const image = await copyStudioImage(
          db,
          input.tenant_id,
          design.id,
          input.asset_id!,
        );
        scene = setStudioBackdrop(scene, image.assetId);
      }
      await saveScene(db, input.tenant_id, user.id, design.id, scene);
      if (input.mode === "each") {
        if (!source.imageUrls?.length) {
          skipped.push({ id: item.id, reason: "Sin foto en el catálogo" });
          continue;
        }
        const photo = await importStudioSourceImage(
          input.tenant_id,
          design.id,
          0,
        );
        const job = await enqueueStudioGeneration(
          db,
          user.id,
          {
            tenant_id: input.tenant_id,
            design_id: design.id,
            asset_id: photo.assetId,
            operation: "style",
            quality: input.quality,
            scene: input.scene,
            wish: "",
          },
          itemKey(input.batch_key, item.id, "job"),
        );
        jobs.push({ id: job.id, designId: design.id });
      }
    } catch (error) {
      const message =
        error instanceof StudioError
          ? error.message
          : "No pudimos crear este anuncio.";
      skipped.push({ id: item.id, reason: message });
      if (error instanceof StudioError && error.code === "INSUFFICIENT_TLACOS")
        break;
    }
  }
  return { designs, jobs, skipped };
}
