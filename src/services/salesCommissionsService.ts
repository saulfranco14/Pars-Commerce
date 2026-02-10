import type { SalesCommission } from "@/types/sales";
import { apiFetch } from "@/services/apiFetch";

export interface ListSalesCommissionsParams {
  tenant_id: string;
  user_id?: string;
  is_paid?: string;
  date_from?: string;
  date_to?: string;
}

export async function list(
  params: ListSalesCommissionsParams
): Promise<SalesCommission[]> {
  const search = new URLSearchParams({ tenant_id: params.tenant_id });
  if (params.user_id) search.set("user_id", params.user_id);
  if (params.is_paid) search.set("is_paid", params.is_paid);
  if (params.date_from) search.set("date_from", params.date_from);
  if (params.date_to) search.set("date_to", params.date_to);
  const data = await apiFetch(`/api/sales-commissions?${search}`);
  return Array.isArray(data) ? (data as SalesCommission[]) : [];
}

export async function update(
  commissionId: string,
  payload: { is_paid?: boolean; commission_amount?: number }
): Promise<unknown> {
  const data = await apiFetch("/api/sales-commissions", {
    method: "PATCH",
    body: JSON.stringify({ commission_id: commissionId, ...payload }),
  });
  return data;
}
