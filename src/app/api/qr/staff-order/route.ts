import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/requirePermission";
import { createStaffOrder } from "@/features/qr/services/staffOrderService";
import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";

import type { RequestedItem } from "@/features/qr/helpers/buildOrderItemRows";

interface RequestBody {
  tenant_id: string;
  items: RequestedItem[];
  customer_name?: string;
  customer_phone?: string;
  /** When present, append to this existing table order instead of a new one. */
  table_order_id?: string;
}

/**
 * Staff takes a customer's order: builds an order (or appends to a table order)
 * and mints a single-use 'order' QR the customer scans to review & pay.
 * Thin adapter — rules live in `staffOrderService.createStaffOrder`.
 */
export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body.tenant_id || !Array.isArray(body.items)) {
    return NextResponse.json(
      { error: "tenant_id e items son requeridos" },
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

  const permission = await requirePermission(
    user.id,
    body.tenant_id,
    "order.take",
  );
  if (!permission) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const result = await createStaffOrder(admin, {
    tenantId: body.tenant_id,
    actorMembershipId: permission.membershipId,
    actorUserId: user.id,
    items: body.items,
    customerName: body.customer_name ?? null,
    customerPhone: body.customer_phone ?? null,
    tableOrderId: body.table_order_id ?? null,
  });

  if (!result.ok) return serviceErrorToResponse(result.error);

  return NextResponse.json({
    success: true,
    order_id: result.data.orderId,
    qr_token: result.data.qrToken,
    total: result.data.total,
    linked_to_table: result.data.linkedToTable,
  });
}
