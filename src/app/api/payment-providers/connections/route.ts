import { NextResponse } from "next/server";

import { requirePermission } from "@/lib/auth/requirePermission";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listSafeConnections } from "@/features/payment-providers/connectionService";

export async function GET(request: Request) {
  const tenantId = new URL(request.url).searchParams.get("tenant_id");
  if (!tenantId) return NextResponse.json({ error: "tenant_id es requerido" }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const membership = await requirePermission(user.id, tenantId, "settings.read");
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    return NextResponse.json(await listSafeConnections(createAdminClient(), tenantId));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No fue posible obtener las conexiones" }, { status: 500 });
  }
}
