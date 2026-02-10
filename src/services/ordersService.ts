import type {
  OrderListItem,
  CreateOrderPayload,
  UpdateOrderPayload,
} from "@/types/orders";
import { apiFetch } from "@/services/apiFetch";

export interface ListOrdersParams {
  tenant_id: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}

export async function list(params: ListOrdersParams): Promise<OrderListItem[]> {
  const search = new URLSearchParams({ tenant_id: params.tenant_id });
  if (params.status) search.set("status", params.status);
  if (params.date_from) search.set("date_from", params.date_from);
  if (params.date_to) search.set("date_to", params.date_to);
  const data = await apiFetch(`/api/orders?${search}`);
  return Array.isArray(data) ? (data as OrderListItem[]) : [];
}

export async function getById(orderId: string): Promise<unknown> {
  const data = await apiFetch(
    `/api/orders?order_id=${encodeURIComponent(orderId)}`
  );
  return data;
}

export async function create(payload: CreateOrderPayload): Promise<unknown> {
  const data = await apiFetch("/api/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data;
}

export async function update(
  orderId: string,
  payload: UpdateOrderPayload
): Promise<unknown> {
  const data = await apiFetch("/api/orders", {
    method: "PATCH",
    body: JSON.stringify({ order_id: orderId, ...payload }),
  });
  return data;
}
