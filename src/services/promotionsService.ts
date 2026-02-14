import { apiFetch } from "@/services/apiFetch";

export interface Promotion {
  id: string;
  tenant_id: string;
  name: string;
  type: string;
  value: number;
  min_amount: number | null;
  product_ids: string[] | null;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string;
}

export interface CreatePromotionPayload {
  tenant_id: string;
  name: string;
  type: "percentage" | "fixed_amount";
  value: number;
  min_amount?: number;
  product_ids?: string[];
  valid_from?: string;
  valid_until?: string;
}

export async function list(
  tenantId: string,
  opts?: { active_only?: boolean }
): Promise<Promotion[]> {
  const params = new URLSearchParams({ tenant_id: tenantId });
  if (opts?.active_only) params.set("active_only", "true");
  const data = await apiFetch(`/api/promotions?${params}`);
  return Array.isArray(data) ? (data as Promotion[]) : [];
}

export async function getById(promotionId: string): Promise<Promotion> {
  const data = await apiFetch(
    `/api/promotions?promotion_id=${encodeURIComponent(promotionId)}`
  );
  return data as Promotion;
}

export async function create(payload: CreatePromotionPayload): Promise<Promotion> {
  const data = await apiFetch("/api/promotions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data as Promotion;
}

export async function update(
  promotionId: string,
  updates: Partial<CreatePromotionPayload>
): Promise<Promotion> {
  const data = await apiFetch("/api/promotions", {
    method: "PATCH",
    body: JSON.stringify({
      promotion_id: promotionId,
      ...updates,
    }),
  });
  return data as Promotion;
}

export async function remove(promotionId: string): Promise<void> {
  await apiFetch(
    `/api/promotions?promotion_id=${encodeURIComponent(promotionId)}`,
    { method: "DELETE" }
  );
}
