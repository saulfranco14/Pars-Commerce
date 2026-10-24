import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { asLegalAdmin, getOwnerMembership } from "@/features/legal/legalActivation";
import { buildTenantDataExport } from "@/features/legal/dataExport";

type Context = { params: Promise<{ tenantId: string }> };

export async function POST(request: Request, { params }: Context) {
  const { tenantId } = await params;
  const body = await request.json().catch(() => ({})) as { note?: string };
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = asLegalAdmin(createAdminClient());
  if (!(await getOwnerMembership(admin, tenantId, user.id))) return NextResponse.json({ error: "Sólo el propietario puede solicitar el cierre." }, { status: 403 });
  try {
    const exported = await buildTenantDataExport(admin, tenantId, user.id);
    const { data: closure, error } = await admin.from("legal_closure_requests").insert({ tenant_id: tenantId, requested_by: user.id, status: "ready_to_close", export_id: exported.exportId, note: body.note?.slice(0, 1200) || null }).select("id, status, created_at").single();
    if (error) throw new Error(error.message);
    // The request stops new public orders now. Destructive deletion remains a
    // separate, reviewed operation after the retention matrix is approved.
    await admin.from("tenants").update({ accepting_orders: false, updated_at: new Date().toISOString() }).eq("id", tenantId);
    return NextResponse.json({ closure, export_id: exported.exportId, status: "ready_to_close" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No pudimos solicitar el cierre." }, { status: 500 });
  }
}
