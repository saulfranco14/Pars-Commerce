import { NextResponse } from "next/server";

import { requirePermission } from "@/lib/auth/requirePermission";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { asPaymentProviderAdmin, getConnectedMercadoPagoConnection } from "@/features/payment-providers/connectionService";
import { cancelMercadoPagoPointOrder } from "@/features/payment-providers/mercadoPagoProvider";

export async function POST(request: Request, context: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = asPaymentProviderAdmin(createAdminClient());
  const { data: attempt } = await admin.from("order_payment_attempts")
    .select("id, tenant_id, provider_connection_id, provider_reference, metadata, status")
    .eq("id", attemptId).maybeSingle();
  if (!attempt) return NextResponse.json({ error: "No encontramos ese intento de cobro" }, { status: 404 });
  const allowed = await requirePermission(user.id, attempt.tenant_id, "payments.write");
  if (!allowed) return NextResponse.json({ error: "Tu rol no puede cancelar cobros" }, { status: 403 });
  if (attempt.status === "approved" || attempt.status === "cancelled") return NextResponse.json({ error: "Este cobro ya no se puede cancelar" }, { status: 409 });
  const terminalId = (attempt.metadata as Record<string, unknown> | null)?.terminal_id;
  if (typeof terminalId !== "string" || !attempt.provider_reference || !attempt.provider_connection_id) {
    return NextResponse.json({ error: "Este intento no corresponde a un cobro Point cancelable" }, { status: 409 });
  }
  try {
    const { connection, accessToken } = await getConnectedMercadoPagoConnection(admin, attempt.tenant_id);
    if (connection.id !== attempt.provider_connection_id) return NextResponse.json({ error: "La conexión de esta terminal cambió" }, { status: 409 });
    const { data: terminal } = await admin.from("payment_provider_terminals")
      .select("provider_terminal_id")
      .eq("id", terminalId).eq("connection_id", connection.id).maybeSingle();
    if (!terminal) return NextResponse.json({ error: "No encontramos la terminal Point" }, { status: 404 });
    await cancelMercadoPagoPointOrder({ accessToken, terminalId: terminal.provider_terminal_id, providerOrderId: attempt.provider_reference });
    const now = new Date().toISOString();
    await admin.from("order_payment_attempts").update({ status: "cancelled", updated_at: now }).eq("id", attempt.id);
    await admin.from("payments").update({ status: "cancelled", reconciliation_status: "not_required", updated_at: now }).eq("attempt_id", attempt.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No fue posible cancelar en Point" }, { status: 500 });
  }
}
