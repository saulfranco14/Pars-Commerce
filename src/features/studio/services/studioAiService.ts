import "server-only";
import { z } from "zod";
import { requireStudioAccess } from "./studioAccessService";
import { requireStudioData, StudioError } from "./studioErrors";
import { studioFlags } from "./studioFlags";
import { generationSchema, uuidSchema } from "../validations/studioSchemas";
import { buildStudioImagePrompt } from "../helpers/aiPrompt";
import { studioGeminiKey, studioModelFor } from "./studioGeminiImage";
import type { StudioDb } from "./studioDb";
import type { StudioJob } from "../interfaces/studio";

function hasProvider(provider: string): boolean {
  return provider === "gemini"
    ? Boolean(studioGeminiKey())
    : provider === "openai"
      ? Boolean(process.env.OPENAI_API_KEY)
      : Boolean(process.env.BFL_API_KEY);
}

type GenerationInput = z.infer<typeof generationSchema>;

/** Prices one generation and freezes its route; shared by the editor and batches. */
export async function createStudioQuote(
  db: StudioDb,
  userId: string,
  input: GenerationInput,
) {
  const design = requireStudioData(
    await db
      .from("studio_designs")
      .select("source_snapshot")
      .eq("tenant_id", input.tenant_id)
      .eq("id", input.design_id)
      .single(),
  );
  const assetIds = [input.asset_id, input.reference_asset_id].filter(
    (id): id is string => Boolean(id),
  );
  const assets = requireStudioData(
    await db
      .from("studio_assets")
      .select("id,width,height")
      .eq("tenant_id", input.tenant_id)
      .eq("design_id", input.design_id)
      .eq("status", "ready")
      .in("id", assetIds),
  );
  if (assets.length !== new Set(assetIds).size)
    throw new StudioError("ASSET_NOT_READY");
  const routes = requireStudioData(
    await db
      .from("studio_ai_routes")
      .select("*")
      .eq("operation", input.operation)
      .eq("quality", input.quality)
      .eq("is_active", true)
      .order("priority")
      .order("estimated_cost_usd"),
  );
  const available = routes.filter(
    (r) =>
      hasProvider(r.provider) &&
      studioModelFor(r.model_env) &&
      Number(r.estimated_cost_usd) > 0,
  );
  const route = available[0];
  if (!route) {
    console.error("[studio] no usable AI route", {
      operation: input.operation,
      quality: input.quality,
      activeRoutes: routes.length,
      geminiKey: Boolean(studioGeminiKey()),
      models: routes.map((r) => [r.model_env, studioModelFor(r.model_env)]),
    });
    throw new StudioError(
      "NOT_CONFIGURED",
      "La IA de imágenes todavía no está activa. Avísale a soporte de Tlaco.",
    );
  }
  const snapshot = available
    .filter((r) => r.tlacos === route.tlacos)
    .map((r) => ({
      id: r.id,
      provider: r.provider,
      model: studioModelFor(r.model_env)!,
      estimated_cost_usd: Number(r.estimated_cost_usd),
      config_version: r.config_version,
    }));
  const source = design.source_snapshot as {
    type?: string;
    kind?: string;
    name?: string;
    businessName?: string;
  };
  if (
    input.scene === "illustrate" &&
    source.type !== "custom" &&
    source.kind !== "service"
  )
    throw new StudioError(
      "VALIDATION",
      "La escena con IA es solo para servicios. Para un producto, usa tu foto.",
    );
  const instructions = buildStudioImagePrompt({
    operation: input.operation,
    scene: input.scene,
    productName: source.name ?? "",
    businessName: source.businessName,
    wish: input.wish,
    withReference: Boolean(input.reference_asset_id),
  });
  const budget = Math.max(...snapshot.map((r) => r.estimated_cost_usd)) * 3;
  return requireStudioData(
    await db
      .from("studio_ai_quotes")
      .insert({
        tenant_id: input.tenant_id,
        design_id: input.design_id,
        asset_id: input.asset_id,
        reference_asset_id: input.reference_asset_id ?? null,
        requested_by: userId,
        route_id: route.id,
        route_version: route.config_version,
        route_snapshot: snapshot,
        budget_usd: budget,
        cost: route.tlacos,
        operation: input.operation,
        quality: input.quality,
        instructions,
      })
      .select("id,cost,expires_at,quality")
      .single(),
  );
}

export async function quoteStudioGeneration(raw: unknown) {
  const input = generationSchema.parse(raw);
  const { db, user } = await requireStudioAccess(
    input.tenant_id,
    "studio.create",
    "create",
  );
  if (!studioFlags().ai) throw new StudioError("NOT_CONFIGURED");
  const limited = requireStudioData(
    await db.rpc("studio_rate_limit", {
      p_scope: `quote:${input.tenant_id}:${user.id}`,
      p_limit: 10,
    }),
  );
  if (!limited) throw new StudioError("RATE_LIMIT");
  const quote = await createStudioQuote(db, user.id, input);
  return {
    id: quote.id,
    cost: quote.cost,
    expiresAt: quote.expires_at,
    quality: quote.quality,
  };
}

