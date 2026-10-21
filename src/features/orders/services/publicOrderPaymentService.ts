/**
 * The customer, from their private /pedido/{token} link, says how they are
 * paying (like at a table). It becomes a pending payment that Caja confirms;
 * nothing counts as paid until the business does.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { createPaymentIntent } from "@/features/qr/services/tablePaymentService";

import type { IntentMethod, ServiceResult } from "@/features/qr/services/tablePaymentService";

export async function declareTrackedOrderPayment(
  admin: SupabaseClient,
  params: { token: string; method: IntentMethod },
): Promise<ServiceResult<{ amount: number }>> {
  const { data: order } = await admin
    .from("orders")
    .select("id, payment_method")
    .eq("public_tracking_token", params.token)
    .maybeSingle();
  if (!order) return { ok: false, error: { code: "not_found", message: "No encontramos este pedido." } };

  const { data: pending } = await admin
    .from("payments")
    .select("id")
    .eq("order_id", order.id)
    .eq("provider", "manual")
    .eq("status", "pending")
    .limit(1);
  if ((pending ?? []).length > 0) {
    return { ok: false, error: { code: "conflict", message: "Ya avisaste de tu pago; el negocio lo está confirmando." } };
  }

  const intent = await createPaymentIntent(admin, { orderId: order.id, method: params.method, fingerprint: null });
  if (!intent.ok) return intent;
  return { ok: true, data: { amount: intent.data.amount } };
}
