import { apiFetch } from "@/services/apiFetch";

export async function generatePaymentLink(
  orderId: string
): Promise<{ payment_link: string; preference_id: string }> {
  const data = await apiFetch("/api/mercadopago/create-preference", {
    method: "POST",
    body: JSON.stringify({ order_id: orderId }),
  });
  return data as { payment_link: string; preference_id: string };
}
