import type { Database } from "@/types/database.types";

type SupabaseAdminClient = ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>;
type SubscriptionUpdate =
  Database["public"]["Tables"]["subscriptions"]["Update"];

// =============================================================================
// Handler: cobro de suscripción de storefront (compra recurrente / cuotas)
// topic = "subscription_authorized_payment" cuando el preapproval pertenece a
//         una suscripción del carrito público (recurring o installments)
// =============================================================================
export async function handleStoreSubscriptionPayment(
  supabase: SupabaseAdminClient,
  authorizedPaymentId: string,
  preapprovalId: string | null,
): Promise<void> {
  if (!preapprovalId) {
    console.warn(
      `Webhook: no preapproval_id for store subscription payment ${authorizedPaymentId}`,
    );
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

  if (subscription.status === "pending_setup") {
    await supabase
      .from("subscriptions")
      .update({ status: "active", updated_at: new Date().toISOString() })
      .eq("id", subscription.id);
    console.log(`Webhook: subscription ${subscription.id} auto-activated from pending_setup`);
  }

  const newInstallmentNumber = subscription.completed_installments + 1;
  let orderId: string | null = null;

  if (subscription.type === "recurring") {
    const items = subscription.items_snapshot as Array<{
      product_id: string;
      name: string;
      quantity: number;
      unit_price: number;
      promotion_id?: string | null;
    }>;
    const subtotal = items.reduce(
      (s: number, i: { unit_price: number; quantity: number }) => s + i.unit_price * i.quantity,
      0,
    );

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
    orderId = subscription.original_order_id;
  }

  const { error: insertError } = await supabase.from("subscription_payments").insert({
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

  const newCompleted = newInstallmentNumber;
  const isComplete =
    subscription.type === "installments" &&
    subscription.total_installments &&
    newCompleted >= subscription.total_installments;

  const subUpdate: SubscriptionUpdate = {
    completed_installments: newCompleted,
    updated_at: new Date().toISOString(),
  };

  if (isComplete) {
    subUpdate.status = "completed";

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

  await supabase.from("subscriptions").update(subUpdate).eq("id", subscription.id);

  console.log(
    `Webhook: subscription ${subscription.id} payment #${newInstallmentNumber} registered` +
      (isComplete ? " (COMPLETED)" : ""),
  );
}
