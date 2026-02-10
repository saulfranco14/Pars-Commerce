import type { CreateOrderItemPayload, OrderItemCreated } from "@/types/orderItems";
import { apiFetch } from "@/services/apiFetch";

export async function create(
  payload: CreateOrderItemPayload
): Promise<OrderItemCreated> {
  const data = await apiFetch("/api/order-items", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data as OrderItemCreated;
}

export async function remove(itemId: string): Promise<void> {
  await apiFetch(`/api/order-items?item_id=${encodeURIComponent(itemId)}`, {
    method: "DELETE",
  });
}
