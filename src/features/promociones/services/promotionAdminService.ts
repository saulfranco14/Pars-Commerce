/* eslint-disable @typescript-eslint/no-explicit-any -- save_promotion is not in the generated Supabase types yet. */
/**
 * Server-side writes for promotions. The API route authorizes with
 * requirePermission("promotions.write") and then calls these with the admin
 * client; the promotion and its pack items are saved in one transaction.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { nextFreeSlug, slugifyPromotionName } from "@/features/promociones/helpers/promotionSlug";
import { normalizePromotionInput } from "@/features/promociones/validations/promotionPayload";

import type { ServiceResult } from "@/features/qr/services/tablePaymentService";
import type { PromotionWriteInput } from "@/features/promociones/interfaces/promotionAdmin";

type Admin = SupabaseClient;
type Loose = { from: (table: string) => any; rpc: (fn: string, args: Record<string, unknown>) => any };

const EXISTING_COLUMNS = "id, tenant_id, slug, type, value, buy_quantity, pay_quantity, valid_from, valid_until";

async function freeSlug(db: Loose, tenantId: string, desired: string, exceptId?: string): Promise<string> {
  const base = slugifyPromotionName(desired);
  const { data } = await db
    .from("promotions")
    .select("id, slug")
    .eq("tenant_id", tenantId)
    .like("slug", `${base || "promocion"}%`);
  const taken = ((data ?? []) as Array<{ id: string; slug: string | null }>)
    .filter((row) => row.id !== exceptId && row.slug)
    .map((row) => row.slug as string);
  return nextFreeSlug(base, taken);
}

function rpcError(message: string): ServiceResult<never> {
  if (message.includes("PROMOTION_NOT_FOUND")) return { ok: false, error: { code: "not_found", message: "La promoción ya no existe." } };
  if (message.includes("promotion_items_product_id_fkey")) {
    return { ok: false, error: { code: "validation", message: "Uno de los productos del paquete ya no existe." } };
  }
  return { ok: false, error: { code: "internal", message } };
}

export async function savePromotion(
  admin: Admin,
  params: { tenantId: string; promotionId?: string; input: PromotionWriteInput },
): Promise<ServiceResult<{ id: string }>> {
  const db = admin as unknown as Loose;
  let existing: Partial<PromotionWriteInput> & { id?: string; slug?: string | null } = {};

  if (params.promotionId) {
    const { data } = await db
      .from("promotions")
      .select(EXISTING_COLUMNS)
      .eq("id", params.promotionId)
      .eq("tenant_id", params.tenantId)
      .maybeSingle();
    if (!data) return { ok: false, error: { code: "not_found", message: "La promoción ya no existe." } };
    existing = data;
  }

  const normalized = normalizePromotionInput(params.input, params.promotionId ? "update" : "create", existing);
  if (!normalized.ok) return { ok: false, error: { code: "validation", message: normalized.message } };

  const fields: Record<string, unknown> = { ...normalized.data.fields, tenant_id: params.tenantId };
  if (params.promotionId) {
    fields.id = params.promotionId;
    // Keep shared links stable: the slug only changes when it is set on purpose.
    if (params.input.slug) fields.slug = await freeSlug(db, params.tenantId, params.input.slug, params.promotionId);
  } else {
    fields.slug = await freeSlug(db, params.tenantId, params.input.slug || String(fields.name));
  }

  const { data, error } = await db.rpc("save_promotion", {
    p_promotion: fields,
    p_items: normalized.data.items,
  });
  if (error) return rpcError(error.message);
  return { ok: true, data: { id: data as string } };
}

/** Archived promotions leave the store and the list, but past orders keep their link. */
export async function archivePromotion(
  admin: Admin,
  params: { tenantId: string; promotionId: string },
): Promise<ServiceResult<{ id: string }>> {
  return savePromotion(admin, {
    tenantId: params.tenantId,
    promotionId: params.promotionId,
    input: { status: "archived" },
  });
}

export async function getPromotionTenant(admin: Admin, promotionId: string): Promise<string | null> {
  const { data } = await (admin as unknown as Loose)
    .from("promotions")
    .select("tenant_id")
    .eq("id", promotionId)
    .maybeSingle();
  return (data?.tenant_id as string | undefined) ?? null;
}
