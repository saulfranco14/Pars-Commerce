import { apiFetch } from "@/services/apiFetch";
import { createClient } from "@/lib/supabase/client";
import { STUDIO_RENDERER_VERSION } from "../constants/studio";
import type {
  StudioLocalCopyInput,
  StudioCreateInput,
  StudioGenerationInput,
  StudioSaveInput,
} from "../interfaces/api";
import type {
  StudioBrand,
  StudioDesign,
  StudioDesignDetail,
  StudioBatchRequest,
  StudioBatchResult,
  StudioIdea,
  StudioImage,
  StudioImageRequest,
  StudioJob,
  StudioPlacement,
  StudioQuote,
  StudioRunJob,
  StudioSummary,
  StudioVersion,
} from "../interfaces/studio";
import type { StudioFormat } from "../interfaces/scene";
import type { StudioCopyIdeas } from "../helpers/aiPrompt";
import type { StudioPlatformData } from "../interfaces/platform";

function billingReturnPath() {
  const url = new URL(window.location.href);
  return url.searchParams.get("return_to") ?? url.pathname + url.search;
}

const json = (value: unknown) => JSON.stringify(value);
const query = (tenantId: string, extra: Record<string, string> = {}) =>
  new URLSearchParams({ tenant_id: tenantId, ...extra }).toString();
export const studioSummaryKey = (tenantId: string) =>
  `/api/studio/summary?${query(tenantId)}`;
export async function loadStudioSummary(
  tenantId: string,
): Promise<StudioSummary> {
  return (await apiFetch(studioSummaryKey(tenantId), {
    cache: "no-store",
  })) as StudioSummary;
}
export async function createDesign(
  input: StudioCreateInput,
): Promise<StudioDesign> {
  return (await apiFetch("/api/studio/designs", {
    method: "POST",
    body: json(input),
  })) as StudioDesign;
}
export async function saveDesign(
  id: string,
  input: StudioSaveInput,
): Promise<StudioDesign> {
  return (await apiFetch(`/api/studio/designs/${id}`, {
    method: "PATCH",
    body: json(input),
  })) as StudioDesign;
}
export async function loadDesign(
  tenantId: string,
  id: string,
): Promise<StudioDesignDetail> {
  return (await apiFetch(`/api/studio/designs/${id}?${query(tenantId)}`, {
    cache: "no-store",
  })) as StudioDesignDetail;
}
export async function loadSources(
  tenantId: string,
  type: string,
  q: string,
  cursor?: string,
): Promise<{
  items: Array<{ id: string; name: string }>;
  nextCursor: string | null;
}> {
  return (await apiFetch(
    `/api/studio/sources?${query(tenantId, { type, q, ...(cursor ? { cursor } : {}) })}`,
  )) as {
    items: Array<{ id: string; name: string }>;
    nextCursor: string | null;
  };
}
export async function loadIdeas(tenantId: string): Promise<StudioIdea[]> {
  const result = (await apiFetch(`/api/studio/ideas?${query(tenantId)}`)) as {
    items: StudioIdea[];
  };
  return result.items;
}
export async function loadLibrary(
  tenantId: string,
  q: string,
  status: string,
  cursor?: string,
): Promise<{ items: StudioDesign[]; nextCursor: string | null }> {
  return (await apiFetch(
    `/api/studio/designs?${query(tenantId, { q, status, ...(cursor ? { cursor } : {}) })}`,
  )) as { items: StudioDesign[]; nextCursor: string | null };
}
export async function createVersion(
  tenantId: string,
  id: string,
  revision: number,
): Promise<StudioVersion> {
  return (await apiFetch(`/api/studio/designs/${id}/versions`, {
    method: "POST",
    body: json({ tenant_id: tenantId, revision }),
  })) as StudioVersion;
}
export async function duplicateDesign(
  tenantId: string,
  id: string,
  localCopy?: StudioLocalCopyInput,
  key = crypto.randomUUID(),
): Promise<StudioDesign> {
  return (await apiFetch(`/api/studio/designs/${id}/duplicate`, {
    method: "POST",
    body: json({
      tenant_id: tenantId,
      idempotency_key: key,
      ...(localCopy ? { local_copy: localCopy } : {}),
    }),
  })) as StudioDesign;
}
export async function loadRenders(
  tenantId: string,
  id: string,
): Promise<
  Array<{
    id: string;
    asset_id: string;
    url: string;
    format: StudioFormat;
    surface: string;
  }>
