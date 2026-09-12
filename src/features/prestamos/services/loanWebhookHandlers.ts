import { sendEmail } from "@/lib/email/sendgrid";
import { loanPaymentConfirmationTemplate } from "@/lib/email/templates";

type SupabaseAdminClient = ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>;

// =============================================================================
// Utilidad: enviar email de confirmación de pago de préstamo
// =============================================================================
export async function sendLoanPaymentEmail(
  loan: {
    id: string;
    concept: string;
    amount_pending: number | null;
    customer: unknown;
    tenant: unknown;
  },
  amountPaid: number,
  paymentMethod: string,
): Promise<void> {
  const customer = loan.customer as { email: string | null; name: string } | null;
  const tenant = loan.tenant as { name: string } | null;

  if (!customer?.email || !tenant?.name) return;

  const newPending = Math.max(0, (loan.amount_pending ?? 0) - amountPaid);

  try {
    await sendEmail({
      to: customer.email,
      subject: `Pago recibido — ${tenant.name}`,
      html: loanPaymentConfirmationTemplate({
        businessName: tenant.name,
        customerName: customer.name,
        amountPaid,
        amountPending: newPending,
        concept: loan.concept,
        paymentMethod,
        isFullyPaid: newPending <= 0,
      }),
    });
  } catch {
    console.error(`Webhook: error enviando email para loan ${loan.id}`);
  }
}

// =============================================================================
// Handler: pago de préstamo individual por link único
// externalRef formato: "loan:{loanId}"
// =============================================================================
export async function handleSingleLoanPayment(
  supabase: SupabaseAdminClient,
  externalRef: string,
  mpPaymentId: string,
  amount: number,
  mpFeeAmount: number,
  mpNetAmount: number,
): Promise<void> {
  const loanId = externalRef.replace("loan:", "");

  const { data: loan } = await supabase
    .from("loans")
    .select(`
      id, tenant_id, concept, amount_pending, status,
      customer:customers(id, name, email),
      tenant:tenants(name)
    `)
    .eq("id", loanId)
    .single();

  if (!loan || loan.status === "paid" || loan.status === "cancelled") {
    console.warn(`Webhook: loan ${loanId} not found or already closed`);
    return;
  }

  const { error: insertError } = await supabase.from("loan_payments").insert({
    loan_id: loanId,
    tenant_id: loan.tenant_id,
    amount: Math.min(amount, loan.amount_pending ?? 0),
    payment_method: "mercadopago",
    source: "mercadopago_webhook",
    mp_payment_id: mpPaymentId,
    mp_fee_amount: mpFeeAmount,
    mp_net_amount: mpNetAmount,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      console.warn(`Webhook: duplicate mp_payment_id ${mpPaymentId}, skipping`);
      return;
    }
    console.error("Webhook: error insertando loan_payment:", insertError);
    return;
  }

  await sendLoanPaymentEmail(loan, amount, "mercadopago");
  console.log(`Webhook: loan ${loanId} payment registered (${mpPaymentId})`);
}

