/**
 * Thin client-side wrappers over the public QR-table endpoints. Components and
 * hooks call these instead of hand-crafting fetch() + JSON parsing every time.
 * Keeps the HTTP shape in one place; if a payload changes we only update here.
 *
 * Auth: these endpoints are PUBLIC for the customer side. The customer is
 * identified by the `x-fingerprint-id` header (per-QR localStorage UUID).
 */

import { apiFetch } from "@/services/apiFetch";

import type { CustomerPayMethod } from "@/features/qr/components/CustomerPayModal";
import type { AssignedGroup } from "@/features/qr/components/SplitItemsAssigner";
import type { BillResponse } from "@/features/qr/hooks/useBillData";
import type {
  TablePulseResponse,
  TableSessionResponse,
} from "@/features/qr/interfaces/tableSession";

/* ---------- QR resolve (initial session) ---------- */

export async function resolveTableSession(payload: {
  token: string;
  fingerprint: string;
}): Promise<TableSessionResponse> {
  return apiFetch(
    `/api/qr/resolve?token=${encodeURIComponent(payload.token)}`,
    {
      cache: "no-store",
      headers: fingerprintHeader(payload.fingerprint),
    },
  ) as Promise<TableSessionResponse>;
}

/* ---------- One-shot bill read (order tracker on the mesa screen) ---------- */

export async function fetchTableBill(payload: {
  orderId: string;
  fingerprint: string;
}): Promise<BillResponse> {
  return apiFetch(
    `/api/qr/table/${encodeURIComponent(payload.orderId)}/bill`,
    {
      cache: "no-store",
      headers: fingerprintHeader(payload.fingerprint),
    },
  ) as Promise<BillResponse>;
}

/* ---------- Lightweight heartbeat (poll this, not resolve) ---------- */

export async function fetchTablePulse(payload: {
  token: string;
  fingerprint: string;
}): Promise<TablePulseResponse> {
  return apiFetch(
    `/api/qr/table/pulse?token=${encodeURIComponent(payload.token)}`,
    {
      cache: "no-store",
      headers: fingerprintHeader(payload.fingerprint),
    },
  ) as Promise<TablePulseResponse>;
}

function fingerprintHeader(fingerprint: string): HeadersInit {
  return { "x-fingerprint-id": fingerprint };
}

/* ---------- Device naming ---------- */

export async function setMyDeviceName(payload: {
  qrToken: string;
  fingerprint: string;
  displayName: string;
}) {
  return apiFetch("/api/qr/table/device", {
    method: "PATCH",
    headers: fingerprintHeader(payload.fingerprint),
    body: JSON.stringify({
      qr_token: payload.qrToken,
      display_name: payload.displayName,
    }),
  });
}

/* ---------- Sending items to the business/staff ---------- */

export interface SendItemsItem {
  product_id: string;
  quantity: number;
}

export async function sendItems(payload: {
  orderId: string;
  qrToken: string;
  fingerprint: string;
  items: SendItemsItem[];
}) {
  return apiFetch("/api/qr/table/items", {
    method: "POST",
    headers: fingerprintHeader(payload.fingerprint),
    body: JSON.stringify({
      order_id: payload.orderId,
      qr_token: payload.qrToken,
      items: payload.items,
    }),
  });
}

/* ---------- Split bill ---------- */

export type SplitMode = "by_device" | "equal" | "items";

export async function submitSplit(payload: {
  orderId: string;
  mode: SplitMode;
  peopleCount?: number;
  groups?: AssignedGroup[];
}) {
  return apiFetch(
    `/api/qr/table/${encodeURIComponent(payload.orderId)}/split`,
    {
      method: "POST",
      body: JSON.stringify({
        mode: payload.mode,
        people_count: payload.peopleCount,
        groups: payload.groups,
      }),
    },
  );
}

/* ---------- Payment intent (manual methods that require staff validation) ---------- */

export interface PaymentIntentResult {
  payment_id: string | null;
  split_group_id: string;
  amount: number;
  method: CustomerPayMethod;
  status: "pending_validation";
}

export async function createPaymentIntent(payload: {
  orderId: string;
  groupId?: string | null;
  method: Exclude<CustomerPayMethod, "mercadopago">;
  fingerprint: string;
}): Promise<PaymentIntentResult> {
  return apiFetch("/api/qr/table/payment/intent", {
    method: "POST",
    headers: fingerprintHeader(payload.fingerprint),
    body: JSON.stringify({
      order_id: payload.orderId,
      group_id: payload.groupId ?? null,
      method: payload.method,
    }),
  }) as Promise<PaymentIntentResult>;
}

/* ---------- MercadoPago preference ---------- */

export interface MpPreferenceResult {
  init_point: string;
  preference_id: string;
  amount: number;
}

export async function createMpPreference(payload: {
  orderId: string;
  groupId?: string | null;
  qrToken: string;
}): Promise<MpPreferenceResult> {
  return apiFetch("/api/qr/table/payment/mp-preference", {
    method: "POST",
    body: JSON.stringify({
      order_id: payload.orderId,
      group_id: payload.groupId ?? null,
      qr_token: payload.qrToken,
    }),
  }) as Promise<MpPreferenceResult>;
}

/* ---------- Combine tables (customer-initiated) ---------- */

export interface MergeableTable {
  order_id: string;
  label: string;
}

export async function fetchMergeableTables(payload: {
  orderId: string;
  fingerprint: string;
}): Promise<MergeableTable[]> {
  const res = (await apiFetch(
    `/api/qr/table/${encodeURIComponent(payload.orderId)}/mergeable`,
    { headers: fingerprintHeader(payload.fingerprint) },
  )) as { tables: MergeableTable[] };
  return res.tables ?? [];
}

/** Ask another table to merge into this one. Creates a pending request; the
 *  other table's owner must approve before anything merges. */
export async function requestTableMerge(payload: {
  orderId: string;
  secondaryOrderId: string;
  fingerprint: string;
}) {
  return apiFetch(
    `/api/qr/table/${encodeURIComponent(payload.orderId)}/merge-request`,
    {
      method: "POST",
      headers: fingerprintHeader(payload.fingerprint),
      body: JSON.stringify({ secondary_order_id: payload.secondaryOrderId }),
    },
  );
}

/** Respond to a merge request: owner approves/declines, requester cancels. */
export async function respondToMergeRequest(payload: {
  requestId: string;
  decision: "approved" | "declined" | "cancelled";
  fingerprint: string;
}) {
  return apiFetch(
    `/api/qr/table/merge-request/${encodeURIComponent(payload.requestId)}/respond`,
    {
      method: "POST",
      headers: fingerprintHeader(payload.fingerprint),
      body: JSON.stringify({ decision: payload.decision }),
    },
  );
}
