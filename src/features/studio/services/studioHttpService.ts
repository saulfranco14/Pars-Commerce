import "server-only";
import { NextResponse } from "next/server";
import { getPublicAppUrl } from "@/lib/env/appUrl";
import { z } from "zod";
import { studioFlags } from "./studioFlags";
import { getStudioCatalog } from "./studioCatalogService";
import { getStudioSummary } from "./studioSummaryService";
import { requireStudioAccess } from "./studioAccessService";
import { StudioError, requireStudioData, studioResult } from "./studioErrors";
import {
  createStudioDesign,
  createStudioVersion,
  duplicateStudioDesign,
  getStudioDesign,
  listStudioDesigns,
  requireStudioSourcePermission,
  saveStudioDesign,
} from "./studioDesignService";
import { listStudioSources } from "./studioSourceService";
import { listStudioIdeas } from "./studioIdeaService";
import {
  generateStudioImageNow,
  importStudioImage,
  listPendingStudioJobs,
  listStudioImages,
  runStudioJob,
} from "./studioImageService";
import { suggestStudioCopy } from "./studioCopyService";
import { createStudioBatch } from "./studioBatchService";
import { verifyStudioCreditOrders } from "./studioReconcileService";
import {
  completeStudioAsset,
  getStudioAssetFile,
  initiateStudioAsset,
  importStudioSourceImage,
} from "./studioAssetService";
import {
  cancelStudioJob,
  getStudioJob,
  quoteStudioGeneration,
  reviewStudioVersion,
  startStudioGeneration,
} from "./studioAiService";
import {
  applyStudioPlacements,
  listStudioPlacements,
  removeStudioPlacement,
} from "./studioPlacementService";
import {
  cancelStudioMembership,
  changeStudioPlan,
  createStudioCheckout,
  createStudioPackCheckout,
} from "./studioBillingService";
import { brandSchema, uuidSchema } from "../validations/studioSchemas";
import {
  adjustStudioCredits,
  getStudioPlatform,
  reconcileStudioPlatform,
  resolveStudioCreditReview,
} from "./studioPlatformService";
import type { StudioSourceType } from "../interfaces/studio";

async function readBody(request: Request): Promise<Record<string, unknown>> {
  if (Number(request.headers.get("content-length") ?? 0) > 512_000)
    throw new StudioError("VALIDATION", "La composición es demasiado grande.");
  const reader = request.body?.getReader();
  if (!reader) return {};
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 512_000) {
      await reader.cancel();
      throw new StudioError(
        "VALIDATION",
        "La composición es demasiado grande.",
      );
    }
    chunks.push(value);
  }
  try {
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const c of chunks) {
      bytes.set(c, offset);
      offset += c.length;
    }
    const value = JSON.parse(new TextDecoder().decode(bytes));
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error();
    return value;
  } catch {
    throw new StudioError("VALIDATION", "Envía datos JSON válidos.");
  }
}

