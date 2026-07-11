/**
 * Client-side wrapper for the staff-initiated order endpoint. Dashboard hooks
 * call this instead of hand-crafting fetch. Authenticated dashboard client.
 */

import { apiFetch } from "@/services/apiFetch";

import type { RequestedItem } from "@/features/qr/helpers/buildOrderItemRows";

export interface CreateStaffOrderResponse {
  success: boolean;
  order_id: string;
  qr_token: string | null;
  total: number;
  linked_to_table: boolean;
}

export async function createStaffOrder(payload: {
  tenantId: string;
  items: RequestedItem[];
  customerName?: string;
  customerPhone?: string;
  tableOrderId?: string;
}): Promise<CreateStaffOrderResponse> {
  return apiFetch("/api/qr/staff-order", {
    method: "POST",
    body: JSON.stringify({
      tenant_id: payload.tenantId,
      items: payload.items,
      customer_name: payload.customerName,
      customer_phone: payload.customerPhone,
      table_order_id: payload.tableOrderId,
    }),
  }) as Promise<CreateStaffOrderResponse>;
}
