import { createClient } from "npm:@supabase/supabase-js@2.95.3";
import {
  GeminiStudioAdapter,
  OpenAiStudioAdapter,
  STUDIO_IMAGE_PROMPT,
  STUDIO_REVIEW_PROMPT,
  StudioProviderError,
  studioProvider,
} from "../_shared/studio/providers.ts";
import { studioImageMetadata } from "../_shared/studio/imageMetadata.ts";

const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);
const BUCKET = "studio-assets";
function check(error: unknown) {
  if (error) throw new StudioProviderError("DATABASE_ERROR");
}
async function secretMatches(value: string | null): Promise<boolean> {
  const secret = Deno.env.get("STUDIO_WORKER_SECRET");
  if (!secret || !value || value.length > 256) return false;
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret)),
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
  ]);
  const aa = new Uint8Array(a),
    bb = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < aa.length; i++) diff |= aa[i] ^ bb[i];
  return diff === 0;
}
async function assetBytes(assetId: string, tenantId: string, designId: string) {
  const { data: asset, error } = await db
    .from("studio_assets")
    .select("*")
    .eq("id", assetId)
    .eq("tenant_id", tenantId)
    .eq("design_id", designId)
    .eq("status", "ready")
    .single();
  check(error);
  const { data: file, error: download } = await db.storage
    .from(BUCKET)
    .download(asset.storage_path);
  check(download);
  if (!file || file.size > 12 * 1024 * 1024)
    throw new StudioProviderError("INPUT_TOO_LARGE");
  return { asset, bytes: new Uint8Array(await file.arrayBuffer()) };
}
async function processJob() {
  if (Deno.env.get("STUDIO_AI_ENABLED") !== "true") return;
  const { data: job, error } = await db.rpc("studio_take_job");
  check(error);
  if (!job) return;
  let attemptId: string | null = null;
  try {
    const snapshot = job.route_snapshot as Array<{
      id: string;
      provider: string;
      model: string;
      estimated_cost_usd: number;
      config_version: number;
    }>;
    const selected = snapshot.find((route) => route.id === job.route_id);
    if (!selected) throw new StudioProviderError("MODEL_NOT_CONFIGURED");
    const { data: enabled, error: routeError } = await db
      .from("studio_ai_routes")
      .select("id")
      .eq("id", selected.id)
      .eq("is_active", true)
      .single();
    check(routeError);
    if (!enabled) throw new StudioProviderError("PROVIDER_NOT_CONFIGURED");
    const route = selected,
      model = route.model;
    const provider = studioProvider(route.provider);
    const input = await assetBytes(
      job.input_asset_id,
      job.tenant_id,
      job.design_id,
    );
    const { data: attempt, error: attemptError } = await db
      .from("studio_ai_attempts")
      .insert({
        tenant_id: job.tenant_id,
        job_id: job.id,
        provider: route.provider,
        model,
        status: "started",
        estimated_cost_usd: job.provider_request_id
          ? 0
          : Number(route.estimated_cost_usd),
      })
      .select("id")
      .single();
    check(attemptError);
    attemptId = attempt.id;
    const output =
      job.provider_request_id && job.polling_url && provider.poll
        ? await provider.poll(job.polling_url, job.provider_request_id)
        : await provider.generate({
            bytes: input.bytes,
            mime: input.asset.mime_type,
            model,
            prompt: STUDIO_IMAGE_PROMPT + job.instructions,
            quality: job.quality,
          });
    if (output.status === "pending") {
      const pending = await db.rpc("studio_pending_job", {
        p_job_id: job.id,
        p_lease_token: job.lease_token,
        p_request_id: output.requestId,
        p_polling_url: output.pollingUrl,
      });
      check(pending.error);
      await db
        .from("studio_ai_attempts")
        .update({
          status: "pending",
          external_request_id: output.requestId,
          finished_at: new Date().toISOString(),
        })
        .eq("id", attemptId);
      return;
    }
    const metadata = studioImageMetadata(output.bytes);
    if (metadata.mime !== output.mime)
      throw new StudioProviderError("INVALID_IMAGE_OUTPUT");
    const extension =
      metadata.mime === "image/png"
        ? "png"
        : metadata.mime === "image/jpeg"
          ? "jpg"
          : "webp";
    const assetId = job.id,
      path = `${job.tenant_id}/${job.design_id}/generated/${job.id}.${extension}`;
    const checksum = Array.from(
      new Uint8Array(
        await crypto.subtle.digest("SHA-256", new Uint8Array(output.bytes)),
      ),
      (v) => v.toString(16).padStart(2, "0"),
    ).join("");
    const upload = await db.storage
      .from(BUCKET)
      .upload(path, output.bytes, { contentType: output.mime, upsert: false });
    if (
      upload.error &&
      !String(upload.error.message).toLowerCase().includes("already exists")
    )
      check(upload.error);
    const asset = await db.from("studio_assets").upsert(
      {
        id: assetId,
        tenant_id: job.tenant_id,
        design_id: job.design_id,
        kind: "generated",
        status: "pending",
        storage_path: path,
        mime_type: metadata.mime,
        width: metadata.width,
        height: metadata.height,
        byte_size: output.bytes.length,
        source_asset_id: job.input_asset_id,
        provider: route.provider,
        checksum,
      },
      { onConflict: "id", ignoreDuplicates: true },
    );
    check(asset.error);
    const finished = await db.rpc("studio_finish_job", {
      p_job_id: job.id,
      p_lease_token: job.lease_token,
      p_asset_id: assetId,
      p_error: null,
    });
    check(finished.error);
    await db
      .from("studio_ai_attempts")
      .update({
        status: finished.data ? "succeeded" : "unknown",
        finished_at: new Date().toISOString(),
      })
      .eq("id", attemptId);
  } catch (error) {
    const code =
      error instanceof StudioProviderError
        ? error.code
        : "PROVIDER_OUTCOME_UNKNOWN";
    console.error("[studio-worker] generation failed", { jobId: job.id, code });
    if (attemptId)
      await db
        .from("studio_ai_attempts")
        .update({
          status: code === "PROVIDER_OUTCOME_UNKNOWN" ? "unknown" : "failed",
          error_code: code,
          finished_at: new Date().toISOString(),
        })
        .eq("id", attemptId);
    if (
      error instanceof StudioProviderError &&
      error.safeRetry &&
      job.attempt_count < 3
    )
      await db.rpc("studio_retry_job", {
        p_job_id: job.id,
        p_lease_token: job.lease_token,
        p_error: code,
      });
    else
      await db.rpc("studio_finish_job", {
        p_job_id: job.id,
        p_lease_token: job.lease_token,
        p_asset_id: null,
        p_error: code,
      });
  }
}

