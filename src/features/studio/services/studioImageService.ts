import "server-only";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { z } from "zod";
import { STUDIO_BUCKET, STUDIO_MAX_BYTES } from "../constants/studio";
import { STUDIO_ASPECT_RATIOS } from "../helpers/aiPrompt";
import { setStudioBackdrop } from "../helpers/sceneStyle";
import { generationSchema, uuidSchema } from "../validations/studioSchemas";
import { requireStudioAccess } from "./studioAccessService";
import { createStudioQuote } from "./studioAiService";
import {
  requireStudioData,
  requireStudioSuccess,
  StudioError,
} from "./studioErrors";
import { studioFlags } from "./studioFlags";
import {
  generateStudioGeminiImage,
  StudioProviderFailure,
} from "./studioGeminiImage";
import type { Json } from "@/types/database.types";
import type { StudioDb } from "./studioDb";
import type { StudioScene } from "../interfaces/scene";
import type { StudioJob } from "../interfaces/studio";

const JOB_COLUMNS =
  "id,design_id,status,operation,reserved_tlacos,result_asset_id,error_code,created_at";
const FORMATS = new Set(["png", "jpeg", "webp"]);

const assetUrl = (tenantId: string, id: string) =>
  `/api/studio/assets/${id}/file?tenant_id=${tenantId}`;

async function assetBytes(
  db: StudioDb,
  tenantId: string,
  designId: string,
  assetId: string,
) {
  const asset = requireStudioData(
    await db
      .from("studio_assets")
      .select("id,storage_path,mime_type")
      .eq("tenant_id", tenantId)
      .eq("design_id", designId)
      .eq("id", assetId)
      .eq("status", "ready")
      .single(),
  );
  const file = await db.storage
    .from(STUDIO_BUCKET)
    .download(asset.storage_path);
  if (file.error || !file.data || file.data.size > STUDIO_MAX_BYTES)
    throw new StudioProviderFailure("INPUT_UNAVAILABLE");
  return {
    bytes: Buffer.from(await file.data.arrayBuffer()),
    mime: asset.mime_type,
  };
}

async function applyToDesign(
  db: StudioDb,
  tenantId: string,
  userId: string,
  designId: string,
  assetId: string,
) {
  const design = requireStudioData(
    await db
      .from("studio_designs")
      .select("revision,draft_scene")
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
      p_changes: {
        draft_scene: setStudioBackdrop(
          design.draft_scene as unknown as StudioScene,
          assetId,
        ),
      } as unknown as Json,
    }),
  );
}

