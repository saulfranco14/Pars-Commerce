import { apiFetch } from "@/services/apiFetch";

import type {
  PaymentsAndDeliveryForm,
  PaymentsAndDeliverySnapshot,
} from "@/features/configuracion/interfaces/paymentsAndDelivery";

export async function getPaymentsAndDelivery(tenantId: string): Promise<PaymentsAndDeliverySnapshot> {
  return (await apiFetch(`/api/tenant-fulfillment?tenant_id=${encodeURIComponent(tenantId)}`)) as PaymentsAndDeliverySnapshot;
}

export async function savePaymentsAndDelivery(tenantId: string, form: PaymentsAndDeliveryForm): Promise<void> {
  await apiFetch("/api/tenant-fulfillment", {
    method: "PATCH",
    body: JSON.stringify({ ...form, tenant_id: tenantId, delivery_fee: Number(form.delivery_fee || 0) }),
  });
}
