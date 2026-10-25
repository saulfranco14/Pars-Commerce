import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { request_type?: string; details?: string; tenant_id?: string } | null;
  if (!body || !["access", "rectification", "cancellation", "opposition", "revocation"].includes(body.request_type ?? "")) return NextResponse.json({ error: "Selecciona una solicitud válida." }, { status: 400 });
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Inicia sesión para enviar la solicitud." }, { status: 401 });
  const dueAt = new Date(); dueAt.setDate(dueAt.getDate() + 20);
  const admin = createAdminClient();
  const { data, error } = await admin.from("privacy_requests" as never).insert({ tenant_id: body.tenant_id ?? null, requested_by: user.id, request_type: body.request_type, contact_email: user.email, details: body.details?.slice(0, 3000) || null, due_at: dueAt.toISOString() } as never).select("id, status, created_at").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ request: data }, { status: 201 });
}