// =============================================================================
// Handler: pago bulk (varios préstamos en un link)
// Identifica el bulk payment por mp_preference_id guardado en loan_bulk_payments
// =============================================================================
export async function handleBulkLoanPayment(
  supabase: SupabaseAdminClient,
  preferenceId: string,
  mpPaymentId: string,
  totalAmount: number,
  mpFeeAmount: number,
): Promise<void> {
  const { data: bulk } = await supabase
    .from("loan_bulk_payments")
    .select("id, tenant_id, customer_id, loan_ids, distribution, status")
    .eq("mp_preference_id", preferenceId)
    .single();

  if (!bulk) {
    console.warn(`Webhook: bulk payment not found for preference ${preferenceId}`);
    return;
  }

  if (bulk.status === "paid") {
    console.warn(`Webhook: bulk payment already paid, skipping`);
    return;
  }

  const distribution = (bulk.distribution ?? {}) as Record<string, number>;

  for (const [loanId, loanAmount] of Object.entries(distribution)) {
    const { error } = await supabase.from("loan_payments").insert({
      loan_id: loanId,
      tenant_id: bulk.tenant_id,
      amount: loanAmount as number,
      payment_method: "mercadopago",
      source: "mercadopago_webhook",
      // Sufijo por loan para mantener unicidad del índice mp_payment_id
      mp_payment_id: `${mpPaymentId}_${loanId}`,
      mp_fee_amount: null,
      mp_net_amount: null,
    });

    if (error && error.code !== "23505") {
      console.error(`Webhook: error en bulk loan_payment para ${loanId}:`, error);
    }
  }

  await supabase
    .from("loan_bulk_payments")
    .update({ mp_payment_id: mpPaymentId, status: "paid" })
    .eq("id", bulk.id);

  try {
    const { data: customer } = await supabase
      .from("customers")
      .select("name, email")
      .eq("id", bulk.customer_id)
      .single();

    const { data: tenant } = await supabase
      .from("tenants")
      .select("name")
      .eq("id", bulk.tenant_id)
      .single();

    if (customer?.email && tenant?.name) {
      await sendEmail({
        to: customer.email,
        subject: `Pagos recibidos — ${tenant.name}`,
        html: loanPaymentConfirmationTemplate({
          businessName: tenant.name,
          customerName: customer.name,
          amountPaid: totalAmount - mpFeeAmount,
          amountPending: 0,
          concept: `${bulk.loan_ids.length} préstamos`,
          paymentMethod: "mercadopago",
          isFullyPaid: true,
          isBulk: true,
        }),
      });
    }
  } catch {
    console.error("Webhook: error enviando email bulk");
  }

  console.log(
    `Webhook: bulk payment ${bulk.id} paid (${mpPaymentId}), ${bulk.loan_ids.length} loans`,
  );
}

// =============================================================================
// Handler: cobro automático de suscripción de préstamo (PreApproval)
// topic = "subscription_authorized_payment" cuando el preapproval pertenece a un loan
// =============================================================================
export async function handlePreapprovalLoanPayment(
  supabase: SupabaseAdminClient,
  authorizedPaymentId: string,
  preapprovalId: string | null,
): Promise<boolean> {
  let loanQuery = supabase
    .from("loans")
    .select(`
      id, tenant_id, concept, amount_pending,
      payment_plan_installment_amount, payment_plan_status,
      mp_preapproval_id,
      customer:customers(id, name, email),
      tenant:tenants(name)
    `)
    .in("payment_plan_status", ["active", "pending_setup"])
    .not("mp_preapproval_id", "is", null);

  if (preapprovalId) {
    loanQuery = loanQuery.eq("mp_preapproval_id", preapprovalId);
  }

  const { data: loan } = await loanQuery.single();
  if (!loan) return false;

  if (loan.payment_plan_status === "pending_setup") {
    await supabase
      .from("loans")
      .update({ payment_plan_status: "active", updated_at: new Date().toISOString() })
      .eq("id", loan.id);
    console.log(`Webhook: loan ${loan.id} auto-activated from pending_setup (payment received)`);
  }

  const chargeAmount = loan.payment_plan_installment_amount ?? 0;
  if (chargeAmount <= 0) return true;

  const actualAmount = Math.min(chargeAmount, loan.amount_pending ?? 0);

  const { error: insertError } = await supabase.from("loan_payments").insert({
    loan_id: loan.id,
    tenant_id: loan.tenant_id,
    amount: actualAmount,
    payment_method: "mercadopago",
    source: "preapproval_webhook",
    mp_payment_id: authorizedPaymentId,
    mp_preapproval_id: loan.mp_preapproval_id,
    mp_fee_amount: null,
    mp_net_amount: null,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      console.warn(`Webhook: duplicate preapproval payment ${authorizedPaymentId}`);
      return true;
    }
    console.error("Webhook: error en preapproval payment:", insertError);
    return true;
  }

  await sendLoanPaymentEmail(loan, actualAmount, "mercadopago");
  console.log(`Webhook: preapproval payment ${authorizedPaymentId} applied to loan ${loan.id}`);
  return true;
}
