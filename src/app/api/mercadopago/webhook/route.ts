import { createAdminClient } from "@/lib/supabase/admin";
import { paymentClient } from "@/lib/mercadopago";
import { verifyWebhookSignature } from "@/lib/mercadopagoWebhookVerify";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/sendgrid";
import { loanPaymentConfirmationTemplate } from "@/lib/email/templates";

export async function POST(request: Request) {
  let body: {
    type?: string;
    data?: { id?: string };
    action?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");

  if (webhookSecret) {
    const valid = verifyWebhookSignature(
      body,
      xSignature,
      xRequestId,
      webhookSecret,
    );
    if (!valid) {
      console.warn("Webhook: invalid signature, rejecting");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    console.warn("Webhook: MERCADOPAGO_WEBHOOK_SECRET not set in production");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 401 },
    );
  }

  // ── Cambio de estado de suscripción (cliente autorizó / pausó / canceló) ──
  if (body.type === "subscription_preapproval" && body.data?.id) {
    try {
      await handlePreapprovalStatusChange(body.data.id);
    } catch (err) {
      console.error("Webhook: error en subscription_preapproval:", err);
    }
    return NextResponse.json({ received: true });
  }

  // ── Cobro automático de suscripción (PreApproval) ─────────────────────────
  if (body.type === "subscription_authorized_payment" && body.data?.id) {
    try {
      await handlePreapprovalPayment(body.data.id);
    } catch (err) {
      console.error("Webhook: error en subscription_authorized_payment:", err);
    }
    return NextResponse.json({ received: true });
  }

  // Solo procesar notificaciones de pago único
  if (body.type !== "payment" || !body.data?.id) {
    return NextResponse.json({ received: true });
  }

  const paymentId = body.data.id;

  try {
    const mpPayment = await paymentClient.get({ id: paymentId });

    if (!mpPayment || !mpPayment.external_reference) {
      console.warn("Webhook: payment without external_reference", paymentId);
      return NextResponse.json({ received: true });
    }

    const externalRef = mpPayment.external_reference;
    const mpStatus = mpPayment.status;
    const transactionAmount = Number(mpPayment.transaction_amount ?? 0);
    const netReceived =
      Number(
        (mpPayment.transaction_details as { net_received_amount?: number })
          ?.net_received_amount ?? 0,
      ) ?? 0;
    const mpFeeAmount =
      Math.round((transactionAmount - netReceived) * 100) / 100;
    const parsFeeAmount = 0;
    const supabase = createAdminClient();

    // ── Pago bulk de préstamos ────────────────────────────────────────────────
    if (externalRef.startsWith("bulk_loan:")) {
      if (mpStatus === "approved") {
        await handleBulkLoanPayment(
          supabase,
          mpPayment.id ? String(mpPayment.id) : String(paymentId),
          String(paymentId),
          transactionAmount,
          mpFeeAmount,
          netReceived,
        );
      }
      return NextResponse.json({ received: true });
    }

    // ── Pago de préstamo individual ───────────────────────────────────────────
    if (externalRef.startsWith("loan:")) {
      if (mpStatus === "approved") {
        await handleSingleLoanPayment(
          supabase,
          externalRef,
          String(paymentId),
          transactionAmount,
          mpFeeAmount,
          netReceived,
        );
      }
      return NextResponse.json({ received: true });
    }

    // ── Pago de orden normal (flujo existente sin cambios) ────────────────────
    const orderId = externalRef;

    if (mpStatus === "approved") {
      const { data: order } = await supabase
        .from("orders")
        .select("id, assigned_to, created_by, tenant_id")
        .eq("id", orderId)
        .in("status", ["pending_payment", "completed"])
        .single();

      let assignTo: string | null = order?.assigned_to ?? null;
      if (!assignTo && order) {
        assignTo = order.created_by ?? null;
        if (!assignTo) {
          const { data: ownerRole } = await supabase
            .from("tenant_roles")
            .select("id")
            .eq("tenant_id", order.tenant_id)
            .eq("name", "owner")
            .limit(1)
            .single();
          if (ownerRole) {
            const { data: ownerMembership } = await supabase
              .from("tenant_memberships")
              .select("user_id")
              .eq("tenant_id", order.tenant_id)
              .eq("role_id", ownerRole.id)
              .limit(1)
              .single();
            assignTo = ownerMembership?.user_id ?? null;
          }
        }
      }

      const updatePayload: Record<string, string | null> = {
        status: "paid",
        paid_at: new Date().toISOString(),
        payment_method: "mercadopago",
        updated_at: new Date().toISOString(),
      };
      if (assignTo) {
        updatePayload.assigned_to = assignTo;
      }

      await supabase
        .from("orders")
        .update(updatePayload)
        .eq("id", orderId)
        .in("status", ["pending_payment", "completed"]);

      const { data: existingPayment } = await supabase
        .from("payments")
        .select("id")
        .eq("order_id", orderId)
        .eq("provider", "mercadopago")
        .limit(1)
        .single();

      const paymentMetadata = {
        mp_payment_id: paymentId,
        mp_status: mpStatus,
        mp_status_detail: mpPayment.status_detail,
        mp_payment_method: mpPayment.payment_method_id,
        paid_at: mpPayment.date_approved,
        mp_fee_amount: mpFeeAmount,
        pars_fee_amount: parsFeeAmount,
      };

      if (existingPayment) {
        await supabase
          .from("payments")
          .update({
            external_id: String(paymentId),
            status: "approved",
            amount: transactionAmount,
            metadata: paymentMetadata,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingPayment.id);
      } else {
        await supabase.from("payments").insert({
          order_id: orderId,
          provider: "mercadopago",
          external_id: String(paymentId),
          status: "approved",
          amount: transactionAmount,
          metadata: paymentMetadata,
        });
      }

      console.log(
        `Webhook: order ${orderId} marked as paid (payment ${paymentId})`,
      );
    } else {
      const { data: existingPayment } = await supabase
        .from("payments")
        .select("id")
        .eq("order_id", orderId)
        .eq("provider", "mercadopago")
        .limit(1)
        .single();

      if (existingPayment) {
        await supabase
          .from("payments")
          .update({
            external_id: String(paymentId),
            status: mpStatus ?? "unknown",
            metadata: {
              mp_payment_id: paymentId,
              mp_status: mpStatus,
              mp_status_detail: mpPayment.status_detail,
              mp_fee_amount: mpFeeAmount,
              pars_fee_amount: parsFeeAmount,
            },
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingPayment.id);
      }

      console.log(
        `Webhook: order ${orderId} payment ${paymentId} status: ${mpStatus}`,
      );
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ received: true });
  }
}

// =============================================================================
// Handler: pago de préstamo individual por link único
// externalRef formato: "loan:{loanId}"
// =============================================================================
async function handleSingleLoanPayment(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  externalRef: string,
  mpPaymentId: string,
  amount: number,
  mpFeeAmount: number,
  mpNetAmount: number,
) {
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
    amount: Math.min(amount, loan.amount_pending),
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
async function handleBulkLoanPayment(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  preferenceId: string,
  mpPaymentId: string,
  totalAmount: number,
  mpFeeAmount: number,
  _mpNetAmount: number,
) {
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

  const distribution: Record<string, number> = bulk.distribution ?? {};

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

  // Email resumen al cliente
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
// Handler: cambio de estado de suscripción (PreApproval)
// topic = "subscription_preapproval"
// MP envía este webhook cuando el cliente autoriza, pausa o cancela la suscripción
// =============================================================================
async function handlePreapprovalStatusChange(preapprovalId: string) {
  const supabase = createAdminClient();

  // Consultar el estado actual de la suscripción en MP
  const mpRes = await fetch(
    `https://api.mercadopago.com/preapproval/${preapprovalId}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      },
    },
  );

  if (!mpRes.ok) {
    console.error(
      `Webhook: error fetching preapproval ${preapprovalId} from MP:`,
      mpRes.status,
      await mpRes.text(),
    );
    return;
  }

  const mpData = await mpRes.json();
  const mpStatus: string = mpData.status; // "authorized", "paused", "cancelled", "pending"

  // Mapear estado de MP a nuestro payment_plan_status
  const statusMap: Record<string, string> = {
    authorized: "active",
    paused: "paused",
    cancelled: "cancelled",
    pending: "pending_setup",
  };

  const newPlanStatus = statusMap[mpStatus];
  if (!newPlanStatus) {
    console.warn(`Webhook: unknown preapproval status "${mpStatus}" for ${preapprovalId}`);
    return;
  }

  // Buscar primero en loans
  const { data: loan } = await supabase
    .from("loans")
    .select("id, payment_plan_status")
    .eq("mp_preapproval_id", preapprovalId)
    .single();

  if (loan) {
    if (loan.payment_plan_status === newPlanStatus) return;
    await supabase
      .from("loans")
      .update({
        payment_plan_status: newPlanStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", loan.id);
    console.log(
      `Webhook: preapproval ${preapprovalId} → loan ${loan.id} plan_status="${newPlanStatus}"`,
    );
    return;
  }

  // Si no está en loans, buscar en subscriptions (storefront)
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id, status")
    .eq("mp_preapproval_id", preapprovalId)
    .single();

  if (subscription) {
    if (subscription.status === newPlanStatus) return;

    const updatePayload: Record<string, string> = {
      status: newPlanStatus,
      updated_at: new Date().toISOString(),
    };
    if (newPlanStatus === "cancelled") {
      updatePayload.cancelled_at = new Date().toISOString();
    }

    await supabase
      .from("subscriptions")
      .update(updatePayload)
      .eq("id", subscription.id);

    console.log(
      `Webhook: preapproval ${preapprovalId} → subscription ${subscription.id} status="${newPlanStatus}"`,
    );
    return;
  }

  console.warn(`Webhook: no loan or subscription found for preapproval_id ${preapprovalId}`);
}

// =============================================================================
// Handler: cobro automático de suscripción (PreApproval)
// topic = "subscription_authorized_payment"
// =============================================================================
async function handlePreapprovalPayment(authorizedPaymentId: string) {
  const supabase = createAdminClient();

  // 1. Obtener el preapproval_id del pago autorizado vía API de MP
  //    Esto es necesario porque el webhook solo envía el authorized_payment_id,
  //    no el preapproval_id. Sin este paso, con 2+ suscripciones activas
  //    no sabríamos a cuál préstamo aplicar el pago.
  let preapprovalId: string | null = null;
  try {
    const mpRes = await fetch(
      `https://api.mercadopago.com/authorized_payments/${authorizedPaymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        },
      },
    );
    if (mpRes.ok) {
      const mpData = await mpRes.json();
      preapprovalId = mpData.preapproval_id ?? null;
    }
  } catch (err) {
    console.error(
      `Webhook: error fetching authorized_payment ${authorizedPaymentId} from MP:`,
      err,
    );
  }

  // 2. Buscar el loan: por preapproval_id específico si lo tenemos,
  //    o como fallback buscar el único activo (comportamiento anterior)
  //    Incluimos "pending_setup" porque el webhook de pago puede llegar
  //    antes que el de subscription_preapproval (cambio de estado)
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

  if (!loan) {
    // No loan found — try storefront subscriptions
    await handleStoreSubscriptionPayment(supabase, authorizedPaymentId, preapprovalId);
    return;
  }

  // Si el loan aún estaba en pending_setup, activarlo (el pago confirma autorización)
  if (loan.payment_plan_status === "pending_setup") {
    await supabase
      .from("loans")
      .update({ payment_plan_status: "active", updated_at: new Date().toISOString() })
      .eq("id", loan.id);
    console.log(`Webhook: loan ${loan.id} auto-activated from pending_setup (payment received)`);
  }

  const chargeAmount = loan.payment_plan_installment_amount ?? 0;
  if (chargeAmount <= 0) return;

  const actualAmount = Math.min(chargeAmount, loan.amount_pending);

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
      return;
    }
    console.error("Webhook: error en preapproval payment:", insertError);
    return;
  }

  await sendLoanPaymentEmail(loan, actualAmount, "mercadopago");
  console.log(
    `Webhook: preapproval payment ${authorizedPaymentId} applied to loan ${loan.id}`,
  );
}

