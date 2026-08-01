import type { SupabaseClient } from "@supabase/supabase-js";

import {
  confirmPayment,
  createPaymentIntent,
  type IntentMethod,
  type ServiceResult,
} from "@/features/qr/services/tablePaymentService";

export interface ChargeAtCounterInput {
  orderId: string;
  method: IntentMethod;
  actorUserId: string;
}

export interface ChargeAtCounterResult {
  paymentId: string;
  amount: number;
  /** `true` cuando con esto quedó cubierto el total del pedido. */
  allPaid: boolean;
  /**
   * `true` cuando el cliente ya había declarado el pago desde su celular y esto
   * solo lo confirmó, en vez de levantar un cobro nuevo.
   */
  confirmedExisting: boolean;
}

/**
 * El cliente llegó al mostrador con su número y paga ahí.
 *
 * Tiene que aguantar los tres estados en los que puede llegar, porque el cliente
 * y el mostrador actúan sobre el mismo pedido al mismo tiempo:
 *
 *  1. El cliente ya le picó "ya pagué en caja" desde su celular → hay un cobro
 *     pendiente y esto solo lo confirma.
 *  2. El cliente abrió el pago y se arrepintió → quedó su grupo de "Cuenta
 *     total" sin cobro. Se cobra ESE grupo.
 *  3. Nadie tocó nada → se levanta el cobro desde cero.
 *
 * Antes solo cubría el caso 3, así que en cuanto el cliente escaneaba, el
 * mostrador recibía "Esta cuenta fue dividida" y se quedaba sin poder cobrar.
 */
export async function chargeAtCounter(
  admin: SupabaseClient,
  input: ChargeAtCounterInput,
): Promise<ServiceResult<ChargeAtCounterResult>> {
  // Caso 1 — ya hay dinero declarado esperando validación.
  const { data: pending } = await admin
    .from("payments")
    .select("id, amount")
    .eq("order_id", input.orderId)
    .eq("provider", "manual")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (pending?.id) {
    const confirmed = await confirmPayment(admin, {
      paymentId: pending.id,
      actorUserId: input.actorUserId,
    });
    if (!confirmed.ok) return confirmed;
    return {
      ok: true,
      data: {
        paymentId: pending.id,
        amount: Number(pending.amount ?? 0),
        allPaid: confirmed.data.allPaid,
        confirmedExisting: true,
      },
    };
  }

  // Casos 2 y 3 — un solo grupo sin pagar se cobra; varios grupos son una cuenta
  // repartida de verdad y cada quien paga la suya.
  const { data: groups } = await admin
    .from("order_split_groups")
    .select("id, payment_status")
    .eq("order_id", input.orderId);

  const all = groups ?? [];
  if (all.length > 1) {
    return {
      ok: false,
      error: {
        code: "conflict",
        message:
          "Esta cuenta está repartida entre varias personas. Cóbrala desde la pantalla de Mesas, parte por parte.",
      },
    };
  }
  if (all.length === 1 && all[0].payment_status === "paid") {
    return {
      ok: false,
      error: { code: "conflict", message: "Este pedido ya está pagado" },
    };
  }

  const intent = await createPaymentIntent(admin, {
    orderId: input.orderId,
    groupId: all[0]?.id ?? null,
    method: input.method,
    fingerprint: null,
    customerPhone: null,
  });
  if (!intent.ok) return intent;
  if (!intent.data.paymentId) {
    return {
      ok: false,
      error: {
        code: "internal",
        message: "No se pudo registrar el cobro. Vuelve a intentarlo.",
      },
    };
  }

  const confirmed = await confirmPayment(admin, {
    paymentId: intent.data.paymentId,
    actorUserId: input.actorUserId,
  });
  if (!confirmed.ok) return confirmed;

  return {
    ok: true,
    data: {
      paymentId: intent.data.paymentId,
      amount: intent.data.amount,
      allPaid: confirmed.data.allPaid,
      confirmedExisting: false,
    },
  };
}
