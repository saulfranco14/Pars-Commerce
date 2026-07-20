import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/requirePermission";
import { linkTables } from "@/features/qr/services/tableLinkService";
import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";

interface RouteContext {
  params: Promise<{ orderId: string }>;
}

interface RequestBody {
  /** The order to absorb into the one in the URL (which survives). */
  secondary_order_id: string;
}

/**
 * Staff action: merge another active table order into this one, producing a
 * single combined bill. Requires `qr.write` on the tenant. The order in the
 * URL is the primary (survivor); `secondary_order_id` is absorbed.
 */
export async function POST(request: Request, context: RouteContext) {
  const { orderId } = await context.params;

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  if (!body.secondary_order_id) {
    return NextResponse.json(
      { error: "Falta la mesa a unir" },
      { status: 400 },
    );
  }

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

  const result = await linkTables(admin, {
    primaryOrderId: orderId,
    secondaryOrderId: body.secondary_order_id,
    actorType: "member",
    actorId: user.id,
    actorLabel: "personal",
  });

  if (!result.ok) return serviceErrorToResponse(result.error);

  return NextResponse.json({ success: true, ...result.data });
}
