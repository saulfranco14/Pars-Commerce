/**
 * Client-side wrappers for admin actions on a table order. Used by the admin
 * pages and hooks so they don't hand-craft fetch() everywhere.
 */

import { apiFetch } from "@/services/apiFetch";

import type { CloseReason } from "@/features/qr/services/tableCloseService";

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