/** Claims one queued job and runs it with Gemini right here; credits are captured or released by SQL. */
async function processJob(db: StudioDb, jobId: string) {
  const claimed = requireStudioData(
    await db.rpc("studio_claim_job", { p_job_id: jobId }),
  ) as unknown as
    | (StudioJob & {
        tenant_id: string;
        input_asset_id: string;
        reference_asset_id: string | null;
        route_id: string;
        route_snapshot: Array<{
          id: string;
          provider: string;
          model: string;
          estimated_cost_usd: number;
        }>;
        instructions: string;
        lease_token: string;
      })
    | null;
  if (!claimed) return;
  const job = claimed;
  let attemptId: string | null = null;
  try {
    const route = job.route_snapshot.find((r) => r.id === job.route_id);
    if (!route || route.provider !== "gemini")
      throw new StudioProviderFailure("MODEL_NOT_CONFIGURED");
    const design = requireStudioData(
      await db
        .from("studio_designs")
        .select("draft_scene")
        .eq("tenant_id", job.tenant_id)
        .eq("id", job.design_id)
        .single(),
    );
    const format = (design.draft_scene as unknown as StudioScene).format;
    const images = [
      await assetBytes(db, job.tenant_id, job.design_id, job.input_asset_id),
      ...(job.reference_asset_id
        ? [
            await assetBytes(
              db,
              job.tenant_id,
              job.design_id,
              job.reference_asset_id,
            ),
          ]
        : []),
    ];
    const attempt = requireStudioData(
      await db
        .from("studio_ai_attempts")
        .insert({
          tenant_id: job.tenant_id,
          job_id: job.id,
          provider: route.provider,
          model: route.model,
          status: "started",
          estimated_cost_usd: Number(route.estimated_cost_usd),
        })
        .select("id")
        .single(),
    );
    attemptId = attempt.id;
    const output = await generateStudioGeminiImage({
      model: route.model,
      prompt: job.instructions,
      images,
      aspectRatio: STUDIO_ASPECT_RATIOS[format] ?? "1:1",
    });
    const meta = await sharp(output.bytes).metadata();
    if (
      !meta.format ||
      !FORMATS.has(meta.format) ||
      !meta.width ||
      !meta.height
    )
      throw new StudioProviderFailure("INVALID_IMAGE_OUTPUT");
    const mime = `image/${meta.format}` as
        "image/png" | "image/jpeg" | "image/webp",
      extension = meta.format === "jpeg" ? "jpg" : meta.format,
      path = `${job.tenant_id}/${job.design_id}/generated/${job.id}.${extension}`;
    const upload = await db.storage
      .from(STUDIO_BUCKET)
      .upload(path, output.bytes, { contentType: mime, upsert: false });
    if (upload.error && !/already exists/i.test(upload.error.message))
      throw new StudioProviderFailure("STORAGE_FAILED");
    requireStudioSuccess(
      await db.from("studio_assets").upsert(
        {
          id: job.id,
          tenant_id: job.tenant_id,
          design_id: job.design_id,
          kind: "generated",
          status: "pending",
          storage_path: path,
          mime_type: mime,
          width: meta.width,
          height: meta.height,
          byte_size: output.bytes.length,
          source_asset_id: job.input_asset_id,
          provider: route.provider,
          checksum: createHash("sha256").update(output.bytes).digest("hex"),
        },
        { onConflict: "id", ignoreDuplicates: true },
      ),
    );
    const finished = requireStudioData(
      await db.rpc("studio_finish_job", {
        p_job_id: job.id,
        p_lease_token: job.lease_token,
        p_asset_id: job.id,
        p_error: null,
      }),
    );
    await db
      .from("studio_ai_attempts")
      .update({
        status: finished ? "succeeded" : "unknown",
        finished_at: new Date().toISOString(),
      })
      .eq("id", attemptId);
  } catch (error) {
    const code =
      error instanceof StudioProviderFailure
        ? error.code
        : "PROVIDER_OUTCOME_UNKNOWN";
    console.error("[studio] generation failed", { jobId: job.id, code });
    if (attemptId)
      await db
        .from("studio_ai_attempts")
        .update({
          status: "failed",
          error_code: code,
          finished_at: new Date().toISOString(),
        })
        .eq("id", attemptId);
    await db.rpc("studio_finish_job", {
      p_job_id: job.id,
      p_lease_token: job.lease_token,
      p_asset_id: null,
      p_error: code,
    });
  }
}

async function readJob(db: StudioDb, tenantId: string, id: string) {
  return requireStudioData(
    await db
      .from("studio_ai_jobs")
      .select(JOB_COLUMNS)
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .single(),
  ) as StudioJob;
}

function withUrl(tenantId: string, job: StudioJob) {
  return {
    ...job,
    result_url: job.result_asset_id
      ? assetUrl(tenantId, job.result_asset_id)
      : null,
  };
}

/** Runs a queued job (batches call it one by one); `apply` puts the result on the design. */
export async function runStudioJob(raw: unknown) {
  const input = z
    .object({
      tenant_id: uuidSchema,
      job_id: uuidSchema,
      apply: z.boolean().default(false),
    })
    .parse(raw);
  const { db, user } = await requireStudioAccess(
    input.tenant_id,
    "studio.create",
    "create",
  );
  if (!studioFlags().ai) throw new StudioError("NOT_CONFIGURED");
  const before = await readJob(db, input.tenant_id, input.job_id);
  if (before.status === "queued") await processJob(db, input.job_id);
  const job = await readJob(db, input.tenant_id, input.job_id);
  if (input.apply && job.status === "succeeded" && job.result_asset_id)
    await applyToDesign(
      db,
      input.tenant_id,
      user.id,
      job.design_id,
      job.result_asset_id,
    );
  return withUrl(input.tenant_id, job);
}

/** Quote, reserve and generate in one call: the editor shows the price before the person taps Generar. */
export async function generateStudioImageNow(raw: unknown) {
  const input = generationSchema
    .extend({ idempotency_key: uuidSchema })
    .parse(raw);
  const { db, user } = await requireStudioAccess(
    input.tenant_id,
    "studio.create",
    "create",
  );
  if (!studioFlags().ai) throw new StudioError("NOT_CONFIGURED");
  const limited = requireStudioData(
    await db.rpc("studio_rate_limit", {
      p_scope: `generate:${input.tenant_id}:${user.id}`,
      p_limit: 10,
    }),
  );
  if (!limited) throw new StudioError("RATE_LIMIT");
  const job = await enqueueStudioGeneration(
    db,
    user.id,
    input,
    input.idempotency_key,
  );
  if (job.status === "queued") await processJob(db, job.id);
  return withUrl(input.tenant_id, await readJob(db, input.tenant_id, job.id));
}

