import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  payFullOrder,
  type CheckoutMethod,
} from "@/features/qr/services/tablePaymentService";
import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";

interface RouteContext {
  params: Promise<{ orderId: string }>;
}

interface RequestBody {
  method: CheckoutMethod;
}

function isCheckoutMethod(value: unknown): value is CheckoutMethod {
  return (
    value === "efectivo" ||
    value === "transferencia" ||
    value === "tarjeta" ||
    value === "mercadopago"
  );
}

/**
 * Settle the full balance of a table order in one shot (no split).
 * The business rules — validating status, blocking when a split exists,
 * recording the payment, logging activity and releasing the QR — live in
 * `tablePaymentService.payFullOrder`. This route only adapts HTTP.
 */
export async function POST(request: Request, context: RouteContext) {
  const { orderId } = await context.params;
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!isCheckoutMethod(body.method)) {
    return NextResponse.json(
      { error: "Método de pago no válido" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const result = await payFullOrder(admin, { orderId, method: body.method });
  if (!result.ok) return serviceErrorToResponse(result.error);

  return NextResponse.json({
    success: true,
    already_paid: result.data.alreadyPaid,
    amount: result.data.amount,
    method: body.method,
    paid_at: result.data.paidAt,
  });
}
