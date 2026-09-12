import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  createMergeRequest,
  MERGE_REQUEST_TTL_MS,
} from "@/features/qr/services/tableMergeRequestService";
import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";

interface RouteContext {
  params: Promise<{ orderId: string }>;
}

interface RequestBody {
  /** The order to ask to merge into this one (its owner must approve). */
  secondary_order_id: string;
}

/**
 * Customer-initiated merge REQUEST. The caller (a device on the requesting
 * order) asks another table to join; nothing merges yet — the other table's
 * owner (or staff) must approve. Gated by device membership on this order.
 */
export async function POST(request: Request, context: RouteContext) {
  const { orderId } = await context.params;
  const fingerprint = request.headers.get("x-fingerprint-id")?.trim() ?? null;

  if (!fingerprint) {
    return NextResponse.json(
      { error: "No pudimos identificar tu dispositivo." },
      { status: 400 },
    );
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  if (!body.secondary_order_id) {
    return NextResponse.json({ error: "Falta la mesa a unir" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Gate: caller must be a device on the requesting order.
  const { data: device } = await admin
    .from("order_devices")
    .select("id, display_name")
    .eq("order_id", orderId)
    .eq("device_fingerprint", fingerprint)
    .maybeSingle();
  if (!device) {
    return NextResponse.json(
      { error: "Solo alguien en esta mesa puede unirla con otra." },
      { status: 403 },
    );
  }

  const now = Date.now();
  const result = await createMergeRequest(admin, {
    requesterOrderId: orderId,
    targetOrderId: body.secondary_order_id,
    requestedByDeviceId: device.id,
    requesterLabel: device.display_name ?? "Cliente",
    nowIso: new Date(now).toISOString(),
    expiresAtIso: new Date(now + MERGE_REQUEST_TTL_MS).toISOString(),
  });

  if (!result.ok) return serviceErrorToResponse(result.error);

  return NextResponse.json({ success: true, request: result.data });
}
