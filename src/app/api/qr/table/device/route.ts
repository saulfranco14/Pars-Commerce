import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

interface RequestBody {
  qr_token: string;
  display_name: string;
}

/**
 * Upsert the display_name of the current device in order_devices.
 * Identifies the device via the x-fingerprint-id header and ensures the
 * device row exists, creating it if the customer set their name before
 * resolve created the row (race-condition safe).
 */
export async function PATCH(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const fingerprint = request.headers.get("x-fingerprint-id")?.trim();
  const displayName = body.display_name?.trim();

  if (!body.qr_token || !fingerprint || !displayName) {
    return NextResponse.json(
      { error: "qr_token, fingerprint y display_name son requeridos" },
      { status: 400 },
    );
  }

  if (displayName.length > 40) {
    return NextResponse.json(
      { error: "El nombre no puede tener más de 40 caracteres" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  const { data: qrCode } = await admin
    .from("qr_codes")
    .select("id, current_order_id, kind, is_active")
    .eq("token", body.qr_token)
    .eq("kind", "table")
    .single();

  if (!qrCode || !qrCode.is_active || !qrCode.current_order_id) {
    return NextResponse.json(
      { error: "Mesa no encontrada o inactiva" },
      { status: 404 },
    );
  }

  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("order_devices")
    .update({ display_name: displayName, last_seen_at: now, updated_at: now })
    .eq("order_id", qrCode.current_order_id)
    .eq("device_fingerprint", fingerprint)
    .select("id, display_name, color_hex, joined_at, last_seen_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { error: "Dispositivo no registrado. Vuelve a escanear el QR." },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true, device: data });
}
