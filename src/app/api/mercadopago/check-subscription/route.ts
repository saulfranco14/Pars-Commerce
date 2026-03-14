import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/mercadopago/check-subscription?loan_id=xxx
// Consulta el estado actual de la suscripción en MP y sincroniza con la DB
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const loanId = searchParams.get("loan_id");

  if (!loanId) {
    return NextResponse.json({ error: "loan_id es requerido" }, { status: 400 });
  }

  const { data: loan } = await supabase
    .from("loans")
    .select("id, mp_preapproval_id, payment_plan_status")
    .eq("id", loanId)
    .single();

  if (!loan) {
    return NextResponse.json({ error: "Préstamo no encontrado" }, { status: 404 });
  }

  if (!loan.mp_preapproval_id) {
    return NextResponse.json({
      loan_id: loan.id,
      mp_status: null,
      plan_status: loan.payment_plan_status,
      message: "Este préstamo no tiene suscripción de MP",
    });
  }

  // Consultar estado actual en MP
  let mpData;
  try {
    const mpRes = await fetch(
      `https://api.mercadopago.com/preapproval/${loan.mp_preapproval_id}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        },
      },
    );

    const mpBody = await mpRes.text();

    if (!mpRes.ok) {
      console.error(
        `[check-subscription] MP API error ${mpRes.status} for preapproval ${loan.mp_preapproval_id}:`,
        mpBody,
      );

      // Error 400 "not valid for callerId" = el token actual no creó esta suscripción
      // Esto pasa cuando se consulta desde un entorno diferente al que la creó
      if (mpRes.status === 400 && mpBody.includes("not valid for callerId")) {
        return NextResponse.json(
          {
            error: "No se puede verificar esta suscripción desde este entorno. La verificación automática vía webhook funcionará correctamente en producción.",
            mp_preapproval_id: loan.mp_preapproval_id,
            plan_status: loan.payment_plan_status,
          },
          { status: 422 },
        );
      }

      return NextResponse.json(
        {
          error: `Error consultando MP (${mpRes.status})`,
          mp_detail: mpBody,
          mp_preapproval_id: loan.mp_preapproval_id,
        },
        { status: 502 },
      );
    }

    mpData = JSON.parse(mpBody);
  } catch (err) {
    console.error("[check-subscription] Error fetching from MP:", err);
    return NextResponse.json(
      { error: "Error de red consultando MercadoPago" },
      { status: 502 },
    );
  }
  const mpStatus: string = mpData.status; // "authorized", "paused", "cancelled", "pending"

  // Mapear y sincronizar
  const statusMap: Record<string, string> = {
    authorized: "active",
    paused: "paused",
    cancelled: "cancelled",
    pending: "pending_setup",
  };

  const newPlanStatus = statusMap[mpStatus] ?? loan.payment_plan_status;

  if (newPlanStatus !== loan.payment_plan_status) {
    await supabase
      .from("loans")
      .update({
        payment_plan_status: newPlanStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", loan.id);
  }

  return NextResponse.json({
    loan_id: loan.id,
    mp_preapproval_id: loan.mp_preapproval_id,
    mp_status: mpStatus,
    plan_status: newPlanStatus,
    synced: newPlanStatus !== loan.payment_plan_status,
    payer_email: mpData.payer_email ?? null,
    next_payment_date: mpData.next_payment_date ?? null,
  });
}
