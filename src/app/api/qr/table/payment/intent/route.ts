import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  createPaymentIntent,
  type IntentMethod,
} from "@/features/qr/services/tablePaymentService";
import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";

interface RequestBody {
  order_id: string;
  group_id?: string | null;
  method: IntentMethod;
  /** Anonymous customer phone to link the ticket (optional). */
  customer_phone?: string;
}

function isIntentMethod(value: unknown): value is IntentMethod {
  return (
    value === "efectivo" || value === "transferencia" || value === "tarjeta"
  );
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body.order_id || !isIntentMethod(body.method)) {
    return NextResponse.json(
      { error: "order_id y método válido son requeridos" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const fingerprint = request.headers.get("x-fingerprint-id")?.trim() || null;

  const result = await createPaymentIntent(admin, {
    orderId: body.order_id,
    groupId: body.group_id ?? null,
    method: body.method,
    fingerprint,
    customerPhone: body.customer_phone ?? null,
  });

  if (!result.ok) return serviceErrorToResponse(result.error);

  return NextResponse.json({
    success: true,
    payment_id: result.data.paymentId,
    split_group_id: result.data.splitGroupId,
    amount: result.data.amount,
    method: result.data.method,
    status: "pending_validation",
  });
}
