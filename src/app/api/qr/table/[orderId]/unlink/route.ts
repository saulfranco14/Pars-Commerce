import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/requirePermission";
import { unlinkTable } from "@/features/qr/services/tableLinkService";
import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";

interface RouteContext {
  params: Promise<{ orderId: string }>;
}

/**
 * Staff action: separate this table from its linked group. Both tables keep
 * their own bill again. Requires `qr.write`.
 */
export async function POST(request: Request, context: RouteContext) {
  const { orderId } = await context.params;

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("tenant_id")
    .eq("id", orderId)
    .single();
  if (!order) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  const permission = await requirePermission(user.id, order.tenant_id, "qr.write");
  if (!permission) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await unlinkTable(admin, orderId, {
    actorType: "member",
    actorId: user.id,
    actorLabel: "personal",
  });

  if (!result.ok) return serviceErrorToResponse(result.error);

  return NextResponse.json({ success: true, ...result.data });
}
