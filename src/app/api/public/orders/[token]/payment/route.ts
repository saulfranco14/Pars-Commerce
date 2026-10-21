import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { declareTrackedOrderPayment } from "@/features/orders/services/publicOrderPaymentService";

const METHODS = ["efectivo", "transferencia", "tarjeta"] as const;

// POST { method } — the customer holding /pedido/{token} says how they pay; Caja confirms it.
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let body: { method?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const method = METHODS.find((value) => value === body.method);
  if (!method || !token) return NextResponse.json({ error: "Elige cómo vas a pagar." }, { status: 400 });

  const result = await declareTrackedOrderPayment(createAdminClient(), { token, method });
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json({ success: true, amount: result.data.amount });
}
