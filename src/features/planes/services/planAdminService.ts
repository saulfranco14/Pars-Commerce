/* eslint-disable @typescript-eslint/no-explicit-any -- offer_plans is not in the generated Supabase types yet. */
/**
 * Server-side writes for offer plans. The API route authorizes with
 * requirePermission("promotions.write") and then calls these with the admin
 * client; the plan and its items are saved in one transaction.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { nextFreeSlug, slugifyPromotionName } from "@/features/promociones/helpers/promotionSlug";
import { normalizePlanInput } from "@/features/planes/validations/planPayload";

import type { ServiceResult } from "@/features/qr/services/tablePaymentService";
import type { OfferPlanWriteInput } from "@/features/planes/interfaces/offerPlan";

type Admin = SupabaseClient;
type Loose = { from: (table: string) => any; rpc: (fn: string, args: Record<string, unknown>) => any };

async function freeSlug(db: Loose, tenantId: string, desired: string, exceptId?: string): Promise<string> {
  const base = slugifyPromotionName(desired) || "plan";
  const { data } = await db.from("offer_plans").select("id, slug").eq("tenant_id", tenantId).like("slug", `${base}%`);
  const taken = ((data ?? []) as Array<{ id: string; slug: string }>)
    .filter((row) => row.id !== exceptId)
    .map((row) => row.slug);
  return nextFreeSlug(base, taken);
}

function rpcError(message: string): ServiceResult<never> {
  if (message.includes("PLAN_NOT_FOUND")) return { ok: false, error: { code: "not_found", message: "El plan ya no existe." } };
  if (message.includes("offer_plan_items_product_id_fkey") || message.includes("offer_plan_items_product_variant_id_fkey")) {
    return { ok: false, error: { code: "validation", message: "Uno de los productos del plan ya no existe." } };
  }
  return { ok: false, error: { code: "internal", message } };
}

/** Variants are chosen per plan item; a product with variants needs one picked. */
async function checkItems(db: Loose, tenantId: string, items: Array<{ product_id: string; product_variant_id: string | null }>) {
  const ids = [...new Set(items.map((item) => item.product_id))];
  const { data } = await db.from("products").select("id, has_variants").eq("tenant_id", tenantId).is("deleted_at", null).in("id", ids);
  const products = new Map(((data ?? []) as Array<{ id: string; has_variants?: boolean | null }>).map((row) => [row.id, row]));
  for (const item of items) {
    const product = products.get(item.product_id);
    if (!product) return "Uno de los productos del plan ya no existe.";
    if (product.has_variants && !item.product_variant_id) return "Elige la presentación de los productos con variantes.";
  }
  return null;
}

export async function savePlan(
  admin: Admin,
  params: { tenantId: string; planId?: string; input: OfferPlanWriteInput },
): Promise<ServiceResult<{ id: string }>> {
  const db = admin as unknown as Loose;
  let existing: Partial<OfferPlanWriteInput> = {};

  if (params.planId) {
    const { data } = await db
      .from("offer_plans")
      .select("id, kind")
      .eq("id", params.planId)
      .eq("tenant_id", params.tenantId)
      .maybeSingle();
    if (!data) return { ok: false, error: { code: "not_found", message: "El plan ya no existe." } };
    existing = data;
  }

  const normalized = normalizePlanInput(params.input, params.planId ? "update" : "create", existing);
  if (!normalized.ok) return { ok: false, error: { code: "validation", message: normalized.message } };

  if (normalized.data.items) {
    const problem = await checkItems(db, params.tenantId, normalized.data.items);
    if (problem) return { ok: false, error: { code: "validation", message: problem } };
  }

  const fields: Record<string, unknown> = { ...normalized.data.fields, tenant_id: params.tenantId };
  if (params.planId) {
    fields.id = params.planId;
    // Shared links stay stable: the slug only changes when it is set on purpose.
    if (params.input.slug) fields.slug = await freeSlug(db, params.tenantId, params.input.slug, params.planId);
  } else {
    fields.slug = await freeSlug(db, params.tenantId, params.input.slug || String(fields.name));
  }

  const { data, error } = await db.rpc("save_offer_plan", { p_plan: fields, p_items: normalized.data.items });
  if (error) return rpcError(error.message);
  return { ok: true, data: { id: data as string } };
}

/** Archived plans leave the store; people already subscribed keep their plan. */
export async function archivePlan(admin: Admin, params: { tenantId: string; planId: string }): Promise<ServiceResult<{ id: string }>> {
  return savePlan(admin, { tenantId: params.tenantId, planId: params.planId, input: { status: "archived" } });
}

export async function getPlanTenant(admin: Admin, planId: string): Promise<string | null> {
  const { data } = await (admin as unknown as Loose).from("offer_plans").select("tenant_id").eq("id", planId).maybeSingle();
  return (data?.tenant_id as string | undefined) ?? null;
}
