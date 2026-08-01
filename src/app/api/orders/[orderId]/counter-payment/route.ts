import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/requirePermission";
import { chargeAtCounter } from "@/features/orders/services/counterPaymentService";
import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";

import type { IntentMethod } from "@/features/qr/services/tablePaymentService";

interface RouteContext {
  params: Promise<{ orderId: string }>;
}

function isIntentMethod(value: unknown): value is IntentMethod {
  return (
    value === "efectivo" || value === "transferencia" || value === "tarjeta"
  );
}

/** El mostrador recibe el dinero de un pedido que el cliente no escaneó. */
export async function POST(request: Request, context: RouteContext) {
  const { orderId } = await context.params;

  let body: { method?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!isIntentMethod(body.method)) {
    return NextResponse.json(
      { error: "El método debe ser efectivo, transferencia o tarjeta" },
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

  // El tenant sale del pedido, nunca del cuerpo: tomarlo del body dejaría
  // comprobar el permiso contra otro negocio.
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("tenant_id")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) {
    return NextResponse.json(
      { error: "No encontramos ese pedido" },
      { status: 404 },
    );
  }

  const allowed = await requirePermission(
    user.id,
    order.tenant_id,
    "payments.write",
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Tu rol no puede registrar cobros." },
      { status: 403 },
    );
  }

  const result = await chargeAtCounter(admin, {
    orderId,
    method: body.method,
    actorUserId: user.id,
  });
  if (!result.ok) return serviceErrorToResponse(result.error);

  return NextResponse.json({ success: true, ...result.data });
}
