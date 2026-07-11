/**
 * Domain services for table payments. Lives in `features/qr/services` next to
 * the rest of the QR feature. These are server-only helpers — they receive an
 * admin Supabase client and return typed results plus a discriminated `error`
 * field, so the HTTP route handlers stay thin (parse body → call service →
 * map error to status code).
 *
 * Why this exists: previously the lifecycle of a table payment (intent →
 * confirm/reject, full-pay, split-pay) lived inline inside each route, mixing
 * input parsing with business rules. SRP-wise the routes should only adapt
 * HTTP; the rules should be one cohesive module per workflow.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { releaseTableQrIfPaid } from "@/features/qr/helpers/releaseTableQrIfPaid";

export type IntentMethod = "efectivo" | "transferencia" | "tarjeta";
export type CheckoutMethod = IntentMethod | "mercadopago";

export interface ServiceError {
  code:
    | "not_found"
    | "forbidden"
    | "conflict"
    | "validation"
    | "internal";
  message: string;
}

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ServiceError };

function err(
  code: ServiceError["code"],
  message: string,
): { ok: false; error: ServiceError } {
  return { ok: false, error: { code, message } };
}

/**
 * The customer can only pay once the business marks the order as ready
 * (fulfillment_status = "ready"). Shared across every payment entry point.
 */
const NOT_READY_ERROR = err(
  "conflict",
  "El negocio aún está preparando tu pedido. Podrás pagar cuando esté listo.",
);

/* -------------------------------------------------------------------------- */
/* Payment intent — customer signals they want to pay (cash/transfer/in-card) */
/* -------------------------------------------------------------------------- */

export interface CreatePaymentIntentInput {
  orderId: string;
  groupId?: string | null;
  method: IntentMethod;
  fingerprint: string | null;
}

export interface CreatePaymentIntentResult {
  paymentId: string | null;
  splitGroupId: string;
  amount: number;
  method: IntentMethod;
}

