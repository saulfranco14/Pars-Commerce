/**
 * Client-side wrappers for admin actions on a table order. Used by the admin
 * pages and hooks so they don't hand-craft fetch() everywhere.
 */

import { apiFetch } from "@/services/apiFetch";

import type { CloseReason } from "@/features/qr/services/tableCloseService";
import type { FulfillmentStatus } from "@/features/qr/services/tableFulfillmentService";

/** Advance the staff-controlled preparation state (received → in_progress → ready). */
export async function advanceOrderFulfillment(payload: {
  orderId: string;
  status: FulfillmentStatus;
}) {
  return apiFetch(
    `/api/qr/table/${encodeURIComponent(payload.orderId)}/fulfillment`,
    {
      method: "POST",
      body: JSON.stringify({ status: payload.status }),
    },
  );
}

/** Advance ONE person's preparation state (per-device). */
export async function advanceDeviceFulfillment(payload: {
  orderId: string;
  deviceId: string;
  status: FulfillmentStatus;
}) {
  return apiFetch(
    `/api/qr/table/${encodeURIComponent(payload.orderId)}/fulfillment`,
    {
      method: "POST",
      body: JSON.stringify({ status: payload.status, device_id: payload.deviceId }),
    },
  );
}

/** Advance ONE product line's preparation state (per-item). */
export async function advanceItemFulfillment(payload: {
  orderId: string;
  orderItemId: string;
  status: FulfillmentStatus;
}) {
  return apiFetch(
    `/api/qr/table/${encodeURIComponent(payload.orderId)}/fulfillment`,
    {
      method: "POST",
      body: JSON.stringify({
        status: payload.status,
        order_item_id: payload.orderItemId,
      }),
    },
  );
}

/** Whole-table shortcut: set every person to `status` at once. */
export async function advanceAllFulfillment(payload: {
  orderId: string;
  status: FulfillmentStatus;
}) {
  return apiFetch(
    `/api/qr/table/${encodeURIComponent(payload.orderId)}/fulfillment`,
    {
      method: "POST",
      body: JSON.stringify({ status: payload.status, all: true }),
    },
  );
}

export async function confirmPendingPayment(paymentId: string) {
  return apiFetch(
    `/api/qr/table/payment/${encodeURIComponent(paymentId)}/confirm`,
    { method: "POST" },
  );
}

export async function rejectPendingPayment(
  paymentId: string,
  reason?: string,
) {
  return apiFetch(
    `/api/qr/table/payment/${encodeURIComponent(paymentId)}/reject`,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    },
  );
}

export async function closeTableManually(payload: {
  orderId: string;
  reason: CloseReason;
  reasonDetails?: string;
}) {
  return apiFetch(
    `/api/qr/table/${encodeURIComponent(payload.orderId)}/close`,
    {
      method: "POST",
      body: JSON.stringify({
        reason: payload.reason,
        reason_details: payload.reasonDetails,
      }),
    },
  );
}

/** Link another active table to `primaryOrderId` (shared bill; both stay open). */
export async function mergeTableInto(payload: {
  primaryOrderId: string;
  secondaryOrderId: string;
}) {
  return apiFetch(
    `/api/qr/table/${encodeURIComponent(payload.primaryOrderId)}/merge`,
    {
      method: "POST",
      body: JSON.stringify({ secondary_order_id: payload.secondaryOrderId }),
    },
  );
}

/** Separate this table from its linked group. */
export async function unlinkTable(orderId: string) {
  return apiFetch(`/api/qr/table/${encodeURIComponent(orderId)}/unlink`, {
    method: "POST",
  });
}
