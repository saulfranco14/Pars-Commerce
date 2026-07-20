/**
 * Consent-based table merge. Instead of one table absorbing another instantly,
 * table A creates a *request* against table B; B's responsible device (owner)
 * — or any staff member — approves it, and only then does the merge run.
 * Requests auto-expire after a short window so unanswered ones don't linger.
 *
 * The actual re-parenting lives in `tableMergeService.mergeTables`; this module
 * owns the request lifecycle (create / approve / decline / cancel / expire).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { linkTables } from "@/features/qr/services/tableLinkService";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

/** How long a pending request stays open before it self-expires. */
export const MERGE_REQUEST_TTL_MS = 60_000;

const ACTIVE_STATUSES = ["draft", "assigned", "in_progress"];

export interface PendingMergeRequest {
  id: string;
  requester_order_id: string;
  target_order_id: string;
  requester_label: string | null;
  expires_at: string;
}

/**
 * Lazily flips any pending request past its expiry to "expired". Called at the
 * top of every read/action so we never need a cron. `nowIso` is passed in so
 * the caller controls the clock.
 */
async function expireStale(admin: SupabaseClient, nowIso: string) {
  await admin
    .from("order_merge_requests")
    .update({ status: "expired", resolved_by: "system", updated_at: nowIso })
    .eq("status", "pending")
    .lt("expires_at", nowIso);
}

/* -------------------- Create (table A asks to absorb table B) ------------- */

export interface CreateMergeRequestInput {
  requesterOrderId: string;
  targetOrderId: string;
  requestedByDeviceId: string;
  requesterLabel: string;
  nowIso: string;
  expiresAtIso: string;
}

export async function createMergeRequest(
  admin: SupabaseClient,
  input: CreateMergeRequestInput,
): Promise<ServiceResult<PendingMergeRequest>> {
  await expireStale(admin, input.nowIso);

  if (input.requesterOrderId === input.targetOrderId) {
    return {
      ok: false,
      error: { code: "validation", message: "Elige dos mesas distintas." },
    };
  }

  const { data: orders } = await admin
    .from("orders")
    .select("id, tenant_id, status")
    .in("id", [input.requesterOrderId, input.targetOrderId]);
  const requester = orders?.find((o) => o.id === input.requesterOrderId);
  const target = orders?.find((o) => o.id === input.targetOrderId);

  if (!requester || !target) {
    return {
      ok: false,
      error: { code: "not_found", message: "No encontramos una de las mesas." },
    };
  }
  if (requester.tenant_id !== target.tenant_id) {
    return {
      ok: false,
      error: { code: "forbidden", message: "Las mesas son de otro negocio." },
    };
  }
  for (const o of [requester, target]) {
    if (!ACTIVE_STATUSES.includes(o.status)) {
      return {
        ok: false,
        error: {
          code: "conflict",
          message: "Solo se pueden unir mesas activas.",
        },
      };
    }
  }

  // One live request per (requester, target) pair — don't spam the other table.
  const { data: existing } = await admin
    .from("order_merge_requests")
    .select("id, requester_order_id, target_order_id, requester_label, expires_at")
    .eq("requester_order_id", input.requesterOrderId)
    .eq("target_order_id", input.targetOrderId)
    .eq("status", "pending")
    .maybeSingle();
  if (existing) {
    return { ok: true, data: existing as PendingMergeRequest };
  }

  // Also block if the target already has an incoming pending request — it should
  // resolve that one first.
  const { data: incoming } = await admin
    .from("order_merge_requests")
    .select("id")
    .eq("target_order_id", input.targetOrderId)
    .eq("status", "pending")
    .maybeSingle();
  if (incoming) {
    return {
      ok: false,
      error: {
        code: "conflict",
        message: "Esa mesa ya tiene una solicitud pendiente. Intenta en un momento.",
      },
    };
  }

  const { data: created, error } = await admin
    .from("order_merge_requests")
    .insert({
      tenant_id: requester.tenant_id,
      requester_order_id: input.requesterOrderId,
      target_order_id: input.targetOrderId,
      requested_by_device_id: input.requestedByDeviceId,
      requester_label: input.requesterLabel,
      status: "pending",
      expires_at: input.expiresAtIso,
      updated_at: input.nowIso,
    })
    .select("id, requester_order_id, target_order_id, requester_label, expires_at")
    .single();

  if (error || !created) {
    return {
      ok: false,
      error: { code: "internal", message: error?.message ?? "No se pudo crear la solicitud." },
    };
  }
  return { ok: true, data: created as PendingMergeRequest };
}

