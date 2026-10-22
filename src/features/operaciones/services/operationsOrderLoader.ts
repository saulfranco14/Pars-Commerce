/* eslint-disable @typescript-eslint/no-explicit-any -- delivery and proof tables are not in the generated types yet. */
import type { createAdminClient } from "@/lib/supabase/admin";
import type { BoardOrderItem, BoardTransferProof } from "@/features/operaciones/interfaces/board";

export type Admin = ReturnType<typeof createAdminClient>;
export type Db = { from: (table: string) => any };

// Active work only: an order nobody touched in this long is history, not a task.
export const ACTIVE_WINDOW_MS = 36 * 60 * 60 * 1000;
export const HIDDEN_STATUSES = "(cancelled,draft,pending_subscription)";
export const ORDER_COLUMNS =
  "id, order_number, status, fulfillment_status, fulfillment_method, source, order_type, table_label, created_at, updated_at, scheduled_for, customer_name, customer_phone, total, paid_total, balance_due, paid_at, payment_method, assigned_to, created_by, payment_verification_status";

const PROOF_BUCKET = "order-payment-proofs";
const PROOF_LINK_SECONDS = 10 * 60;

export const asDb = (admin: Admin) => admin as unknown as Db;
const none = { data: [] as any[] };

export function groupBy<T>(rows: T[], key: (row: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const k = key(row);
    map.set(k, [...(map.get(k) ?? []), row]);
  }
  return map;
}

export async function loadItems(db: Db, ids: string[]): Promise<Map<string, BoardOrderItem[]>> {
  const { data } = ids.length
    ? await db
        .from("order_items")
        .select("id, order_id, quantity, fulfillment_status, created_at, product:products(name, image_url)")
        .in("order_id", ids)
        .order("created_at", { ascending: true })
    : none;
  const byOrder = new Map<string, BoardOrderItem[]>();
  for (const i of data ?? []) {
    byOrder.set(i.order_id, [
      ...(byOrder.get(i.order_id) ?? []),
      {
        id: i.id,
        name: i.product?.name ?? "Producto",
        quantity: Number(i.quantity),
        imageUrl: i.product?.image_url ?? null,
        status: i.fulfillment_status === "in_progress" || i.fulfillment_status === "ready" ? i.fulfillment_status : "received",
      },
    ]);
  }
  return byOrder;
}

/** Delivery address, delivery events and money the customer declared: what places an order on the route. */
export async function loadRouting(db: Db, ids: string[]) {
  const [details, events, payments] = await Promise.all([
    ids.length ? db.from("order_delivery_details").select("order_id, address_text, pickup_point_id").in("order_id", ids) : none,
    ids.length ? db.from("order_delivery_events").select("order_id, type, created_at, created_by").in("order_id", ids) : none,
    ids.length
      ? db
          .from("payments")
          .select("id, order_id, amount, tip_amount, metadata, created_at")
          .eq("provider", "manual")
          .eq("status", "pending")
          .in("order_id", ids)
          .order("created_at", { ascending: true })
      : none,
  ]);
  return {
    events: (events.data ?? []) as any[],
    detailsByOrder: new Map<string, any>((details.data ?? []).map((d: any) => [d.order_id, d])),
    eventsByOrder: groupBy((events.data ?? []) as any[], (e) => e.order_id),
    pendingPayments: (payments.data ?? []) as any[],
    paymentsByOrder: groupBy((payments.data ?? []) as any[], (p) => p.order_id),
  };
}

/** The receipt waiting for review on each order that has one, with a short-lived link to see it. */
export async function loadTransferProofs(
  admin: Admin,
  orderIds: string[],
  options: { sign?: boolean } = {},
): Promise<Map<string, BoardTransferProof>> {
  if (orderIds.length === 0) return new Map();
  const { data } = await asDb(admin)
    .from("order_transfer_proofs")
    .select("id, order_id, file_type, amount_claimed, storage_path, created_at")
    .eq("status", "pending_review")
    .in("order_id", orderIds)
    .order("created_at", { ascending: false });
  const latest = new Map<string, any>();
  for (const proof of data ?? []) if (!latest.has(proof.order_id)) latest.set(proof.order_id, proof);

  const paths = [...latest.values()].map((p) => p.storage_path).filter(Boolean) as string[];
  const signed = paths.length && options.sign !== false
    ? await admin.storage.from(PROOF_BUCKET).createSignedUrls(paths, PROOF_LINK_SECONDS)
    : { data: [] };
  const urlOf = new Map((signed.data ?? []).map((s) => [s.path, s.signedUrl]));

  const proofs = new Map<string, BoardTransferProof>();
  for (const [orderId, p] of latest) {
    proofs.set(orderId, {
      id: p.id,
      amountClaimed: p.amount_claimed === null ? null : Number(p.amount_claimed),
      fileType: p.file_type ?? "",
      createdAt: p.created_at,
      url: (p.storage_path && urlOf.get(p.storage_path)) || null,
    });
  }
  return proofs;
}
