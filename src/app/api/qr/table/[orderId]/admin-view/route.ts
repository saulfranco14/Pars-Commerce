import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/requirePermission";
import { getTableAdminView } from "@/features/qr/services/tableAdminViewService";

interface RouteContext {
  params: Promise<{ orderId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
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
  const { order, view } = await getTableAdminView(admin, orderId);

  if (!order || !view) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  const permission = await requirePermission(user.id, order.tenant_id, "qr.read");
  if (!permission) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(view);
}
