import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireDevice } from "@/lib/auth/requireDevice";
import { createKioskOrder } from "@/features/dispositivos/services/kioskOrderService";
import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";

import type { RequestedItem } from "@/features/qr/helpers/buildOrderItemRows";

/**
 * La pantalla levanta un pedido. El `tenant_id` sale del token del dispositivo,
 * nunca del cuerpo: aceptarlo por el body dejaría crear pedidos en otro negocio.
 */
export async function POST(request: Request) {
  const device = await requireDevice();
  if (!device) {
    return NextResponse.json(
      { error: "Esta pantalla no está autorizada" },
      { status: 401 },
    );
  }

  let body: {
    items?: RequestedItem[];
    customer_name?: string;
    scheduled_for?: string | null;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!Array.isArray(body.items)) {
    return NextResponse.json({ error: "items es requerido" }, { status: 400 });
  }

  const result = await createKioskOrder(createAdminClient(), {
    deviceId: device.deviceId,
    tenantId: device.tenantId,
    items: body.items,
    customerName: body.customer_name ?? null,
    scheduledFor: body.scheduled_for ?? null,
  });

  if (!result.ok) return serviceErrorToResponse(result.error);

  return NextResponse.json({
    success: true,
    order_id: result.data.orderId,
    qr_token: result.data.qrToken,
    order_number: result.data.orderNumber,
    total: result.data.total,
  });
}
