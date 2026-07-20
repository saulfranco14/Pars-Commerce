import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/requirePermission";
import { rejectPayment } from "@/features/qr/services/tablePaymentService";
import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";

interface RouteContext {
  params: Promise<{ paymentId: string }>;
}

interface RequestBody {
  reason?: string;
}

export async function POST(request: Request, context: RouteContext) {
  const { paymentId } = await context.params;
  let body: RequestBody = {};
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    /* optional body */
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
  const { data: payment } = await admin
    .from("payments")
    .select("id, order_id")
    .eq("id", paymentId)
    .single();
  if (!payment) {
    return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
  }
  const { data: order } = await admin
    .from("orders")
    .select("tenant_id")
    .eq("id", payment.order_id)
    .single();
  if (!order) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }
  const allowed = await requirePermission(user.id, order.tenant_id, "qr.write");
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await rejectPayment(admin, {
    paymentId,
    actorUserId: user.id,
    reason: body.reason?.trim() || null,
  });
  if (!result.ok) return serviceErrorToResponse(result.error);

  return NextResponse.json({ success: true });
}
