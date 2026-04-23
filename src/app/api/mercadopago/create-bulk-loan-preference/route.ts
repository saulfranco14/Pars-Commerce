import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { preferenceClient } from "@/lib/mercadopago";
import { buildPayerFromCustomer } from "@/lib/mercadopagoPayer";
import {
  calcLoanBuyerTotal,
  calcLoanBusinessAbsorbsFee,
  buildBulkPaymentDistribution,
} from "@/lib/loanUtils";
import type {
  CreateBulkLoanPreferencePayload,
  MpFeeAbsorbedBy,
} from "@/types/loans";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://commerce.pars.com.mx";
const WEBHOOK_URL = `${APP_URL}/api/mercadopago/webhook`;

// POST /api/mercadopago/create-bulk-loan-preference
// Genera un único link de MP para pagar múltiples préstamos del mismo cliente
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: CreateBulkLoanPreferencePayload = await request.json();
  const { tenant_id, customer_id, loans: loanItems, mp_fee_absorbed_by } = body;

  if (!tenant_id || !customer_id || !loanItems?.length || !mp_fee_absorbed_by) {
    return NextResponse.json(
      {
        error:
          "tenant_id, customer_id, loans y mp_fee_absorbed_by son requeridos",
      },
      { status: 400 },
    );
  }

  if (loanItems.length < 2) {
    return NextResponse.json(
      { error: "Para pago bulk se necesitan al menos 2 préstamos" },
      { status: 400 },
    );
  }

  // Obtener datos del cliente
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, name, email, phone")
    .eq("id", customer_id)
    .eq("tenant_id", tenant_id)
    .single();

  if (customerError || !customer) {
    return NextResponse.json(
      { error: "Cliente no encontrado" },
      { status: 404 },
    );
  }

  // Obtener y validar cada préstamo
  const loanIds = loanItems.map((l) => l.loan_id);
  const { data: dbLoans, error: loansError } = await supabase
    .from("loans")
    .select("id, concept, amount_pending, status")
    .in("id", loanIds)
    .eq("tenant_id", tenant_id)
    .eq("customer_id", customer_id);

  if (loansError || !dbLoans?.length) {
    return NextResponse.json(
      { error: "Error obteniendo los préstamos" },
      { status: 500 },
    );
  }

  // Validar que todos los loans existen y no están pagados/cancelados
  for (const item of loanItems) {
    const dbLoan = dbLoans.find((l) => l.id === item.loan_id);
    if (!dbLoan) {
      return NextResponse.json(
        { error: `Préstamo ${item.loan_id} no encontrado` },
        { status: 404 },
      );
    }
    if (dbLoan.status === "paid") {
      return NextResponse.json(
        { error: `El préstamo "${dbLoan.concept}" ya está pagado` },
        { status: 400 },
      );
    }
    if (dbLoan.status === "cancelled") {
      return NextResponse.json(
        { error: `El préstamo "${dbLoan.concept}" está cancelado` },
        { status: 400 },
      );
    }
    if (item.amount > dbLoan.amount_pending) {
      return NextResponse.json(
        {
          error: `El monto para "${dbLoan.concept}" supera el saldo pendiente`,
        },
        { status: 400 },
      );
    }
  }

  // Construir distribución y items para MP
  const loansWithConcept = loanItems.map((item) => ({
    loan_id: item.loan_id,
    concept: dbLoans.find((l) => l.id === item.loan_id)!.concept,
    amount: item.amount,
  }));

  const {
    totalAmount,
    distribution,
    items: mpItems,
  } = buildBulkPaymentDistribution(loansWithConcept);

  // Calcular comisión según quién la absorbe
  const feeCalc =
    (mp_fee_absorbed_by as MpFeeAbsorbedBy) === "customer"
      ? calcLoanBuyerTotal(totalAmount)
      : calcLoanBusinessAbsorbsFee(totalAmount);

  const { buyerTotal, mpFee } = feeCalc;

  // Si cliente absorbe comisión, agregar como ítem extra en MP
  const finalItems = [...mpItems];
  if ((mp_fee_absorbed_by as MpFeeAbsorbedBy) === "customer" && mpFee > 0) {
    finalItems.push({
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
        items: finalItems,
        payer: buildPayerFromCustomer({
          customerName: customer.name,
          customerEmail: customer.email ?? undefined,
          customerPhone: customer.phone ?? undefined,
        }),
        back_urls: {
          success: `${APP_URL}/dashboard`,
          failure: `${APP_URL}/dashboard`,
          pending: `${APP_URL}/dashboard`,
        },
        auto_return: "approved",
        notification_url: WEBHOOK_URL,
        // El external_reference identifica este como pago bulk
        external_reference: `bulk_loan:${loanIds.join(",")}`,
        statement_descriptor: "PARS COMMERCE",
        payment_methods: {
          installments: 12,
        },
      },
    });
  } catch (err) {
    console.error("[create-bulk-loan-preference] Error en MP:", err);
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

  // Registrar el bulk payment en BD para que el webhook sepa cómo distribuir
  const { error: bulkError } = await supabase
    .from("loan_bulk_payments")
    .insert({
      tenant_id,
      customer_id,
      mp_preference_id: preference.id,
      total_amount: totalAmount,
      loan_ids: loanIds,
      distribution,
      created_by: user.id,
    });

  if (bulkError) {
    console.error(
      "[create-bulk-loan-preference] Error guardando bulk payment:",
      bulkError,
    );
    return NextResponse.json(
      { error: "Error guardando el pago bulk" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    payment_link: preference.init_point,
    preference_id: preference.id,
    buyer_total: buyerTotal,
    mp_fee: mpFee,
    vendor_amount: totalAmount,
    distribution,
  });
}
