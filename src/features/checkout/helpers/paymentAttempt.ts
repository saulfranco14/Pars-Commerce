import { createAdminClient } from "@/lib/supabase/admin";

import type { CheckoutMode } from "@/features/checkout/interfaces/publicCheckout";

interface CreatePaymentAttemptInput {
  order_id: string;
  tenant_id: string;
  mode: CheckoutMode;
  amount: number;
  idempotency_key: string;
  expires_at: string;
  metadata?: Record<string, unknown>;
}

export async function createPaymentAttempt(
  admin: ReturnType<typeof createAdminClient>,
  input: CreatePaymentAttemptInput,
) {
  const { data: existing } = await admin
    .from("order_payment_attempts")
    .select("id, external_reference, provider_reference")
    .eq("idempotency_key", input.idempotency_key)
    .single();

  if (existing) return existing;

  const { data, error } = await admin
    .from("order_payment_attempts")
    .insert({
      order_id: input.order_id,
      tenant_id: input.tenant_id,
      mode: input.mode,
      amount: input.amount,
      idempotency_key: input.idempotency_key,
      status: "created",
      expires_at: input.expires_at,
      metadata: input.metadata ?? {},
    })
    .select("id, external_reference, provider_reference")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo crear intento de pago");
  }

  return data;
}
