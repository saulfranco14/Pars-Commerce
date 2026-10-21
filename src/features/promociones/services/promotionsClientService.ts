import { apiFetch } from "@/services/apiFetch";

import type { EditablePromotion } from "@/features/promociones/interfaces/offerWizard";
import type { PromotionWriteInput } from "@/features/promociones/interfaces/promotionAdmin";

/** One row of the promotions list (GET /api/promotions?tenant_id). */
export interface PromotionListItem {
  id: string;
  name: string;
  slug: string | null;
  type: string;
  value: number;
  status: string;
  applies_to: string | null;
  template_key: string | null;
  product_ids: string[] | null;
  subcatalog_ids: string[] | null;
  bundle_product_ids: string[] | null;
  buy_quantity: number | null;
  pay_quantity: number | null;
  quantity: number | null;
  badge_label: string | null;
  valid_from: string | null;
  valid_until: string | null;
  image_url: string | null;
  description: string | null;
  created_at: string;
}

export function promotionsListKey(tenantId: string): string {
  return `/api/promotions?tenant_id=${encodeURIComponent(tenantId)}`;
}

export async function getPromotion(promotionId: string): Promise<EditablePromotion> {
  return (await apiFetch(`/api/promotions?promotion_id=${encodeURIComponent(promotionId)}`)) as EditablePromotion;
}

export async function createPromotion(payload: PromotionWriteInput & { tenant_id: string }): Promise<{ id: string }> {
  return (await apiFetch("/api/promotions", { method: "POST", body: JSON.stringify(payload) })) as { id: string };
}

export async function updatePromotion(promotionId: string, payload: PromotionWriteInput): Promise<{ id: string }> {
  return (await apiFetch("/api/promotions", {
    method: "PATCH",
    body: JSON.stringify({ promotion_id: promotionId, ...payload }),
  })) as { id: string };
}

export async function archivePromotion(promotionId: string): Promise<void> {
  await apiFetch(`/api/promotions?promotion_id=${encodeURIComponent(promotionId)}`, { method: "DELETE" });
}

/** A paused copy the merchant can adjust before publishing. */
export async function duplicatePromotion(tenantId: string, promotionId: string): Promise<{ id: string }> {
  const source = await getPromotion(promotionId);
  const items = (source.promotion_items ?? []).map((item) => ({ product_id: item.product_id, quantity: Number(item.quantity) }));
  return createPromotion({
    tenant_id: tenantId,
    name: `${source.name} (copia)`.slice(0, 100),
    type: source.type,
    value: Number(source.value),
    status: "draft",
    template_key: source.template_key,
    applies_to: source.applies_to,
    product_ids: source.product_ids ?? [],
    subcatalog_ids: source.subcatalog_ids ?? [],
    bundle_product_ids: source.bundle_product_ids ?? [],
    items: items.length > 0 ? items : undefined,
    buy_quantity: source.buy_quantity,
    pay_quantity: source.pay_quantity,
    badge_label: source.badge_label,
    description: source.description,
    image_url: source.image_url,
    valid_from: source.valid_from,
    valid_until: source.valid_until,
  });
}
