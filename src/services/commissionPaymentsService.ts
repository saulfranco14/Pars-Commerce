import type { CommissionPayment } from "@/types/sales";
import { apiFetch } from "@/services/apiFetch";

export interface ListCommissionPaymentsParams {
  tenant_id: string;
  user_id?: string;
  status?: string;
  period_start?: string;
  period_end?: string;
}

export async function list(
  params: ListCommissionPaymentsParams
): Promise<CommissionPayment[]> {
  const search = new URLSearchParams({ tenant_id: params.tenant_id });
  if (params.user_id) search.set("user_id", params.user_id);
  if (params.status) search.set("status", params.status);
  if (params.period_start) search.set("period_start", params.period_start);
  if (params.period_end) search.set("period_end", params.period_end);
  const data = await apiFetch(`/api/commission-payments?${search}`);
  return Array.isArray(data) ? (data as CommissionPayment[]) : [];
}

export interface CreateCommissionPaymentPayload {
  tenant_id: string;
  user_id: string;
  period_type: string;
  period_start: string;
  period_end: string;
}

export async function create(
  payload: CreateCommissionPaymentPayload
): Promise<unknown> {
  const data = await apiFetch("/api/commission-payments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data;
}

export async function update(
  paymentId: string,
  payload: {
    payment_status?: string;
    payment_notes?: string;
    commission_amount?: number;
  }
): Promise<unknown> {
  const data = await apiFetch("/api/commission-payments", {
    method: "PATCH",
    body: JSON.stringify({ payment_id: paymentId, ...payload }),
  });
  return data;
}
