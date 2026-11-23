import "server-only";
import { z } from "zod";
import { requireStudioAccess } from "./studioAccessService";
import { requireStudioData, StudioError } from "./studioErrors";
import { studioFlags } from "./studioFlags";
import { generationSchema, uuidSchema } from "../validations/studioSchemas";
import type { StudioJob } from "../interfaces/studio";

function hasProvider(provider: string): boolean {
  return provider === "gemini"
    ? Boolean(
        process.env.STUDIO_GEMINI_API_KEY ??
          process.env.IA_GEMINI ??
          process.env.GEMINI_API_KEY,
      )
    : provider === "openai"
      ? Boolean(process.env.OPENAI_API_KEY)
      : Boolean(process.env.BFL_API_KEY);
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
  const asset = requireStudioData(
    await db
      .from("studio_assets")
      .select("id,width,height")
      .eq("tenant_id", input.tenant_id)
      .eq("design_id", input.design_id)
      .eq("id", input.asset_id)
      .eq("status", "ready")
      .single(),
  );
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
      process.env[r.model_env] &&
      Number(r.estimated_cost_usd) > 0 &&
      (r.provider !== "flux" ||
        Boolean(
          asset.width &&
            asset.height &&
            asset.width * asset.height <= 20_000_000,
        )),
  );
  const route = available[0];
  if (!route || Number(route.estimated_cost_usd) <= 0)
    throw new StudioError(
      "NOT_CONFIGURED",
      "La generación se habilitará después de configurar y evaluar el proveedor.",
    );
  const snapshot = available
    .filter((r) => r.tlacos === route.tlacos)
    .map((r) => ({
      id: r.id,
      provider: r.provider,
      model: process.env[r.model_env]!,
      estimated_cost_usd: Number(r.estimated_cost_usd),
      config_version: r.config_version,
    }));
  const budget = Math.max(...snapshot.map((r) => r.estimated_cost_usd)) * 3;
  const quote = requireStudioData(
    await db
      .from("studio_ai_quotes")
      .insert({
        tenant_id: input.tenant_id,
        design_id: input.design_id,
        asset_id: input.asset_id,
        requested_by: user.id,
        route_id: route.id,
        route_version: route.config_version,
        route_snapshot: snapshot,
        budget_usd: budget,
        cost: route.tlacos,
        operation: input.operation,
        quality: input.quality,
        instructions: input.instructions,
      })
      .select("id,cost,expires_at,quality")
      .single(),
  );
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
