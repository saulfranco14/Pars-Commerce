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
import {
  NOT_READY_MESSAGE,
  requiresReadyBeforePayment,
} from "@/features/qr/helpers/paymentReadiness";
import { computeSplitByDevice } from "@/features/qr/helpers/computeSplitByDevice";

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
const NOT_READY_ERROR = err("conflict", NOT_READY_MESSAGE);

/**
 * Whether every split group of an order is paid — the signal to mark the whole
 * order as paid. The confirm-payment and pay-group flows both need this exact
 * check, so it lives here instead of being copied into each (per ARCHITECTURE
 * §data-layer: extract a query only once the same literal repeats, named by
 * its domain meaning rather than by table).
 */
export async function areAllSplitGroupsPaid(
  admin: SupabaseClient,
  orderId: string,
): Promise<boolean> {
  const { data: groups, error } = await admin
    .from("order_split_groups")
    .select("id, payment_status")
    .eq("order_id", orderId);

  // Safety on the money path: if the query FAILED (`error`) or returned no
  // groups, do NOT report "all paid". A naive `(groups ?? []).every(...)`
  // would return true on an empty array — so a failed query would silently
  // mark the whole order paid without ever verifying a single group. The
  // callers only ever ask this AFTER establishing a split group exists, so
  // "no groups" here means an anomaly, never a legitimately group-less order.
  // Returning false just postpones closing the order to the next attempt;
  // returning true on a failed read would collect money that isn't there.
  if (error || !groups || groups.length === 0) return false;

  return groups.every((g) => g.payment_status === "paid");
}

/** Keep the order aggregate in sync with each independently-paid split group. */
export async function syncSplitOrderPaymentTotals(
  admin: SupabaseClient,
  orderId: string,
  options: { now: string; method?: string },
): Promise<{ allPaid: boolean }> {
  const { data: groups, error } = await admin
    .from("order_split_groups")
    .select("total, paid_total, balance_due, payment_status")
    .eq("order_id", orderId);

  // An incomplete read must never close a table or mark money as collected.
  if (error || !groups || groups.length === 0) return { allPaid: false };

  const paidTotal = groups.reduce(
    (sum, group) => sum + Number(group.paid_total ?? 0),
    0,
  );
  const balanceDue = groups.reduce(
    (sum, group) => sum + Number(group.balance_due ?? group.total ?? 0),
    0,
  );
  const allPaid = groups.every((group) => group.payment_status === "paid");

  await admin
    .from("orders")
    .update({
      paid_total: paidTotal,
      balance_due: Math.max(0, balanceDue),
      ...(allPaid
        ? {
            status: "paid",
            paid_at: options.now,
            payment_method: options.method ?? "manual",
          }
        : {}),
      updated_at: options.now,
    })
    .eq("id", orderId);

  return { allPaid };
}

/* -------------------------------------------------------------------------- */
/* Payment intent — customer signals they want to pay (cash/transfer/in-card) */
/* -------------------------------------------------------------------------- */

export interface CreatePaymentIntentInput {
  orderId: string;
  groupId?: string | null;
  method: IntentMethod;
  fingerprint: string | null;
  /** Anonymous customer (no session): phone to link the ticket to. */
  customerPhone?: string | null;
}

export interface CreatePaymentIntentResult {
  paymentId: string | null;
  splitGroupId: string;
  amount: number;
  method: IntentMethod;
}

/**
 * The first person paying their own products can safely establish the natural
 * per-person split. This is derived from item attribution, not from whoever
 * first scanned the QR. Once any payment starts the existing split lock keeps
 * the distribution stable for everyone else.
 */
