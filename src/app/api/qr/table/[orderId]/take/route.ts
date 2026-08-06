import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/requirePermission";

interface RouteContext {
  params: Promise<{ orderId: string }>;
}

/** Assign the attending team member without confusing them with the customer owner. */
export async function POST(_request: Request, context: RouteContext) {
  const { orderId } = await context.params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, tenant_id, status, assigned_to")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || ["paid", "cancelled"].includes(order.status)) {
    return NextResponse.json({ error: "La mesa ya no estÃ¡ disponible" }, { status: 409 });
  }

  const permission = await requirePermission(user.id, order.tenant_id, "order.take");
  if (!permission) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (order.assigned_to && order.assigned_to !== user.id) {
    return NextResponse.json(
      { error: "Esta mesa ya estÃ¡ siendo atendida por otra persona" },
      { status: 409 },
    );
  }

  if (!order.assigned_to) {
    const { error } = await admin
      .from("orders")
      .update({ assigned_to: user.id, updated_at: new Date().toISOString() })
      .eq("id", order.id)
      .is("assigned_to", null);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await admin.from("order_activity_log").insert({
      order_id: order.id,
      actor_type: "member",
      actor_id: user.id,
      actor_label: "personal",
      action: "order.assigned",
      payload: { to: user.id, source: "table_take" },
    });
  }

  return NextResponse.json({ success: true, assigned_to: user.id });
}
