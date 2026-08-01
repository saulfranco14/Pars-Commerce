import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/requirePermission";
import { createOrderAddendum } from "@/features/orders/services/orderAddendumService";
import { ORDER_PERMISSIONS } from "@/features/orders/constants/orderPermissions";
import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";

import type { RequestedItem } from "@/features/qr/helpers/buildOrderItemRows";

interface RequestBody {
  parent_order_id: string;
  items: RequestedItem[];
  reason?: string;
}

/**
 * Crea el pedido complementario de uno ya pagado. Adaptador delgado: las
 * reglas viven en `orderAddendumService.createOrderAddendum`.
 *
 * El `tenant_id` NO se recibe del cliente: se lee del pedido padre. Aceptarlo
 * por el body dejaría comprobar el permiso contra un negocio distinto al del
 * pedido que se va a modificar.
 */
export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body.parent_order_id || !Array.isArray(body.items)) {
    return NextResponse.json(
      { error: "parent_order_id e items son requeridos" },
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
  const { data: parent } = await admin
    .from("orders")
    .select("tenant_id")
    .eq("id", body.parent_order_id)
    .maybeSingle();

  if (!parent) {
    return NextResponse.json(
      { error: "No encontramos el pedido original" },
      { status: 404 },
    );
  }

  const permission = await requirePermission(
    user.id,
    parent.tenant_id,
    ORDER_PERMISSIONS.addendum,
  );
  if (!permission) {
    return NextResponse.json(
      {
        error:
          "Solo el propietario del negocio puede agregar a un pedido ya pagado.",
      },
      { status: 403 },
    );
  }

  const result = await createOrderAddendum(admin, {
    parentOrderId: body.parent_order_id,
    actorMembershipId: permission.membershipId,
    actorUserId: user.id,
    items: body.items,
    reason: body.reason ?? null,
  });

  if (!result.ok) return serviceErrorToResponse(result.error);

  return NextResponse.json({
    success: true,
    order_id: result.data.orderId,
    parent_order_id: result.data.parentOrderId,
    total: result.data.total,
  });
}
