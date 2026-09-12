import type { SupabaseClient } from "@supabase/supabase-js";

import { preferenceClient } from "@/lib/mercadopago";
import {
  NOT_READY_MESSAGE,
  requiresReadyBeforePayment,
} from "@/features/qr/helpers/paymentReadiness";
import {
  QR_TABLE_PREFIX,
  QR_TABLE_GROUP_PREFIX,
  QR_TABLE_PAYMENT_PREFIX,
} from "@/features/qr/services/tableMpWebhookService";

import {
  materializePersonalGroups,
  type ServiceResult,
} from "@/features/qr/services/tablePaymentService";

export interface CreatePreferenceInput {
  orderId: string;
  groupId?: string | null;
  fingerprint?: string | null;
  baseUrl: string;
  qrToken: string;
  /** Optional tip collected by the same Mercado Pago checkout. */
  tipAmount?: number;
}

export interface CreatePreferenceResult {
  initPoint: string;
  preferenceId: string;
  amount: number;
}

export async function createTableMpPreference(
  admin: SupabaseClient,
  input: CreatePreferenceInput,
): Promise<ServiceResult<CreatePreferenceResult>> {
  const { data: order } = await admin
    .from("orders")
    .select(
      "id, tenant_id, status, fulfillment_status, source, order_type, total, balance_due, assigned_to",
    )
    .eq("id", input.orderId)
    .single();

  if (!order)
    return {
      ok: false,
      error: { code: "not_found", message: "Orden no encontrada" },
    };
  if (order.status === "paid")
    return {
      ok: false,
      error: { code: "conflict", message: "La orden ya está pagada" },
    };
  if (order.status === "cancelled")
    return {
      ok: false,
      error: { code: "conflict", message: "La orden fue cancelada" },
    };

  const tipAmount = Math.round(Number(input.tipAmount ?? 0) * 100) / 100;
  if (!Number.isFinite(tipAmount) || tipAmount < 0) {
    return { ok: false, error: { code: "validation", message: "La propina no es válida" } };
  }
  if (tipAmount > 0 && !order.assigned_to) {
    return {
      ok: false,
      error: {
        code: "conflict",
        message: "La propina estará disponible cuando el negocio asigne a quien te atendió.",
      },
    };
  }
  const gateOnReady = requiresReadyBeforePayment(order.source, order.order_type);

  let amount: number;
  let title: string;
  let externalReference: string;

  let deviceId: string | null = null;
  let deviceStatus: string | null = null;
  let isAccountOwner = false;
  if (input.fingerprint) {
    const { data: device } = await admin
      .from("order_devices")
      .select("id, fulfillment_status, is_owner")
      .eq("order_id", input.orderId)
      .eq("device_fingerprint", input.fingerprint)
      .maybeSingle();
    deviceId = device?.id ?? null;
    deviceStatus = device?.fulfillment_status ?? null;
    isAccountOwner = device?.is_owner === true;
  }

  let targetGroupId = input.groupId ?? null;
  const paysOwnProducts = !targetGroupId && !!deviceId && !isAccountOwner;
  if (!targetGroupId && paysOwnProducts && deviceId) {
    const personal = await materializePersonalGroups(admin, input.orderId, deviceId);
    if (!personal.ok) return personal;
    targetGroupId = personal.data.groupId;
  }
  if (
    gateOnReady &&
    ((targetGroupId && deviceStatus !== "ready") ||
      (!targetGroupId && order.fulfillment_status !== "ready"))
  ) {
    return { ok: false, error: { code: "conflict", message: NOT_READY_MESSAGE } };
  }

  if (targetGroupId) {
    const { data: group } = await admin
      .from("order_split_groups")
      .select("id, device_id, label, total, balance_due, payment_status")
      .eq("id", targetGroupId)
      .eq("order_id", input.orderId)
      .single();

    if (!group)
      return {
        ok: false,
        error: { code: "not_found", message: "Grupo no encontrado" },
      };
    if (!deviceId || group.device_id !== deviceId)
      return {
        ok: false,
        error: {
          code: "forbidden",
          message: "Esta parte de la cuenta pertenece a otra persona",
        },
      };
    if (group.payment_status === "paid")
      return {
        ok: false,
        error: { code: "conflict", message: "Esta parte ya está pagada" },
      };

    amount = Number(group.balance_due ?? group.total);
    title = `Pago de ${group.label}`;
    externalReference = `${QR_TABLE_GROUP_PREFIX}${group.id}`;
  } else {
    const { data: existing } = await admin
      .from("order_split_groups")
      .select("id")
      .eq("order_id", input.orderId)
      .limit(1);
    if (existing && existing.length > 0) {
      return {
        ok: false,
        error: {
          code: "conflict",
          message:
            "Esta cuenta fue dividida. Cada persona debe pagar su parte por separado.",
        },
      };
    }
    amount = Number(order.balance_due ?? order.total);
    title = "Pago de mesa";
    externalReference = `${QR_TABLE_PREFIX}${order.id}`;
  }

  if (amount <= 0) {
    return {
      ok: false,
      error: { code: "conflict", message: "No hay saldo por pagar" },
    };
  }

  const payableAmount = amount + tipAmount;
  // Preserve the existing references for a normal table payment. A separate
  // reference is only needed when the webhook must split the MP transaction
  // into order money + tip money without putting the tip in sales totals.
  if (tipAmount > 0) {
    const scope = targetGroupId ? "group" : "full";
    const entityId = targetGroupId ?? order.id;
    externalReference = `${QR_TABLE_PAYMENT_PREFIX}${scope}:${entityId}:${Math.round(tipAmount * 100)}`;
  }

  const base = input.baseUrl.replace(/\/$/, "");
  const successUrl = new URL(
    `${base}/q/${encodeURIComponent(input.qrToken)}/table/payment/result`,
  );
  successUrl.searchParams.set("order_id", order.id);
  if (targetGroupId) successUrl.searchParams.set("group_id", targetGroupId);

  const isPubliclyReachable = base.startsWith("https://");

  try {
    const preference = await preferenceClient.create({
      body: {
        items: [
          {
            id: externalReference,
            title,
            quantity: 1,
            unit_price: amount,
            currency_id: "MXN",
          },
          ...(tipAmount > 0
            ? [{
                id: `${externalReference}:tip`,
                title: "Propina",
                quantity: 1,
                unit_price: tipAmount,
                currency_id: "MXN",
              }]
            : []),
        ],
        external_reference: externalReference,
        notification_url: `${base}/api/mercadopago/webhook`,
        back_urls: {
          success: successUrl.toString(),
          failure: successUrl.toString(),
          pending: successUrl.toString(),
        },
        ...(isPubliclyReachable ? { auto_return: "approved" as const } : {}),
        metadata: {
          source: "qr_table",
          order_id: order.id,
          split_group_id: targetGroupId ?? null,
          fee_absorbed_by: "business",
          tip_amount: tipAmount,
        },
      },
    });

    if (!preference.id || !preference.init_point) {
      return {
        ok: false,
        error: {
          code: "internal",
          message: "Mercado Pago no devolvió un init_point",
        },
      };
    }

    return {
      ok: true,
      data: {
        preferenceId: preference.id,
        initPoint: preference.init_point,
        amount: payableAmount,
      },
    };
  } catch (err) {
    const mpError = extractMercadoPagoError(err);
    console.error("[tableMpPreferenceService] MP preference failed", {
      orderId: input.orderId,
      groupId: targetGroupId ?? null,
      amount,
      mpError,
    });
    return {
      ok: false,
      error: {
        code: "internal",
        message: mpError ?? "No se pudo conectar con Mercado Pago",
      },
    };
  }
}

function extractMercadoPagoError(err: unknown): string | null {
  if (!err) return null;
  if (typeof err === "string") return err;
  if (err instanceof Error) {
    const cause = (err as { cause?: unknown }).cause;
    if (cause && typeof cause === "object") {
      const message =
        (cause as { message?: string }).message ??
        (cause as { error?: string }).error;
      if (message) return message;
    }
    return err.message;
  }
  return null;
}