> {
  return (await apiFetch(
    `/api/studio/designs/${id}/renders?${query(tenantId)}`,
  )) as Array<{
    id: string;
    asset_id: string;
    url: string;
    format: StudioFormat;
    surface: string;
  }>;
}
export async function checkoutMembership(
  tenantId: string,
  planCode: string,
  catalogVersion: number,
): Promise<{ url: string }> {
  return (await apiFetch("/api/studio/membership/checkout", {
    method: "POST",
    body: json({
      tenant_id: tenantId,
      plan_code: planCode,
      catalog_version: catalogVersion,
      idempotency_key: crypto.randomUUID(),
      return_to: billingReturnPath(),
    }),
  })) as { url: string };
}
export async function checkoutPack(
  tenantId: string,
  packCode: string,
  catalogVersion: number,
): Promise<{ url: string }> {
  return (await apiFetch("/api/studio/packs/checkout", {
    method: "POST",
    body: json({
      tenant_id: tenantId,
      pack_code: packCode,
      catalog_version: catalogVersion,
      idempotency_key: crypto.randomUUID(),
      return_to: billingReturnPath(),
    }),
  })) as { url: string };
}
export async function cancelMembership(tenantId: string) {
  return apiFetch("/api/studio/membership/cancel", {
    method: "POST",
    body: json({ tenant_id: tenantId }),
  });
}
export async function changeMembership(
  tenantId: string,
  planCode: string,
  catalogVersion: number,
) {
  return apiFetch("/api/studio/membership/change-plan", {
    method: "POST",
    body: json({
      tenant_id: tenantId,
      plan_code: planCode,
      catalog_version: catalogVersion,
    }),
  });
}
export async function loadCreditHistory(tenantId: string): Promise<{
  ledger: Array<{
    id: string;
    reason: string;
    delta: number;
    reserved_delta: number;
    created_at: string;
  }>;
  grants: Array<{
    id: string;
    kind: string;
    remaining: number;
    reserved: number;
    expires_at: string | null;
  }>;
  orders: Array<{
    id: string;
    pack_code: string;
    status: string;
    amount_mxn: number;
    tlacos: number;
    created_at: string;
  }>;
}> {
  return (await apiFetch(`/api/studio/credits?${query(tenantId)}`)) as Awaited<
    ReturnType<typeof loadCreditHistory>
  >;
}
export async function loadPlacements(
  tenantId: string,
): Promise<StudioPlacement[]> {
  return (await apiFetch(
    `/api/studio/placements?${query(tenantId)}`,
  )) as StudioPlacement[];
}
export async function removePlacement(tenantId: string, id: string) {
  return apiFetch("/api/studio/placements", {
    method: "DELETE",
    body: json({ tenant_id: tenantId, id }),
  });
}
export async function applyPlacements(input: unknown): Promise<{
  results: Array<{ surface: string; ok: boolean; error?: string }>;
}> {
  return (await apiFetch("/api/studio/placements", {
    method: "POST",
    body: json(input),
  })) as { results: Array<{ surface: string; ok: boolean; error?: string }> };
}
export async function loadBrand(tenantId: string): Promise<StudioBrand> {
  return (await apiFetch(
    `/api/studio/brand?${query(tenantId)}`,
  )) as StudioBrand;
}
export async function loadStudioPlatform(): Promise<StudioPlatformData> {
  return (await apiFetch("/api/studio/platform")) as StudioPlatformData;
}
export async function adjustCredits(input: {
  tenant_id: string;
  amount: number;
  reason: string;
  idempotency_key: string;
}) {
  return apiFetch("/api/studio/platform/adjust", {
    method: "POST",
    body: json(input),
  });
}
export async function saveBrand(tenantId: string, brand: StudioBrand) {
  return apiFetch("/api/studio/brand", {
    method: "PATCH",
    body: json({ tenant_id: tenantId, brand }),
  });
}
export async function quoteGeneration(
  input: StudioGenerationInput,
): Promise<StudioQuote> {
  return (await apiFetch("/api/studio/ai/quote", {
    method: "POST",
    body: json(input),
  })) as StudioQuote;
}
export async function startGeneration(
  tenantId: string,
  quoteId: string,
  key: string,
): Promise<StudioJob> {
  return (await apiFetch("/api/studio/ai/generate", {
    method: "POST",
    body: json({
      tenant_id: tenantId,
      quote_id: quoteId,
      idempotency_key: key,
    }),
  })) as StudioJob;
}
export async function loadJob(
  tenantId: string,
  id: string,
): Promise<StudioJob> {
  return (await apiFetch(
    `/api/studio/jobs/${id}?${query(tenantId)}`,
  )) as StudioJob;
}
export async function loadDesignJobs(
  tenantId: string,
  designId: string,
): Promise<StudioJob[]> {
  return (await apiFetch(
    `/api/studio/jobs?${query(tenantId, { design_id: designId })}`,
  )) as StudioJob[];
}
export async function cancelJob(tenantId: string, id: string) {
  return apiFetch(`/api/studio/jobs/${id}/cancel`, {
    method: "POST",
    body: json({ tenant_id: tenantId }),
  });
}
export async function reviewVersion(
  tenantId: string,
  versionId: string,
): Promise<{
  status: string;
  findings: string[];
  recommendations: Array<{ code: string; explanation: string }>;
}> {
  return (await apiFetch("/api/studio/ai/review", {
    method: "POST",
    body: json({ tenant_id: tenantId, version_id: versionId, consent: true }),
  })) as {
    status: string;
    findings: string[];
    recommendations: Array<{ code: string; explanation: string }>;
  };
}
export async function recordShare(
  tenantId: string,
  versionId: string,
  action: string,
  target: string,
) {
  return apiFetch("/api/studio/shares", {
    method: "POST",
    body: json({
      tenant_id: tenantId,
      version_id: versionId,
      action,
      target,
      idempotency_key: crypto.randomUUID(),
    }),
  });
}

