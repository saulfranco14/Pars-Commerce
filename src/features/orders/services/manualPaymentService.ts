import { apiFetch } from "@/services/apiFetch";

/** El negocio confirma que recibió el efectivo o la transferencia. */
export async function confirmManualPayment(paymentId: string): Promise<void> {
  await apiFetch(`/api/qr/table/payment/${paymentId}/confirm`, {
    method: "POST",
  });
}

/** El dinero no llegó: el pedido vuelve a quedar por pagar. */
export async function rejectManualPayment(paymentId: string): Promise<void> {
  await apiFetch(`/api/qr/table/payment/${paymentId}/reject`, {
    method: "POST",
  });
}
