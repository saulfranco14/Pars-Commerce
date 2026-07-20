import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  payGroup,
  type CheckoutMethod,
} from "@/features/qr/services/tablePaymentService";
import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";

interface RouteContext {
  params: Promise<{ groupId: string }>;
}

interface SplitCheckoutBody {
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

export async function POST(request: Request, context: RouteContext) {
  const { groupId } = await context.params;
  let body: SplitCheckoutBody;
  try {
    body = (await request.json()) as SplitCheckoutBody;
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
  const result = await payGroup(admin, { groupId, method: body.method });
  if (!result.ok) return serviceErrorToResponse(result.error);

  return NextResponse.json({
    success: true,
    all_paid: result.data.allPaid,
  });
}