// =============================================================================
// Handler: cobro de suscripción de storefront (compra recurrente / cuotas)
// =============================================================================
async function handleStoreSubscriptionPayment(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  authorizedPaymentId: string,
  preapprovalId: string | null,
) {
  if (!preapprovalId) {
    console.warn(`Webhook: no preapproval_id for store subscription payment ${authorizedPaymentId}`);
    return;
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select(`
      id, tenant_id, type, status, concept,
      installment_amount, charge_amount, service_fee_per_charge,
      total_installments, completed_installments,
      mp_preapproval_id, items_snapshot,
      customer_name, customer_email, customer_phone,
      customer_id, original_order_id
    `)
    .eq("mp_preapproval_id", preapprovalId)
    .in("status", ["active", "pending_setup"])
    .single();

  if (!subscription) {
    console.warn(
      `Webhook: no active subscription for preapproval ${preapprovalId} (payment ${authorizedPaymentId})`,
    );
    return;
  }

  // Auto-activate if still pending_setup
  if (subscription.status === "pending_setup") {
    await supabase
      .from("subscriptions")
      .update({ status: "active", updated_at: new Date().toISOString() })
      .eq("id", subscription.id);
    console.log(`Webhook: subscription ${subscription.id} auto-activated from pending_setup`);
  }

  const newInstallmentNumber = subscription.completed_installments + 1;

  // ── For recurring: create a new order for each charge ──────────────────────
  let orderId: string | null = null;

  if (subscription.type === "recurring") {
    const items = subscription.items_snapshot as Array<{
      product_id: string;
      name: string;
      quantity: number;
      unit_price: number;
      promotion_id?: string | null;
    }>;
    const subtotal = items.reduce((s: number, i: { unit_price: number; quantity: number }) => s + i.unit_price * i.quantity, 0);

    const { data: newOrder } = await supabase
      .from("orders")
      .insert({
        tenant_id: subscription.tenant_id,
        status: "paid",
        subtotal,
        discount: 0,
        total: subtotal,
        source: "public_store",
        payment_method: "mercadopago",
        customer_name: subscription.customer_name,
        customer_email: subscription.customer_email,
        customer_phone: subscription.customer_phone,
        customer_id: subscription.customer_id,
        subscription_id: subscription.id,
        subscription_installment: newInstallmentNumber,
        paid_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (newOrder) {
      orderId = newOrder.id;
      for (const item of items) {
        await supabase.from("order_items").insert({
          order_id: newOrder.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.unit_price * item.quantity,
          promotion_id: item.promotion_id ?? null,
        });
      }
    }
  } else {
    // For installments: reference the original order
    orderId = subscription.original_order_id;
  }

  // ── Create subscription payment record ────────────────────────────────────
  const { error: insertError } = await supabase
    .from("subscription_payments")
    .insert({
      subscription_id: subscription.id,
      tenant_id: subscription.tenant_id,
      installment_number: newInstallmentNumber,
      amount: subscription.installment_amount,
      service_fee: subscription.service_fee_per_charge,
      net_amount: subscription.installment_amount - subscription.service_fee_per_charge,
      order_id: orderId,
      mp_payment_id: authorizedPaymentId,
      mp_preapproval_id: preapprovalId,
      status: "paid",
    });

  if (insertError) {
    if (insertError.code === "23505") {
      console.warn(`Webhook: duplicate subscription payment ${authorizedPaymentId}`);
      return;
    }
    console.error("Webhook: error inserting subscription_payment:", insertError);
    return;
  }

  // ── Update subscription progress ──────────────────────────────────────────
  const newCompleted = newInstallmentNumber;
  const isComplete =
    subscription.type === "installments" &&
    subscription.total_installments &&
    newCompleted >= subscription.total_installments;

  const subUpdate: Record<string, unknown> = {
    completed_installments: newCompleted,
    updated_at: new Date().toISOString(),
  };

  if (isComplete) {
    subUpdate.status = "completed";

    // Mark original order as paid when all installments are done
    if (subscription.original_order_id) {
      await supabase
        .from("orders")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          payment_method: "mercadopago",
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscription.original_order_id);
    }
  }

  await supabase
    .from("subscriptions")
    .update(subUpdate)
    .eq("id", subscription.id);

  console.log(
    `Webhook: subscription ${subscription.id} payment #${newInstallmentNumber} registered` +
      (isComplete ? " (COMPLETED)" : ""),
  );
}

// =============================================================================
// Utilidad compartida: enviar email de confirmación de pago
// =============================================================================
async function sendLoanPaymentEmail(
  loan: {
    id: string;
    concept: string;
    amount_pending: number;
    customer: unknown;
    tenant: unknown;
  },
  amountPaid: number,
  paymentMethod: string,
) {
  const customer = loan.customer as unknown as { email: string | null; name: string } | null;
  const tenant = loan.tenant as unknown as { name: string } | null;

  if (!customer?.email || !tenant?.name) return;

  const newPending = Math.max(0, loan.amount_pending - amountPaid);

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
