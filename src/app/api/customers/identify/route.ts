import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { identifyCustomer } from "@/lib/customers/customerIdentity";

export async function POST(request: Request) {
  const fingerprint = request.headers.get("x-fingerprint-id")?.trim();
  const body = await request.json() as { qr_token?: string; name?: string; phone?: string };
  if (!fingerprint || !body.qr_token || !body.name?.trim() || !body.phone?.trim()) return NextResponse.json({ error: "Nombre, teléfono y QR son requeridos" }, { status: 400 });
  const admin = createAdminClient();
  const { data: qr } = await admin.from("qr_codes").select("tenant_id, kind, is_active, archived_at").eq("token", body.qr_token).maybeSingle();
  if (!qr || !qr.is_active || qr.archived_at) return NextResponse.json({ error: "QR no disponible" }, { status: 404 });
  const result = await identifyCustomer({ admin, tenantId: qr.tenant_id, displayName: body.name, phone: body.phone, fingerprint });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
  return NextResponse.json({ customer: { id: result.customer.id, name: result.customer.name, phone_last4: result.normalizedPhone.slice(-4) } });
}