async function dispatchStudioRequest(request: Request, path: string[]) {
  const url = new URL(request.url),
    method = request.method;
  if (["POST", "PATCH", "DELETE"].includes(method)) {
    const origin = request.headers.get("origin");
    if (
      origin &&
      origin !== url.origin &&
      origin !== new URL(getPublicAppUrl()).origin
    )
      throw new StudioError("FORBIDDEN");
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      throw new StudioError("VALIDATION", "Envía datos JSON válidos.");
  }
  const body = ["POST", "PATCH", "DELETE"].includes(method)
    ? await readBody(request)
    : {};
  if (path[0] === "platform" && method === "GET") return getStudioPlatform();
  if (
    path[0] === "platform" &&
    path[1] === "resolve-review" &&
    method === "POST"
  )
    return resolveStudioCreditReview(body);
  if (path[0] === "platform" && path[1] === "reconcile" && method === "POST")
    return reconcileStudioPlatform();
  if (path[0] === "platform" && path[1] === "adjust" && method === "POST")
    return adjustStudioCredits(body);
  if (path[0] === "catalog" && method === "GET") {
    if (!studioFlags().public) throw new StudioError("NOT_FOUND");
    return getStudioCatalog();
  }
  const tenantId = uuidSchema.parse(
    body.tenant_id ?? url.searchParams.get("tenant_id"),
  );
  const id = path[1] ? uuidSchema.safeParse(path[1]) : null;
  if (path[0] === "summary" && method === "GET")
    return getStudioSummary(tenantId);
  if (path[0] === "ideas" && method === "GET") {
    const { db, user } = await requireStudioAccess(tenantId, "studio.create");
    return { items: await listStudioIdeas(db, user.id, tenantId) };
  }
  if (path[0] === "sources" && method === "GET") {
    const type = z
      .enum(["product", "promotion", "subscription_plan", "custom"])
      .parse(url.searchParams.get("type") ?? "product");
    const { db, user } = await requireStudioAccess(tenantId, "studio.create");
    await requireStudioSourcePermission(
      user.id,
      tenantId,
      type as StudioSourceType,
    );
    return listStudioSources(
      db,
      tenantId,
      type,
      url.searchParams.get("q") ?? "",
      url.searchParams.has("cursor")
        ? uuidSchema.parse(url.searchParams.get("cursor"))
        : null,
    );
  }
  if (path[0] === "designs") {
    if (path.length === 1 && method === "GET")
      return listStudioDesigns(
        tenantId,
        url.searchParams.get("q") ?? "",
        url.searchParams.get("status"),
        url.searchParams.get("cursor"),
      );
    if (path.length === 1 && method === "POST") return createStudioDesign(body);
    const designId = uuidSchema.parse(path[1]);
    if (path.length === 2 && method === "GET")
      return getStudioDesign(tenantId, designId);
    if (path.length === 2 && method === "PATCH")
      return saveStudioDesign(designId, body);
    if (path[2] === "versions" && method === "POST")
      return createStudioVersion(
        tenantId,
        designId,
        z.number().int().positive().parse(body.revision),
      );
    if (path[2] === "duplicate" && method === "POST")
      return duplicateStudioDesign(
        tenantId,
        designId,
        uuidSchema.parse(body.idempotency_key),
        body.local_copy,
      );
    if (path[2] === "renders" && method === "GET") {
      const { db } = await requireStudioAccess(tenantId);
      const rows = requireStudioData(
        await db
          .from("studio_renders")
          .select("*")
          .eq("tenant_id", tenantId)
          .eq("design_id", designId)
          .order("created_at", { ascending: false })
          .limit(40),
      );
      return rows.map((r) => ({
        ...r,
        url: `/api/studio/assets/${r.asset_id}/file?tenant_id=${tenantId}`,
      }));
    }
  }
  if (path[0] === "assets") {
    if (path.length === 1 && method === "POST")
      return initiateStudioAsset(body);
    if (path[1] === "import" && method === "POST")
      return importStudioSourceImage(
        tenantId,
        uuidSchema.parse(body.design_id),
        z.number().int().min(0).max(20).parse(body.index),
      );
    if (id?.success && path[2] === "complete" && method === "POST")
      return completeStudioAsset(tenantId, id.data);
    if (id?.success && path[2] === "file" && method === "GET")
      return getStudioAssetFile(tenantId, id.data);
  }
  if (path[0] === "ai" && method === "POST") {
    if (path[1] === "quote") return quoteStudioGeneration(body);
    if (path[1] === "generate") return startStudioGeneration(body);
    if (path[1] === "image") return generateStudioImageNow(body);
    if (path[1] === "copy") return suggestStudioCopy(body);
    if (path[1] === "review") return reviewStudioVersion(body);
  }
  if (path[0] === "images") {
    if (path.length === 1 && method === "GET")
      return listStudioImages(tenantId);
    if (path[1] === "import" && method === "POST")
      return importStudioImage(body);
  }
  if (path[0] === "batch" && method === "POST") return createStudioBatch(body);
  if (path[0] === "jobs" && path[1] === "pending" && method === "GET")
    return listPendingStudioJobs(tenantId);
  if (
    path[0] === "jobs" &&
    id?.success &&
    path[2] === "run" &&
    method === "POST"
  )
    return runStudioJob({ ...body, job_id: id.data });
  if (path[0] === "jobs" && path.length === 1 && method === "GET") {
    const { db } = await requireStudioAccess(tenantId);
    return requireStudioData(
      await db
        .from("studio_ai_jobs")
        .select(
          "id,design_id,status,operation,reserved_tlacos,result_asset_id,error_code,created_at",
        )
        .eq("tenant_id", tenantId)
        .eq("design_id", uuidSchema.parse(url.searchParams.get("design_id")))
        .order("created_at", { ascending: false })
        .limit(20),
    );
  }
  if (path[0] === "jobs" && id?.success) {
    if (method === "GET") return getStudioJob(tenantId, id.data);
    if (method === "POST" && path[2] === "cancel")
      return cancelStudioJob(tenantId, id.data);
  }
  if (path[0] === "placements") {
    if (method === "GET") return listStudioPlacements(tenantId);
    if (method === "POST") return applyStudioPlacements(body);
    if (method === "DELETE")
      return removeStudioPlacement(tenantId, uuidSchema.parse(body.id));
  }
  if (path[0] === "membership") {
    if (method === "GET") {
      const access = await requireStudioAccess(tenantId);
      return { membership: access.membership };
    }
    if (method === "POST" && path[1] === "checkout")
      return createStudioCheckout(body);
    if (method === "POST" && path[1] === "cancel")
      return cancelStudioMembership(tenantId);
    if (method === "POST" && path[1] === "change-plan")
      return changeStudioPlan(body);
  }
  if (path[0] === "packs" && path[1] === "verify" && method === "POST")
    return verifyStudioCreditOrders(tenantId);
  if (path[0] === "packs" && path[1] === "checkout" && method === "POST")
    return createStudioPackCheckout(body);
  if (path[0] === "credits" && method === "GET") {
    const { db } = await requireStudioAccess(tenantId, "studio.manage");
    const [ledger, grants, orders] = await Promise.all([
      db
        .from("studio_credit_ledger")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(100),
      db
        .from("studio_credit_grants")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(100),
      db
        .from("studio_credit_orders")
        .select("id,pack_code,status,amount_mxn,tlacos,created_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(30),
    ]);
    return {
      ledger: requireStudioData(ledger),
      grants: requireStudioData(grants),
      orders: requireStudioData(orders),
    };
  }
  if (path[0] === "brand") {
    const { db } = await requireStudioAccess(
      tenantId,
      method === "GET" ? "studio.read" : "studio.manage",
      method !== "GET",
    );
    if (method === "GET") {
      const { data, error } = await db
        .from("tenant_studio_brand_settings")
        .select("colors,font,default_format")
        .eq("tenant_id", tenantId)
        .maybeSingle();
      if (error) throw new StudioError("INTERNAL");
      return (
        data ?? {
          colors: ["#3483fa", "#172033", "#ffffff"],
          font: "Arial",
          default_format: "square",
        }
      );
    }
    if (method === "PATCH")
      return requireStudioData(
        await db
          .from("tenant_studio_brand_settings")
          .upsert({
            tenant_id: tenantId,
            ...brandSchema.parse(body.brand),
            updated_at: new Date().toISOString(),
          })
          .select("colors,font,default_format")
          .single(),
      );
  }
  if (path[0] === "shares" && method === "POST") {
    const { db, user } = await requireStudioAccess(tenantId);
    const input = z
      .object({
        version_id: uuidSchema,
        target: z.string().max(40),
        action: z.enum([
          "exported",
          "copy_text",
          "share_sheet_opened",
          "share_sheet_completed",
          "share_sheet_cancelled",
          "whatsapp_opened",
        ]),
        idempotency_key: uuidSchema,
      })
      .parse(body);
    const version = requireStudioData(
      await db
        .from("studio_design_versions")
        .select("design_id")
        .eq("tenant_id", tenantId)
        .eq("id", input.version_id)
        .single(),
    );
    const event = await db.from("studio_share_events").upsert(
      {
        tenant_id: tenantId,
        design_id: version.design_id,
        design_version_id: input.version_id,
        actor_id: user.id,
        target: input.target,
        action: input.action,
        idempotency_key: input.idempotency_key,
      },
      { onConflict: "tenant_id,idempotency_key", ignoreDuplicates: true },
    );
    if (event.error) throw new StudioError("INTERNAL");
    return { recorded: true };
  }
  throw new StudioError("NOT_FOUND");
}

export function executeStudioRequest(request: Request, path: string[]) {
  return studioResult(() => dispatchStudioRequest(request, path));
}

export async function handleStudioRequest(
  request: Request,
  path: string[],
): Promise<Response> {
  const result = await executeStudioRequest(request, path);
  const headers = {
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex",
  };
  if (!result.ok)
    return NextResponse.json(
      { error: result.error.message, code: result.error.studioCode },
      { status: result.error.status, headers },
    );
  if (result.data instanceof Response) return result.data;
  return NextResponse.json(result.data, {
    status:
      request.method === "POST" && path.join("/") === "ai/generate" ? 202 : 200,
    headers,
  });
}