export async function uploadStudioAsset(input: {
  tenantId: string;
  designId: string;
  file: Blob;
  kind: "original" | "render" | "preview";
  versionId?: string;
  surface?: string;
  format?: StudioFormat;
}): Promise<{ assetId: string; renderId: string | null; url: string }> {
  const signed = (await apiFetch("/api/studio/assets", {
    method: "POST",
    body: json({
      tenant_id: input.tenantId,
      design_id: input.designId,
      kind: input.kind,
      mime_type: input.file.type,
      version_id: input.versionId,
      surface: input.surface ?? "social",
      format: input.format,
      renderer_version:
        input.kind === "render" ? STUDIO_RENDERER_VERSION : undefined,
    }),
  })) as { id: string; path: string; token: string };
  const client = createClient();
  const { error } = await client.storage
    .from("studio-assets")
    .uploadToSignedUrl(signed.path, signed.token, input.file, {
      contentType: input.file.type,
    });
  if (error)
    throw new Error("No pudimos subir la imagen. Tu diseño se conserva.");
  return (await apiFetch(`/api/studio/assets/${signed.id}/complete`, {
    method: "POST",
    body: json({ tenant_id: input.tenantId }),
  })) as { assetId: string; renderId: string | null; url: string };
}

export async function importSourceImage(
  tenantId: string,
  designId: string,
  index: number,
): Promise<{ assetId: string; url: string }> {
  return (await apiFetch("/api/studio/assets/import", {
    method: "POST",
    body: json({ tenant_id: tenantId, design_id: designId, index }),
  })) as { assetId: string; url: string };
}

export async function downloadStudioBlob(url: string): Promise<Blob> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("No pudimos descargar el archivo.");
  return response.blob();
}

export async function reconcileStudioOperations() {
  return apiFetch("/api/studio/platform/reconcile", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function resolveCreditReview(input: {
  tenant_id: string;
  reason: string;
  idempotency_key: string;
}) {
  return apiFetch("/api/studio/platform/resolve-review", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function generateImage(
  input: StudioImageRequest,
): Promise<StudioRunJob> {
  return (await apiFetch("/api/studio/ai/image", {
    method: "POST",
    body: json({
      tenant_id: input.tenantId,
      design_id: input.designId,
      asset_id: input.assetId,
      operation: input.operation,
      quality: input.quality,
      scene: input.scene,
      wish: input.wish,
      reference_asset_id: input.referenceAssetId,
      idempotency_key: crypto.randomUUID(),
    }),
  })) as StudioRunJob;
}
export async function runJob(
  tenantId: string,
  jobId: string,
  apply: boolean,
): Promise<StudioRunJob> {
  return (await apiFetch(`/api/studio/jobs/${jobId}/run`, {
    method: "POST",
    body: json({ tenant_id: tenantId, apply }),
  })) as StudioRunJob;
}
export async function loadPendingJobs(tenantId: string): Promise<StudioJob[]> {
  return (await apiFetch(
    `/api/studio/jobs/pending?${query(tenantId)}`,
  )) as StudioJob[];
}
export async function loadStudioImages(
  tenantId: string,
): Promise<StudioImage[]> {
  return (await apiFetch(
    `/api/studio/images?${query(tenantId)}`,
  )) as StudioImage[];
}
export async function importImage(
  tenantId: string,
  designId: string,
  assetId: string,
): Promise<{ assetId: string; url: string }> {
  return (await apiFetch("/api/studio/images/import", {
    method: "POST",
    body: json({ tenant_id: tenantId, design_id: designId, asset_id: assetId }),
  })) as { assetId: string; url: string };
}
export async function suggestCopy(
  tenantId: string,
  designId: string,
): Promise<StudioCopyIdeas> {
  return (await apiFetch("/api/studio/ai/copy", {
    method: "POST",
    body: json({ tenant_id: tenantId, design_id: designId }),
  })) as StudioCopyIdeas;
}
export async function createBatch(
  input: StudioBatchRequest,
): Promise<StudioBatchResult> {
  return (await apiFetch("/api/studio/batch", {
    method: "POST",
    body: json({
      tenant_id: input.tenantId,
      batch_key: input.batchKey,
      source_type: input.sourceType,
      items: input.items,
      mode: input.mode,
      asset_id: input.assetId,
      template: input.template,
      scene: input.scene,
      quality: input.quality,
    }),
  })) as StudioBatchResult;
}
