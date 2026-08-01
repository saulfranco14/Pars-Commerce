import type { SupabaseClient } from "@supabase/supabase-js";

import { preferenceClient } from "@/lib/mercadopago";
import {
  NOT_READY_MESSAGE,
  requiresReadyBeforePayment,
} from "@/features/qr/helpers/paymentReadiness";
import {
  QR_TABLE_PREFIX,
  QR_TABLE_GROUP_PREFIX,
} from "@/features/qr/services/tableMpWebhookService";

import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

export interface CreatePreferenceInput {
  orderId: string;
  groupId?: string | null;
  fingerprint?: string | null;
  baseUrl: string;
  qrToken: string;
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
      "id, tenant_id, status, fulfillment_status, source, order_type, total, balance_due",
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
  const gateOnReady = requiresReadyBeforePayment(order.source, order.order_type);
  if (gateOnReady && !input.groupId && order.fulfillment_status !== "ready")
    return {
      ok: false,
      error: {
        code: "conflict",
        message: NOT_READY_MESSAGE,
      },
    };

  let amount: number;
  let title: string;
  let externalReference: string;

  let deviceId: string | null = null;
  let deviceStatus: string | null = null;
  if (input.fingerprint) {
    const { data: device } = await admin
      .from("order_devices")
      .select("id, fulfillment_status")
      .eq("order_id", input.orderId)
      .eq("device_fingerprint", input.fingerprint)
      .maybeSingle();
    deviceId = device?.id ?? null;
    deviceStatus = device?.fulfillment_status ?? null;
  }

  if (input.groupId) {
    const { data: group } = await admin
      .from("order_split_groups")
      .select("id, device_id, label, total, balance_due, payment_status")
      .eq("id", input.groupId)
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
    if (gateOnReady && deviceStatus !== "ready")
      return {
        ok: false,
        error: { code: "conflict", message: NOT_READY_MESSAGE },
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

  const base = input.baseUrl.replace(/\/$/, "");
  const successUrl = new URL(
    `${base}/q/${encodeURIComponent(input.qrToken)}/table/payment/result`,
  );
  successUrl.searchParams.set("order_id", order.id);
  if (input.groupId) successUrl.searchParams.set("group_id", input.groupId);

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
          split_group_id: input.groupId ?? null,
          fee_absorbed_by: "business",
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
        amount,
      },
    };
  } catch (err) {
    const mpError = extractMercadoPagoError(err);
    console.error("[tableMpPreferenceService] MP preference failed", {
      orderId: input.orderId,
      groupId: input.groupId ?? null,
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