export async function enqueueStudioGeneration(
  db: StudioDb,
  userId: string,
  input: z.infer<typeof generationSchema>,
  idempotencyKey: string,
) {
  const quote = await createStudioQuote(db, userId, input);
  return requireStudioData(
    await db.rpc("studio_enqueue_generation", {
      p_quote_id: quote.id,
      p_actor_id: userId,
      p_idempotency_key: idempotencyKey,
    }),
  ) as unknown as StudioJob;
}

export async function listPendingStudioJobs(tenantId: string) {
  const { db } = await requireStudioAccess(tenantId, "studio.create");
  return requireStudioData(
    await db
      .from("studio_ai_jobs")
      .select(JOB_COLUMNS)
      .eq("tenant_id", tenantId)
      .in("status", ["queued", "processing"])
      .order("created_at")
      .limit(100),
  ) as StudioJob[];
}

/** Every image the AI made for this business, newest first, to reuse in any ad. */
export async function listStudioImages(tenantId: string) {
  const { db } = await requireStudioAccess(tenantId);
  const rows = requireStudioData(
    await db
      .from("studio_assets")
      .select("id,design_id,created_at,width,height")
      .eq("tenant_id", tenantId)
      .eq("kind", "generated")
      .is("metadata->>copied_from", null)
      .eq("status", "ready")
      .order("created_at", { ascending: false })
      .limit(60),
  );
  const designIds = [...new Set(rows.map((r) => r.design_id))];
  const designs = designIds.length
    ? requireStudioData(
        await db
          .from("studio_designs")
          .select("id,title")
          .eq("tenant_id", tenantId)
          .in("id", designIds),
      )
    : [];
  return rows.map((row) => ({
    id: row.id,
    designId: row.design_id,
    title: designs.find((d) => d.id === row.design_id)?.title ?? "",
    url: assetUrl(tenantId, row.id),
    createdAt: row.created_at,
  }));
}

/** Copies one of the business's images into a design so it can be used there; same design returns it as is. */
export async function importStudioImage(raw: unknown) {
  const input = z
    .object({
      tenant_id: uuidSchema,
      design_id: uuidSchema,
      asset_id: uuidSchema,
    })
    .parse(raw);
  const { db } = await requireStudioAccess(
    input.tenant_id,
    "studio.create",
    "create",
  );
  return copyStudioImage(db, input.tenant_id, input.design_id, input.asset_id);
}

export async function copyStudioImage(
  db: StudioDb,
  tenantId: string,
  designId: string,
  assetId: string,
) {
  const asset = requireStudioData(
    await db
      .from("studio_assets")
      .select(
        "id,design_id,storage_path,mime_type,width,height,byte_size,checksum,kind",
      )
      .eq("tenant_id", tenantId)
      .eq("id", assetId)
      .eq("status", "ready")
      .in("kind", ["generated", "original"])
      .single(),
  );
  if (asset.design_id === designId)
    return { assetId: asset.id, url: assetUrl(tenantId, asset.id) };
  const { data: existing } = await db
    .from("studio_assets")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("design_id", designId)
    .eq("status", "ready")
    .contains("metadata", { copied_from: asset.id })
    .limit(1)
    .maybeSingle();
  if (existing)
    return { assetId: existing.id, url: assetUrl(tenantId, existing.id) };
  const id = crypto.randomUUID(),
    extension = asset.storage_path.split(".").pop() ?? "png",
    path = `${tenantId}/${designId}/original/${id}.${extension}`;
  const copied = await db.storage
    .from(STUDIO_BUCKET)
    .copy(asset.storage_path, path);
  if (copied.error) throw new StudioError("INTERNAL");
  requireStudioSuccess(
    await db
      .from("studio_assets")
      .insert({
        id,
        tenant_id: tenantId,
        design_id: designId,
        kind: asset.kind,
        status: "ready",
        storage_path: path,
        mime_type: asset.mime_type,
        width: asset.width,
        height: asset.height,
        byte_size: asset.byte_size,
        checksum: asset.checksum,
        metadata: {
          copied_from: asset.id,
          generated: asset.kind === "generated",
        },
      })
      .select("id")
      .single(),
  );
  return { assetId: id, url: assetUrl(tenantId, id) };
}
