import { NextResponse } from "next/server";

import { requirePermission } from "@/lib/auth/requirePermission";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncMercadoPagoPointTerminals } from "@/features/payment-providers/connectionService";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { tenant_id?: unknown } | null;
  const tenantId = typeof body?.tenant_id === "string" ? body.tenant_id : "";
  if (!tenantId) return NextResponse.json({ error: "tenant_id es requerido" }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const membership = await requirePermission(user.id, tenantId, "settings.write");
  if (!membership || membership.roleName !== "owner") return NextResponse.json({ error: "Solo el propietario puede sincronizar terminales" }, { status: 403 });
  try {
    const count = await syncMercadoPagoPointTerminals(createAdminClient(), tenantId);
    return NextResponse.json({ success: true, terminals: count });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No pudimos sincronizar Point" }, { status: 409 });
  }
}
