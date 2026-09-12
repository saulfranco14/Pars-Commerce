import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { resolveMergeRequest } from "@/features/qr/services/tableMergeRequestService";
import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";

interface RouteContext {
  params: Promise<{ requestId: string }>;
}

interface RequestBody {
  decision: "approved" | "declined" | "cancelled";
}

/**
 * A customer responds to a merge request.
 *  - approve / decline: only the TARGET order's owner device may decide.
 *  - cancel: only a device on the REQUESTER order may withdraw it.
 * Gated by fingerprint + is_owner.
 */
export async function POST(request: Request, context: RouteContext) {
  const { requestId } = await context.params;
  const fingerprint = request.headers.get("x-fingerprint-id")?.trim() ?? null;
  if (!fingerprint) {
    return NextResponse.json({ error: "Sin dispositivo" }, { status: 400 });
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  if (!["approved", "declined", "cancelled"].includes(body.decision)) {
    return NextResponse.json({ error: "Decisión inválida" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: req } = await admin
    .from("order_merge_requests")
    .select("id, requester_order_id, target_order_id, status")
    .eq("id", requestId)
    .single();
  if (!req) {
    return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
  }

  // Which order does the caller need to belong to for this decision?
  const gateOrderId =
    body.decision === "cancelled" ? req.requester_order_id : req.target_order_id;

  const { data: device } = await admin
    .from("order_devices")
    .select("id, display_name, is_owner")
    .eq("order_id", gateOrderId)
    .eq("device_fingerprint", fingerprint)
    .maybeSingle();

  if (!device) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // approve/decline require the TARGET's owner; cancel only requester membership.
  if (body.decision !== "cancelled" && !device.is_owner) {
    return NextResponse.json(
      { error: "Solo el responsable de la mesa puede aceptar o rechazar." },
      { status: 403 },
    );
  }

  const result = await resolveMergeRequest(admin, {
    requestId,
    decision: body.decision,
    resolvedBy: "owner",
    actorType: "device",
    actorId: device.id,
    actorLabel: device.display_name ?? "Cliente",
    nowIso: new Date().toISOString(),
  });

  if (!result.ok) return serviceErrorToResponse(result.error);

  return NextResponse.json({ success: true, merged: result.data.merged });
}
