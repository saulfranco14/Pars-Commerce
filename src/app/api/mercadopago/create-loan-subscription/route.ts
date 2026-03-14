import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { PreApproval } from "mercadopago";
import { MercadoPagoConfig } from "mercadopago";
import type { CreateLoanSubscriptionPayload } from "@/types/loans";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://commerce.pars.com.mx";

// POST /api/mercadopago/create-loan-subscription
// Crea una suscripción (PreApproval) en MP para cobros automáticos de un préstamo
// El cliente recibe un init_point donde autoriza el cobro y guarda su tarjeta
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: CreateLoanSubscriptionPayload = await request.json();
  const { loan_id, installment_amount, start_date, end_date } = body;

  if (!loan_id || !start_date) {
    return NextResponse.json(
      { error: "loan_id y start_date son requeridos" },
      { status: 400 },
    );
  }

  // Obtener el préstamo con su plan y datos del cliente
  const { data: loan, error: loanError } = await supabase
    .from("loans")
    .select(
      `
      id, tenant_id, concept, amount_pending, status,
      payment_plan_type, payment_plan_frequency, payment_plan_frequency_type,
      payment_plan_installment_amount, payment_plan_status,
      customer:customers(id, name, email)
    `,
    )
    .eq("id", loan_id)
    .single();

  if (loanError || !loan) {
    return NextResponse.json(
      { error: "Préstamo no encontrado" },
      { status: 404 },
    );
  }

  if (loan.status === "paid" || loan.status === "cancelled") {
    return NextResponse.json(
      { error: "El préstamo no está activo" },
      { status: 400 },
    );
  }

  if (!loan.payment_plan_type) {
    return NextResponse.json(
      {
        error: "Este préstamo no tiene configurado un plan de cobro automático",
      },
      { status: 400 },
    );
  }

  const customer = loan.customer as unknown as {
    id: string;
    name: string;
    email: string | null;
  };

  if (!customer?.email) {
    return NextResponse.json(
      {
        error:
          "El cliente necesita un email registrado para activar cobros automáticos",
      },
      { status: 400 },
    );
  }

  // Monto por cobro: usar el del body o el configurado en el loan
  const chargeAmount =
    installment_amount ?? loan.payment_plan_installment_amount;

  if (!chargeAmount || chargeAmount <= 0) {
    return NextResponse.json(
      { error: "Se requiere un monto por cobro (installment_amount)" },
      { status: 400 },
    );
  }

  if (!loan.payment_plan_frequency || !loan.payment_plan_frequency_type) {
    return NextResponse.json(
      { error: "El plan de cobro no tiene frecuencia configurada" },
      { status: 400 },
    );
  }

  // Calcular repeticiones si aplica (installments)
  let repetitions: number | undefined;
  if (loan.payment_plan_type === "installments" && chargeAmount > 0) {
    repetitions = Math.ceil(loan.amount_pending / chargeAmount);
  }
  // recurring = sin límite de repeticiones (cobra hasta que se cancele manualmente)

  // Crear PreApproval en MP
  const mpConfig = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  });
  const preApproval = new PreApproval(mpConfig);

  // Si el loan ya tiene una suscripción previa pendiente, intentar cancelarla
  // para permitir crear una nueva (ej: el usuario cambió de opinión o hubo un error)
  const { data: existingLoan } = await supabase
    .from("loans")
    .select("mp_preapproval_id, payment_plan_status")
    .eq("id", loan_id)
    .single();

  if (existingLoan?.mp_preapproval_id && existingLoan.payment_plan_status === "pending_setup") {
    try {
      const cancelRes = await fetch(
        `https://api.mercadopago.com/preapproval/${existingLoan.mp_preapproval_id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "cancelled" }),
        },
      );
      if (!cancelRes.ok) {
        console.warn(
          `[create-loan-subscription] No se pudo cancelar preapproval anterior ${existingLoan.mp_preapproval_id}:`,
          await cancelRes.text(),
        );
      }
    } catch (cancelErr) {
      console.warn("[create-loan-subscription] Error cancelando preapproval anterior:", cancelErr);
    }
  }

  let subscription;
  try {
    subscription = await preApproval.create({
      body: {
        reason: loan.concept,
        payer_email: customer.email,
        back_url: `${APP_URL}/dashboard`,
        status: "pending",
        external_reference: `loan_sub:${loan_id}`,
        auto_recurring: {
          frequency: loan.payment_plan_frequency,
          frequency_type: loan.payment_plan_frequency_type as
            | "months"
            | "weeks",
          transaction_amount: chargeAmount,
          currency_id: "MXN",
          start_date: start_date,
          ...(end_date && { end_date }),
          ...(repetitions && { repetitions }),
        },
      },
    });
  } catch (err: unknown) {
    console.error("[create-loan-subscription] Error en MP PreApproval:", err);

    // Extraer detalle del error de MP para ayudar a diagnosticar
    let mpErrorDetail = "Error al crear la suscripción en MercadoPago";
    if (err && typeof err === "object") {
      const mpErr = err as { message?: string; cause?: unknown; status?: number };
      if (mpErr.message) {
        mpErrorDetail += `: ${mpErr.message}`;
      }
      // El SDK de MP a veces incluye el body de error en cause
      if (mpErr.cause && typeof mpErr.cause === "object") {
        try {
          const causeStr = JSON.stringify(mpErr.cause);
          console.error("[create-loan-subscription] MP error cause:", causeStr);
        } catch { /* ignore */ }
      }
    }

    return NextResponse.json(
      { error: mpErrorDetail },
      { status: 500 },
    );
  }

  if (!subscription?.id || !subscription?.init_point) {
    return NextResponse.json(
      { error: "Respuesta inválida de MercadoPago" },
      { status: 500 },
    );
  }

  // Guardar datos de la suscripción en el préstamo
  const { error: updateError } = await supabase
    .from("loans")
    .update({
      mp_preapproval_id: subscription.id,
      mp_subscription_init_point: subscription.init_point,
      payment_plan_status: "pending_setup",
      updated_at: new Date().toISOString(),
    })
    .eq("id", loan_id);

  if (updateError) {
    console.error(
      "[create-loan-subscription] Error actualizando loan:",
      updateError,
    );
  }

  return NextResponse.json({
    preapproval_id: subscription.id,
    init_point: subscription.init_point, // URL que el cliente debe abrir para guardar su tarjeta
    status: "pending_setup",
  });
}
