import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { preferenceClient } from "@/lib/mercadopago";
import { buildPayerFromCustomer } from "@/lib/mercadopagoPayer";
import {
  calcLoanBuyerTotal,
  calcLoanBusinessAbsorbsFee,
} from "@/lib/loanUtils";
import type {
  CreateLoanPreferencePayload,
  MpFeeAbsorbedBy,
} from "@/types/loans";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://commerce.pars.com.mx";
const WEBHOOK_URL = `${APP_URL}/api/mercadopago/webhook`;

// POST /api/mercadopago/create-loan-preference
// Genera un link de pago de MP para un préstamo (puede ser monto parcial)
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: CreateLoanPreferencePayload = await request.json();
  const { loan_id, amount, mp_fee_absorbed_by } = body;

  if (!loan_id || !amount || !mp_fee_absorbed_by) {
    return NextResponse.json(
      { error: "loan_id, amount y mp_fee_absorbed_by son requeridos" },
      { status: 400 },
    );
  }

  if (amount <= 0) {
    return NextResponse.json(
      { error: "El monto debe ser mayor a 0" },
      { status: 400 },
    );
  }

  // Obtener préstamo con cliente
  const { data: loan, error: loanError } = await supabase
    .from("loans")
    .select(
      `
      id, tenant_id, concept, amount_pending, status,
      customer:customers(id, name, email, phone)
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

  if (loan.status === "paid") {
    return NextResponse.json(
      { error: "Este préstamo ya está pagado" },
      { status: 400 },
    );
  }

  if (loan.status === "cancelled") {
    return NextResponse.json(
      { error: "Este préstamo está cancelado" },
      { status: 400 },
    );
  }

  if (amount > loan.amount_pending) {
    return NextResponse.json(
      {
        error: `El monto ($${amount}) supera el saldo pendiente ($${loan.amount_pending})`,
      },
      { status: 400 },
    );
  }

  const customer = loan.customer as unknown as {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  };

  if (!customer?.name) {
    return NextResponse.json(
      { error: "El cliente no tiene nombre registrado" },
      { status: 400 },
    );
  }

  // Calcular montos según quién absorbe la comisión de MP
  const feeCalc =
    (mp_fee_absorbed_by as MpFeeAbsorbedBy) === "customer"
      ? calcLoanBuyerTotal(amount)
      : calcLoanBusinessAbsorbsFee(amount);

  const { buyerTotal, mpFee, vendorReceives } = feeCalc;

  // Construir items de la preference
  const items: Array<{
    id: string;
    title: string;
    quantity: number;
    unit_price: number;
    currency_id: string;
  }> = [
    {
      id: loan_id,
      title: loan.concept,
      quantity: 1,
      unit_price: amount,
      currency_id: "MXN",
    },
  ];

  // Si el cliente absorbe la comisión, agregar el cargo de MP como ítem separado
  if ((mp_fee_absorbed_by as MpFeeAbsorbedBy) === "customer" && mpFee > 0) {
    items.push({
      id: "mp-fee",
      title: "Comisión MercadoPago",
      quantity: 1,
      unit_price: mpFee,
      currency_id: "MXN",
    });
  }

  // Crear preference en MP
  let preference;
  try {
    preference = await preferenceClient.create({
      body: {
        items,
        payer: buildPayerFromCustomer({
          customerName: customer.name,
          customerEmail: customer.email ?? "",
          customerPhone: customer.phone ?? undefined,
        }),
        back_urls: {
          success: `${APP_URL}/pago/exito`,
          failure: `${APP_URL}/pago/exito`,
          pending: `${APP_URL}/pago/exito`,
        },
        notification_url: WEBHOOK_URL,
        external_reference: `loan:${loan_id}`,
        statement_descriptor: "PARS COMMERCE",
      },
    });
  } catch (err) {
    console.error(
      "[create-loan-preference] Error creando preference en MP:",
      err,
    );
    return NextResponse.json(
      { error: "Error al generar el link de pago" },
      { status: 500 },
    );
  }

  if (!preference?.id || !preference?.init_point) {
    return NextResponse.json(
      { error: "Respuesta inválida de MercadoPago" },
      { status: 500 },
    );
  }

  // Guardar link y preference_id en el préstamo
  const { error: updateError } = await supabase
    .from("loans")
    .update({
      last_payment_link: preference.init_point,
      last_mp_preference_id: preference.id,
      mp_fee_absorbed_by,
      updated_at: new Date().toISOString(),
    })
    .eq("id", loan_id);

  if (updateError) {
    console.error(
      "[create-loan-preference] Error actualizando loan:",
      updateError,
    );
  }

  return NextResponse.json({
    payment_link: preference.init_point,
    preference_id: preference.id,
    buyer_total: buyerTotal,
    mp_fee: mpFee,
    vendor_amount: vendorReceives,
  });
}