export async function startStudioGeneration(raw: unknown) {
  const input = z
    .object({
      tenant_id: uuidSchema,
      quote_id: uuidSchema,
      idempotency_key: uuidSchema,
    })
    .parse(raw);
  const { db, user } = await requireStudioAccess(
    input.tenant_id,
    "studio.create",
    "create",
  );
  if (!studioFlags().ai) throw new StudioError("NOT_CONFIGURED");
  requireStudioData(
    await db
      .from("studio_ai_quotes")
      .select("id")
      .eq("tenant_id", input.tenant_id)
      .eq("id", input.quote_id)
      .eq("requested_by", user.id)
      .single(),
  );
  const job = requireStudioData(
    await db.rpc("studio_enqueue_generation", {
      p_quote_id: input.quote_id,
      p_actor_id: user.id,
      p_idempotency_key: input.idempotency_key,
    }),
  ) as unknown as StudioJob;
  return {
    id: job.id,
    design_id: job.design_id,
    status: job.status,
    operation: job.operation,
    reserved_tlacos: job.reserved_tlacos,
    result_asset_id: job.result_asset_id,
    error_code: job.error_code,
    created_at: job.created_at,
  };
}

export async function getStudioJob(tenantId: string, id: string) {
  const { db } = await requireStudioAccess(tenantId);
  return requireStudioData(
    await db
      .from("studio_ai_jobs")
      .select(
        "id,design_id,status,operation,reserved_tlacos,result_asset_id,error_code,created_at",
      )
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .single(),
  );
}

export async function cancelStudioJob(tenantId: string, id: string) {
  const { db, user } = await requireStudioAccess(tenantId, "studio.create");
  return requireStudioData(
    await db.rpc("studio_cancel_job", {
      p_tenant_id: tenantId,
      p_actor_id: user.id,
      p_job_id: id,
    }),
  );
}

export async function reviewStudioVersion(raw: unknown) {
  const input = z
    .object({
      tenant_id: uuidSchema,
      version_id: uuidSchema,
      consent: z.literal(true),
    })
    .parse(raw);
  const { db, user } = await requireStudioAccess(
    input.tenant_id,
    "studio.create",
    "create",
  );
  if (!studioFlags().ai) throw new StudioError("NOT_CONFIGURED");
  const routes = requireStudioData(
    await db
      .from("studio_ai_routes")
      .select("*")
      .eq("operation", "review")
      .eq("is_active", true)
      .order("priority"),
  );
  const route = routes.find(
    (r) =>
      hasProvider(r.provider) &&
      process.env[r.model_env] &&
      Number(r.estimated_cost_usd) > 0,
  );
  if (!route) throw new StudioError("NOT_CONFIGURED");
  const version = requireStudioData(
    await db
      .from("studio_design_versions")
      .select("*")
      .eq("tenant_id", input.tenant_id)
      .eq("id", input.version_id)
      .single(),
  );
  const render = requireStudioData(
    await db
      .from("studio_renders")
      .select("asset_id")
      .eq("tenant_id", input.tenant_id)
      .eq("design_version_id", version.id)
      .eq("surface", "social")
      .order("renderer_version", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
  );
  const evaluator = `${route.provider}:${process.env[route.model_env]}:${route.config_version}`;
  const review = requireStudioData(
    await db.rpc("studio_claim_review", {
      p_tenant_id: input.tenant_id,
      p_actor_id: user.id,
      p_version_id: input.version_id,
      p_evaluator: evaluator,
      p_route_id: route.id,
    }),
  ) as { id: string; cached: boolean; status: string };
  if (review.cached)
    return requireStudioData(
      await db
        .from("studio_ai_reviews")
        .select("id,status,findings,recommendations")
        .eq("id", review.id)
        .eq("tenant_id", input.tenant_id)
        .single(),
    );
  try {
    const url = process.env.STUDIO_WORKER_URL,
      secret = process.env.STUDIO_WORKER_SECRET;
    if (!url || !secret) throw new StudioError("NOT_CONFIGURED");
    const target = new URL(url),
      supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).host;
    if (target.host !== supabaseHost || target.protocol !== "https:")
      throw new StudioError("NOT_CONFIGURED");
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-studio-worker-secret": secret,
      },
      body: JSON.stringify({
        review_id: review.id,
        asset_id: render.asset_id,
        route_id: route.id,
      }),
      signal: AbortSignal.timeout(35_000),
    });
    if (!response.ok)
      throw new StudioError(
        "REVIEW_FAILED",
        "No pudimos completar el diagnóstico. Puedes intentarlo otra vez.",
        502,
      );
    return requireStudioData(
      await db
        .from("studio_ai_reviews")
        .select("id,status,findings,recommendations")
        .eq("id", review.id)
        .eq("tenant_id", input.tenant_id)
        .single(),
    );
  } catch (error) {
    await db
      .from("studio_ai_reviews")
      .update({ status: "failed" })
      .eq("id", review.id)
      .eq("tenant_id", input.tenant_id);
    throw error;
  }
}
