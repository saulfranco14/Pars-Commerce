import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashDeviceFingerprint } from "@/lib/customers/customerIdentity";

export async function POST(request: Request) {
  const fingerprint = request.headers.get("x-fingerprint-id")?.trim();
  const { qr_token, customer_id } = await request.json() as { qr_token?: string; customer_id?: string };
  if (!fingerprint || !qr_token || !customer_id) return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  const admin = createAdminClient();
  const { data: qr } = await admin.from("qr_codes").select("tenant_id").eq("token", qr_token).maybeSingle();
  if (!qr) return NextResponse.json({ error: "QR no disponible" }, { status: 404 });
  const { data: customer } = await admin.from("customers").select("id, name, normalized_phone").eq("id", customer_id).eq("tenant_id", qr.tenant_id).maybeSingle() as unknown as { data: { id: string; name: string; normalized_phone: string | null } | null };
  if (!customer) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  const now = new Date().toISOString();
  const deviceHash = hashDeviceFingerprint(fingerprint);
  const { data: existingDevice } = await admin.from("customer_devices" as never).select("id").eq("tenant_id", qr.tenant_id).eq("device_hash", deviceHash).is("revoked_at", null).maybeSingle() as unknown as { data: { id: string } | null };
  if (existingDevice) {
    await admin.from("customer_devices" as never).update({ customer_id: customer.id, last_seen_at: now, updated_at: now } as never).eq("id", existingDevice.id);
  } else {
    await admin.from("customer_devices" as never).insert({ tenant_id: qr.tenant_id, customer_id: customer.id, device_hash: deviceHash, last_seen_at: now } as never);
  }
  return NextResponse.json({ customer: { id: customer.id, name: customer.name, phone_last4: customer.normalized_phone?.slice(-4) ?? null } });
}