export async function materializePersonalGroups(
  admin: SupabaseClient,
  orderId: string,
  currentDeviceId: string,
): Promise<ServiceResult<{ groupId: string }>> {
  const [{ data: existing }, { data: rawItems }, { data: rawDevices }] =
    await Promise.all([
      admin
        .from("order_split_groups")
        .select("id, device_id")
        .eq("order_id", orderId),
      admin
        .from("order_items")
        .select("id, product_id, quantity, unit_price, subtotal, added_by_device_id, is_shared")
        .eq("order_id", orderId),
      admin
        .from("order_devices")
        .select("id, display_name, color_hex, joined_at, last_seen_at")
        .eq("order_id", orderId)
        .order("joined_at", { ascending: true }),
    ]);

  const existingCurrent = (existing ?? []).find(
    (group) => group.device_id === currentDeviceId,
  );
  if (existingCurrent) return { ok: true, data: { groupId: existingCurrent.id } };
  if ((existing ?? []).length > 0) {
    return err("conflict", "La cuenta ya fue dividida. Pide al responsable que revise tu parte.");
  }

  const participantIds = new Set(
    (rawItems ?? [])
      .map((item) => item.added_by_device_id)
      .filter((id): id is string => !!id),
  );
  const devices = (rawDevices ?? []).filter((device) => participantIds.has(device.id));
  if (!devices.some((device) => device.id === currentDeviceId)) {
    return err("forbidden", "No encontramos productos asociados a tu cuenta");
  }

  const groups = computeSplitByDevice(rawItems ?? [], devices);
  if (groups.length === 0 || groups.some((group) => group.total <= 0)) {
    return err("validation", "No se pudo preparar las cuentas personales");
  }

  const { data: created, error } = await admin
    .from("order_split_groups")
    .insert(
      groups.map((group) => ({
        order_id: orderId,
        device_id: group.deviceId,
        label: group.label,
        subtotal: group.total,
        total: group.total,
        paid_total: 0,
        balance_due: group.total,
        payment_status: "pending",
      })),
    )
    .select("id, device_id");
  if (error) return err("internal", error.message);

  const current = (created ?? []).find((group) => group.device_id === currentDeviceId);
  if (!current) return err("internal", "No se pudo preparar tu parte de la cuenta");

  await admin
    .from("orders")
    .update({ status: "pending_payment", updated_at: new Date().toISOString() })
    .eq("id", orderId);

  await admin.from("order_activity_log").insert({
    order_id: orderId,
    actor_type: "device",
    actor_id: currentDeviceId,
    actor_label: "cliente",
    action: "split.created",
    payload: { mode: "by_device", groups: groups.length, automatic: true },
  });

  return { ok: true, data: { groupId: current.id } };
}

