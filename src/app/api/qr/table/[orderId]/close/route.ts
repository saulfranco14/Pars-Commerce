import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/requirePermission";
import {
  closeTableOrder,
  isCloseReason,
  type CloseReason,
} from "@/features/qr/services/tableCloseService";
import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";

interface RouteContext {
  params: Promise<{ orderId: string }>;
}

interface RequestBody {
  reason: CloseReason;
  reason_details?: string;
}

export async function POST(request: Request, context: RouteContext) {
  const { orderId } = await context.params;
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!isCloseReason(body.reason)) {
    return NextResponse.json(
      { error: "Motivo de cierre inválido" },
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

  // Resolve tenant to check permission before doing any write.
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

  const result = await closeTableOrder(admin, {
    orderId,
    reason: body.reason,
    reasonDetails: body.reason_details,
    actorUserId: user.id,
    membershipId: permission.membershipId,
  });

  if (!result.ok) return serviceErrorToResponse(result.error);

  return NextResponse.json({ success: true, closed_at: result.data.closedAt });
}