export async function createPaymentIntent(
  admin: SupabaseClient,
  input: CreatePaymentIntentInput,
): Promise<ServiceResult<CreatePaymentIntentResult>> {
  const { data: order } = await admin
    .from("orders")
    .select("id, tenant_id, status, fulfillment_status, total, balance_due")
    .eq("id", input.orderId)
    .single();

  if (!order) return err("not_found", "Orden no encontrada");
  if (order.status === "paid")
    return err("conflict", "La orden ya está pagada");
  if (order.status === "cancelled")
    return err("conflict", "La orden fue cancelada");

  // Locate device id so the activity log records who paid AND so we can gate
  // payment on THAT person's readiness (per-person), not the whole table.
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

  // Payment gate: if we know the paying person, gate on their state; otherwise
  // fall back to the order-level summary (derived from all people).
  if (deviceStatus !== null) {
    if (deviceStatus !== "ready") return NOT_READY_ERROR;
  } else if (order.fulfillment_status !== "ready") {
    return NOT_READY_ERROR;
  }

  let targetGroupId = input.groupId ?? null;

  if (!targetGroupId) {
    // Pay the whole order: materialize a single "Cuenta total" group.
    const { data: existing } = await admin
      .from("order_split_groups")
      .select("id")
      .eq("order_id", input.orderId)
      .limit(1);

    if (existing && existing.length > 0) {
      return err(
        "conflict",
        "Esta cuenta fue dividida. Cada persona debe pagar su parte por separado.",
      );
    }

    const amount = Number(order.balance_due ?? order.total);
    const { data: createdGroup, error: createErr } = await admin
      .from("order_split_groups")
      .insert({
        order_id: input.orderId,
        device_id: deviceId,
        label: "Cuenta total",
        subtotal: amount,
        total: amount,
        paid_total: 0,
        balance_due: amount,
        payment_status: "pending_validation",
      })
      .select("id")
      .single();

    if (createErr || !createdGroup) {
      return err(
        "internal",
        createErr?.message ?? "No se pudo crear el grupo de pago",
      );
    }
    targetGroupId = createdGroup.id;
  } else {
    const { data: group } = await admin
      .from("order_split_groups")
      .select("id, payment_status, total, balance_due")
      .eq("id", targetGroupId)
      .eq("order_id", input.orderId)
      .single();

    if (!group) return err("not_found", "Grupo no encontrado");
    if (group.payment_status === "paid")
      return err("conflict", "Esta parte ya está pagada");

    await admin
      .from("order_split_groups")
      .update({
        payment_status: "pending_validation",
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetGroupId);
  }

  const { data: groupRow } = await admin
    .from("order_split_groups")
    .select("total, balance_due")
    .eq("id", targetGroupId)
    .single();
  const intentAmount = Number(groupRow?.balance_due ?? groupRow?.total ?? 0);

  const { data: paymentRow } = await admin
    .from("payments")
    .insert({
      order_id: input.orderId,
      provider: "manual",
      status: "pending",
      amount: intentAmount,
      payment_kind: "partial",
      split_group_id: targetGroupId,
      metadata: {
        source: "qr_table_payment_intent",
        method: input.method,
        device_id: deviceId,
      },
    })
    .select("id")
    .single();

  await admin.from("order_activity_log").insert({
    order_id: input.orderId,
    actor_type: deviceId ? "device" : "system",
    actor_id: deviceId,
    actor_label: "cliente",
    action: "payment.intent",
    payload: {
      split_group_id: targetGroupId,
      method: input.method,
      amount: intentAmount,
      payment_id: paymentRow?.id,
    },
  });

  return {
    ok: true,
    data: {
      paymentId: paymentRow?.id ?? null,
      // `targetGroupId` was guaranteed to be set above (either reused or created).
      splitGroupId: targetGroupId as string,
      amount: intentAmount,
      method: input.method,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Confirm / reject a pending payment (admin)                                  */
/* -------------------------------------------------------------------------- */

export interface ConfirmPaymentInput {
  paymentId: string;
  actorUserId: string;
}

export interface ConfirmPaymentResult {
  allPaid: boolean;
  orderId: string;
}

export async function confirmPayment(
  admin: SupabaseClient,
  input: ConfirmPaymentInput,
): Promise<ServiceResult<ConfirmPaymentResult>> {
  const { data: payment } = await admin
    .from("payments")
    .select("id, order_id, split_group_id, amount, status, metadata")
    .eq("id", input.paymentId)
    .single();

  if (!payment) return err("not_found", "Pago no encontrado");
  if (payment.status === "approved") {
    return { ok: true, data: { allPaid: false, orderId: payment.order_id } };
  }

  const { data: order } = await admin
    .from("orders")
    .select("id, total")
    .eq("id", payment.order_id)
    .single();

  if (!order) return err("not_found", "Orden no encontrada");

  const now = new Date().toISOString();
  const method =
    (payment.metadata as { method?: string } | null)?.method ?? "manual";

  await admin
    .from("payments")
    .update({ status: "approved", updated_at: now })
    .eq("id", payment.id);

  if (payment.split_group_id) {
    const { data: group } = await admin
      .from("order_split_groups")
      .select("id, total")
      .eq("id", payment.split_group_id)
      .single();
    if (group) {
      await admin
        .from("order_split_groups")
        .update({
          paid_total: Number(group.total),
          balance_due: 0,
          payment_status: "paid",
          updated_at: now,
        })
        .eq("id", payment.split_group_id);
    }
  }

  let allPaid = false;
  if (payment.split_group_id) {
    const { data: allGroups } = await admin
      .from("order_split_groups")
      .select("id, payment_status")
      .eq("order_id", order.id);
    allPaid = (allGroups ?? []).every((g) => g.payment_status === "paid");
    if (allPaid) {
      await admin
        .from("orders")
        .update({
          status: "paid",
          paid_at: now,
          balance_due: 0,
          paid_total: Number(order.total),
          payment_method: method,
          updated_at: now,
        })
        .eq("id", order.id);
    }
  }

  await admin.from("order_activity_log").insert({
    order_id: order.id,
    actor_type: "member",
    actor_id: input.actorUserId,
    actor_label: "personal",
    action: "payment.confirmed",
    payload: {
      payment_id: payment.id,
      split_group_id: payment.split_group_id,
      method,
      amount: Number(payment.amount),
    },
  });

  if (allPaid) {
    await releaseTableQrIfPaid(admin, order.id);
  }

  return { ok: true, data: { allPaid, orderId: order.id } };
}

export interface RejectPaymentInput {
  paymentId: string;
  actorUserId: string;
  reason: string | null;
}

export async function rejectPayment(
  admin: SupabaseClient,
  input: RejectPaymentInput,
): Promise<ServiceResult<{ orderId: string }>> {
  const { data: payment } = await admin
    .from("payments")
    .select("id, order_id, split_group_id, status, metadata, amount")
    .eq("id", input.paymentId)
    .single();

  if (!payment) return err("not_found", "Pago no encontrado");
  if (payment.status === "approved") {
    return err(
      "conflict",
      "Este pago ya fue aprobado, no puede rechazarse",
    );
  }

  const now = new Date().toISOString();
  const meta = (payment.metadata as Record<string, unknown> | null) ?? {};

  await admin
    .from("payments")
    .update({
      status: "rejected",
      updated_at: now,
      metadata: { ...meta, reject_reason: input.reason },
    })
    .eq("id", payment.id);

  if (payment.split_group_id) {
    await admin
      .from("order_split_groups")
      .update({ payment_status: "pending", updated_at: now })
      .eq("id", payment.split_group_id);
  }

  await admin.from("order_activity_log").insert({
    order_id: payment.order_id,
    actor_type: "member",
    actor_id: input.actorUserId,
    actor_label: "personal",
    action: "payment.rejected",
    payload: {
      payment_id: payment.id,
      split_group_id: payment.split_group_id,
      amount: Number(payment.amount),
      reason: input.reason,
    },
  });

  return { ok: true, data: { orderId: payment.order_id } };
}

/* -------------------------------------------------------------------------- */
/* Pay full order (no split, direct payment)                                   */
/* -------------------------------------------------------------------------- */

export interface PayFullOrderInput {
  orderId: string;
  method: CheckoutMethod;
}

export interface PayFullOrderResult {
  amount: number;
  paidAt: string;
  alreadyPaid: boolean;
}

export async function payFullOrder(
  admin: SupabaseClient,
  input: PayFullOrderInput,
): Promise<ServiceResult<PayFullOrderResult>> {
  const { data: order } = await admin
    .from("orders")
    .select(
      "id, status, fulfillment_status, total, paid_total, balance_due, merge_group_id",
    )
    .eq("id", input.orderId)
    .single();

  if (!order) return err("not_found", "Orden no encontrada");
  if (order.status === "paid") {
    return {
      ok: true,
      data: {
        amount: 0,
        paidAt: new Date().toISOString(),
        alreadyPaid: true,
      },
    };
  }
  if (order.status === "cancelled") {
    return err(
      "conflict",
      "Esta cuenta fue cancelada y no puede pagarse",
    );
  }
  if (order.fulfillment_status !== "ready") return NOT_READY_ERROR;

  // Linked tables pay as one: settle every order in the merge group and
  // release every QR. Not linked → just this order.
  const groupOrderIds = order.merge_group_id
    ? (
        (
          await admin
            .from("orders")
            .select("id")
            .eq("merge_group_id", order.merge_group_id)
        ).data ?? []
      ).map((o) => o.id as string)
    : [order.id];

  const { data: existingGroups } = await admin
    .from("order_split_groups")
    .select("id")
    .in("order_id", groupOrderIds)
    .limit(1);

  if (existingGroups && existingGroups.length > 0) {
    return err(
      "conflict",
      "Esta cuenta fue dividida. Cada persona debe pagar su parte por separado.",
    );
  }

  const { data: groupOrders } = await admin
    .from("orders")
    .select("id, total, balance_due")
    .in("id", groupOrderIds);

  const amount = (groupOrders ?? []).reduce(
    (a, o) => a + Number(o.balance_due ?? o.total ?? 0),
    0,
  );
  const now = new Date().toISOString();

  // Settle each order + insert a payment row for it (keeps per-order books
  // correct and the CHECK(>=0) invariants intact).
  for (const o of groupOrders ?? []) {
    const oAmount = Number(o.balance_due ?? o.total ?? 0);
    const { error: orderError } = await admin
      .from("orders")
      .update({
        status: "paid",
        paid_at: now,
        balance_due: 0,
        paid_total: Number(o.total),
        payment_method: input.method,
        updated_at: now,
      })
      .eq("id", o.id);
    if (orderError) return err("internal", orderError.message);

    await admin.from("payments").insert({
      order_id: o.id,
      provider: input.method === "mercadopago" ? "mercadopago" : "manual",
      status: "approved",
      amount: oAmount,
      payment_kind: "full",
      metadata: {
        source: "qr_table_pay_full",
        method: input.method,
        group: order.merge_group_id ?? null,
      },
    });

    await admin.from("order_activity_log").insert({
      order_id: o.id,
      actor_type: "device",
      actor_label: "cliente",
      action: "payment.succeeded",
      payload: { method: input.method, amount: oAmount, kind: "full" },
    });

    await releaseTableQrIfPaid(admin, o.id);
  }

  return { ok: true, data: { amount, paidAt: now, alreadyPaid: false } };
}

/* -------------------------------------------------------------------------- */
/* Pay a split group (direct, without intent confirmation)                      */
/* -------------------------------------------------------------------------- */

export interface PayGroupInput {
  groupId: string;
  method: CheckoutMethod;
}

export interface PayGroupResult {
  allPaid: boolean;
  amount: number;
}

export async function payGroup(
  admin: SupabaseClient,
  input: PayGroupInput,
): Promise<ServiceResult<PayGroupResult>> {
  const { data: group } = await admin
    .from("order_split_groups")
    .select(
      "id, order_id, device_id, total, paid_total, balance_due, payment_status",
    )
    .eq("id", input.groupId)
    .single();

  if (!group) return err("not_found", "Grupo no encontrado");
  if (group.payment_status === "paid") {
    return { ok: true, data: { allPaid: false, amount: 0 } };
  }

  // Per-person gating: a group tied to a device is payable as soon as THAT
  // person is ready, even if the rest of the table isn't. Groups without a
  // device (e.g. "cuenta total") fall back to the order-level summary.
  if (group.device_id) {
    const { data: device } = await admin
      .from("order_devices")
      .select("fulfillment_status")
      .eq("id", group.device_id)
      .maybeSingle();
    if (device && device.fulfillment_status !== "ready")
      return NOT_READY_ERROR;
  } else {
    const { data: groupOrder } = await admin
      .from("orders")
      .select("fulfillment_status")
      .eq("id", group.order_id)
      .single();
    if (groupOrder && groupOrder.fulfillment_status !== "ready")
      return NOT_READY_ERROR;
  }

  const now = new Date().toISOString();
  const amount = Number(group.balance_due ?? group.total);

  await admin
    .from("order_split_groups")
    .update({
      paid_total: Number(group.total),
      balance_due: 0,
      payment_status: "paid",
      updated_at: now,
    })
    .eq("id", input.groupId);

  await admin.from("payments").insert({
    order_id: group.order_id,
    provider: input.method === "mercadopago" ? "mercadopago" : "manual",
    status: "approved",
    amount,
    payment_kind: "partial",
    split_group_id: input.groupId,
    metadata: { source: "qr_split_checkout", method: input.method },
  });

  const { data: allGroups } = await admin
    .from("order_split_groups")
    .select("id, payment_status")
    .eq("order_id", group.order_id);
  const allPaid = (allGroups ?? []).every((g) => g.payment_status === "paid");

  if (allPaid) {
    await admin
      .from("orders")
      .update({
        status: "paid",
        paid_at: now,
        balance_due: 0,
        paid_total: Number(group.total),
        payment_method: input.method,
      })
      .eq("id", group.order_id);
  }

  await admin.from("order_activity_log").insert({
    order_id: group.order_id,
    actor_type: "device",
    actor_label: "cliente",
    action: "payment.succeeded",
    payload: {
      split_group_id: input.groupId,
      method: input.method,
      amount,
    },
  });

  if (allPaid) {
    await releaseTableQrIfPaid(admin, group.order_id);
  }

  return { ok: true, data: { allPaid, amount } };
}