export async function createPaymentIntent(
  admin: SupabaseClient,
  input: CreatePaymentIntentInput,
): Promise<ServiceResult<CreatePaymentIntentResult>> {
  const { data: order } = await admin
    .from("orders")
    .select(
      "id, tenant_id, status, fulfillment_status, source, order_type, total, balance_due",
    )
    .eq("id", input.orderId)
    .single();

  if (!order) return err("not_found", "Orden no encontrada");
  if (order.status === "paid")
    return err("conflict", "La orden ya está pagada");
  if (order.status === "cancelled")
    return err("conflict", "La orden fue cancelada");

  const gateOnReady = requiresReadyBeforePayment(order.source, order.order_type);

  // Locate device id so the activity log records who paid AND so we can gate
  // payment on THAT person's readiness (per-person), not the whole table.
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

  const requestedGroupId = input.groupId ?? null;
  // A named participant without an account-owner role is always asking to pay
  // their own products. The server, not the CTA wording, enforces that scope.
  const paysOwnProducts = requestedGroupId === null && !!deviceId && !isAccountOwner;

  // A whole-table payment waits for everyone. A personal payment is gated by
  // this customer's own preparation state, even before its group exists.
  if (gateOnReady) {
    const canPayTargetGroup =
      (requestedGroupId !== null || paysOwnProducts) &&
      (deviceStatus === "ready" ||
        (isAccountOwner && order.fulfillment_status === "ready"));
    const canPayWholeOrder =
      requestedGroupId === null &&
      !paysOwnProducts &&
      order.fulfillment_status === "ready";
    if (!canPayTargetGroup && !canPayWholeOrder) return NOT_READY_ERROR;
  }

  let targetGroupId = requestedGroupId;

  if (!targetGroupId && paysOwnProducts && deviceId) {
    const personal = await materializePersonalGroups(admin, input.orderId, deviceId);
    if (!personal.ok) return personal;
    targetGroupId = personal.data.groupId;
  }

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
      .select("id, device_id, payment_status, total, balance_due")
      .eq("id", targetGroupId)
      .eq("order_id", input.orderId)
      .single();

    if (!group) return err("not_found", "Grupo no encontrado");
    if (
      input.fingerprint &&
      (!deviceId || (group.device_id !== deviceId && !isAccountOwner))
    ) {
      return err("forbidden", "Esta parte de la cuenta pertenece a otra persona");
    }
    if (group.payment_status === "paid")
      return err("conflict", "Esta parte ya está pagada");

    if (group.payment_status === "pending_validation") {
      return err("conflict", "Esta parte ya estÃ¡ esperando confirmaciÃ³n");
    }

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
    .select("total, balance_due, device_id")
    .eq("id", targetGroupId)
    .single();
  const intentAmount = Number(groupRow?.balance_due ?? groupRow?.total ?? 0);

  // Anonymous customer: link the ticket to their phone so the business can
  // reach them and the payment is attributable.
  const phone = input.customerPhone?.trim() || null;
  if (phone) {
    await admin
      .from("orders")
      .update({ customer_phone: phone, updated_at: new Date().toISOString() })
      .eq("id", input.orderId);
  }

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
        customer_phone: phone,
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
    .select("id, order_id, split_group_id, amount, status, metadata, tip_amount")
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
    .update({
      status: "approved",
      // Manual methods have no processor fee; the whole tip reaches the
      // assigned attendant. Mercado Pago fills these values from its webhook.
      tip_net_amount: Number(payment.tip_amount ?? 0),
      updated_at: now,
    } as never)
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
    ({ allPaid } = await syncSplitOrderPaymentTotals(admin, order.id, {
      now,
      method,
    }));
  } else if (Number(payment.tip_amount ?? 0) === 0) {
    // Sin grupo de split: un ticket de mostrador o de pantalla de autoservicio.
    // Antes solo se liquidaba la rama de mesas, así que el pago quedaba
    // aprobado y el pedido abierto para siempre.
    //
    // El total pagado se recalcula sumando los pagos aprobados en vez de
    // acumular sobre el valor anterior: así confirmar dos veces no puede
    // abonar de más.
    const { data: approved } = await admin
      .from("payments")
      .select("amount")
      .eq("order_id", order.id)
      .eq("status", "approved");

    const paidTotal = (approved ?? []).reduce(
      (sum, p) => sum + Number(p.amount ?? 0),
      0,
    );
    const orderTotal = Number(order.total);
    allPaid = paidTotal >= orderTotal;

    await admin
      .from("orders")
      .update({
        status: allPaid ? "paid" : "partial",
        paid_at: allPaid ? now : null,
        paid_total: paidTotal,
        balance_due: Math.max(0, orderTotal - paidTotal),
        payment_method: method,
        updated_at: now,
      })
      .eq("id", order.id);
  } else {
    // A tip is paid after the order is already settled. It must never change
    // the original method, revenue aggregate, or balance of that order.
    allPaid = true;
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
  fingerprint: string | null;
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
  if (!input.fingerprint) {
    return err("forbidden", "Identifica tu dispositivo para pagar la cuenta total");
  }
  const { data: order } = await admin
    .from("orders")
    .select(
      "id, status, fulfillment_status, source, order_type, total, paid_total, balance_due, merge_group_id",
    )
    .eq("id", input.orderId)
    .single();

  if (!order) return err("not_found", "Orden no encontrada");
  const { data: payer } = await admin
    .from("order_devices")
    .select("is_owner")
    .eq("order_id", input.orderId)
    .eq("device_fingerprint", input.fingerprint)
    .maybeSingle();
  if (!payer?.is_owner) {
    return err("forbidden", "Solo la persona responsable puede pagar la cuenta total");
  }
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
  if (
    requiresReadyBeforePayment(order.source, order.order_type) &&
    order.fulfillment_status !== "ready"
  ) {
    return NOT_READY_ERROR;
  }

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
      // 'single' — 'full' is not in the payments.payment_kind CHECK, so this
      // insert used to fail silently (23514). See tableMpWebhookService.
      payment_kind: "single",
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
  /** Public callers must prove ownership of the group with their fingerprint. */
  fingerprint?: string | null;
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

  const { data: groupOrder } = await admin
    .from("orders")
    .select("fulfillment_status, source, order_type")
    .eq("id", group.order_id)
    .single();

  if (input.fingerprint) {
    const { data: device } = await admin
      .from("order_devices")
      .select("id")
      .eq("order_id", group.order_id)
      .eq("device_fingerprint", input.fingerprint)
      .maybeSingle();
    if (!device || !group.device_id || device.id !== group.device_id) {
      return err("forbidden", "Esta parte de la cuenta pertenece a otra persona");
    }
  }

  // Per-person gating: a group tied to a device is payable as soon as THAT
  // person is ready, even if the rest of the table isn't. Groups without a
  // device (e.g. "cuenta total") fall back to the order-level summary.
  if (requiresReadyBeforePayment(groupOrder?.source, groupOrder?.order_type)) {
    if (group.device_id) {
      const { data: device } = await admin
        .from("order_devices")
        .select("fulfillment_status")
        .eq("id", group.device_id)
        .maybeSingle();
      if (device && device.fulfillment_status !== "ready")
        return NOT_READY_ERROR;
    } else if (groupOrder && groupOrder.fulfillment_status !== "ready") {
      return NOT_READY_ERROR;
    }
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

  const { allPaid } = await syncSplitOrderPaymentTotals(
    admin,
    group.order_id,
    { now, method: input.method },
  );

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