/* -------------------- Read (what's pending for a given order) ------------- */

export interface PendingMergeRequests {
  /** Request awaiting THIS order's approval (it is the target). */
  incoming: PendingMergeRequest | null;
  /** Request THIS order sent that's still waiting (it is the requester). */
  outgoing: PendingMergeRequest | null;
}

/**
 * Both pending requests touching an order in ONE read. Expiry is enforced
 * lazily and cheaply: rows past `expires_at` are filtered out locally and only
 * then flipped to "expired" — so the hot polling paths (bill, pulse) do zero
 * writes unless something actually expired.
 */
export async function getPendingMergeRequests(
  admin: SupabaseClient,
  orderId: string,
  nowIso: string,
): Promise<PendingMergeRequests> {
  const { data } = await admin
    .from("order_merge_requests")
    .select(
      "id, requester_order_id, target_order_id, requester_label, expires_at",
    )
    .or(`requester_order_id.eq.${orderId},target_order_id.eq.${orderId}`)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as PendingMergeRequest[];
  const nowMs = Date.parse(nowIso);
  const expired = rows.filter((r) => Date.parse(r.expires_at) <= nowMs);
  if (expired.length > 0) {
    await admin
      .from("order_merge_requests")
      .update({ status: "expired", resolved_by: "system", updated_at: nowIso })
      .in(
        "id",
        expired.map((r) => r.id),
      )
      .eq("status", "pending");
  }

  const live = rows.filter((r) => Date.parse(r.expires_at) > nowMs);
  return {
    incoming: live.find((r) => r.target_order_id === orderId) ?? null,
    outgoing: live.find((r) => r.requester_order_id === orderId) ?? null,
  };
}

/* -------------------- Resolve (approve / decline / cancel) ---------------- */

export interface ResolveMergeRequestInput {
  requestId: string;
  decision: "approved" | "declined" | "cancelled";
  resolvedBy: "owner" | "staff" | "system";
  actorType: "member" | "device";
  actorId?: string | null;
  actorLabel: string;
  nowIso: string;
}

export async function resolveMergeRequest(
  admin: SupabaseClient,
  input: ResolveMergeRequestInput,
): Promise<ServiceResult<{ merged: boolean }>> {
  await expireStale(admin, input.nowIso);

  const { data: req } = await admin
    .from("order_merge_requests")
    .select("id, requester_order_id, target_order_id, status")
    .eq("id", input.requestId)
    .single();

  if (!req) {
    return { ok: false, error: { code: "not_found", message: "Solicitud no encontrada." } };
  }
  if (req.status !== "pending") {
    return {
      ok: false,
      error: { code: "conflict", message: "Esta solicitud ya no está disponible." },
    };
  }

  // Mark the request resolved first so a double-tap can't merge twice.
  await admin
    .from("order_merge_requests")
    .update({ status: input.decision, resolved_by: input.resolvedBy, updated_at: input.nowIso })
    .eq("id", input.requestId)
    .eq("status", "pending");

  if (input.decision !== "approved") {
    return { ok: true, data: { merged: false } };
  }

  // Approved → link the two tables into one shared bill (both stay active).
  const result = await linkTables(admin, {
    primaryOrderId: req.requester_order_id,
    secondaryOrderId: req.target_order_id,
    actorType: input.actorType,
    actorId: input.actorId,
    actorLabel: input.actorLabel,
  });

  if (!result.ok) {
    // Roll the request back to pending so the UI can show the real error.
    await admin
      .from("order_merge_requests")
      .update({ status: "pending", resolved_by: null, updated_at: input.nowIso })
      .eq("id", input.requestId);
    return result;
  }

  return { ok: true, data: { merged: true } };
}