async function processReview(
  reviewId: string,
  assetId: string,
  routeId: string,
) {
  if (Deno.env.get("STUDIO_AI_ENABLED") !== "true")
    throw new StudioProviderError("AI_DISABLED");
  const { data: review, error } = await db
    .from("studio_ai_reviews")
    .select("*")
    .eq("id", reviewId)
    .eq("status", "processing")
    .single();
  check(error);
  const { data: allowed } = await db.rpc("studio_has_permission", {
    p_tenant_id: review.tenant_id,
    p_actor_id: review.requested_by,
    p_permission: "studio.create",
  });
  if (!allowed) throw new StudioProviderError("FORBIDDEN");
  const { data: render, error: renderError } = await db
    .from("studio_renders")
    .select("asset_id")
    .eq("tenant_id", review.tenant_id)
    .eq("design_version_id", review.design_version_id)
    .eq("asset_id", assetId)
    .single();
  check(renderError);
  const { data: route, error: routeError } = await db
    .from("studio_ai_routes")
    .select("*")
    .eq("id", routeId)
    .eq("operation", "review")
    .eq("is_active", true)
    .single();
  check(routeError);
  const model = Deno.env.get(route.model_env);
  if (!model) throw new StudioProviderError("MODEL_NOT_CONFIGURED");
  if (
    review.evaluator_version !==
    `${route.provider}:${model}:${route.config_version}`
  )
    throw new StudioProviderError("REVIEW_CONFIG_CHANGED");
  const source = await assetBytes(
    render.asset_id,
    review.tenant_id,
    review.design_id,
  );
  const provider =
    route.provider === "gemini"
      ? new GeminiStudioAdapter()
      : route.provider === "openai"
        ? new OpenAiStudioAdapter()
        : null;
  if (!provider) throw new StudioProviderError("REVIEW_NOT_SUPPORTED");
  const result = await provider.evaluate({
    bytes: source.bytes,
    mime: source.asset.mime_type,
    model,
    prompt: STUDIO_REVIEW_PROMPT,
    quality: "economy",
  });
  const updated = await db
    .from("studio_ai_reviews")
    .update(result)
    .eq("id", reviewId)
    .eq("tenant_id", review.tenant_id);
  check(updated.error);
}

Deno.serve(async (request: Request) => {
  if (
    request.method !== "POST" ||
    !(await secretMatches(request.headers.get("x-studio-worker-secret")))
  )
    return new Response(null, { status: 401 });
  const body = await request.json().catch(() => ({}));
  if (body.review_id) {
    try {
      await processReview(
        String(body.review_id),
        String(body.asset_id),
        String(body.route_id),
      );
      return Response.json({ completed: true });
    } catch {
      await db
        .from("studio_ai_reviews")
        .update({ status: "failed" })
        .eq("id", String(body.review_id));
      return Response.json({ error: "REVIEW_FAILED" }, { status: 502 });
    }
  }
  EdgeRuntime.waitUntil(processJob());
  return Response.json({ accepted: true }, { status: 202 });
});
