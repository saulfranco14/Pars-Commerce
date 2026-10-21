/* eslint-disable @typescript-eslint/no-explicit-any -- fulfillment and delivery columns on orders are not in the generated Supabase types yet. */
import type { Database } from "@/types/database.types";

type SupabaseAdminClient = ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>;
type SubscriptionUpdate =
  Database["public"]["Tables"]["subscriptions"]["Update"];
type Loose = { from: (table: string) => any };

interface RenewalSubscription {
  id: string;
  tenant_id: string;
  installment_amount: number;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_id: string | null;
  original_order_id: string | null;
  items_snapshot: unknown;
}

interface SnapshotItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  promotion_id?: string | null;
}

/**
 * Marks an order paid with an UPDATE (never inserting it already paid) so the
 * inventory trigger, which listens to status updates, discounts the stock.
 */
async function settleOrderAsPaid(supabase: SupabaseAdminClient, orderId: string, amount: number): Promise<string> {
  const now = new Date().toISOString();
  await (supabase as unknown as Loose)
    .from("orders")
    .update({
      status: "paid",
      paid_at: now,
      paid_total: amount,
      balance_due: 0,
      payment_method: "mercadopago",
      payment_plan_status: "active",
      updated_at: now,
    })
    .eq("id", orderId);
  return orderId;
}

/** A later period: same items and delivery as the first order, charged at the subscribed amount. */
async function createRenewalOrder(
  supabase: SupabaseAdminClient,
  subscription: RenewalSubscription,
  installmentNumber: number,
): Promise<string | null> {
  const db = supabase as unknown as Loose;
  const items = (subscription.items_snapshot ?? []) as SnapshotItem[];
  const subtotal = items.reduce((sum, item) => sum + Number(item.unit_price) * item.quantity, 0);
  const total = Number(subscription.installment_amount);

  const { data: original } = subscription.original_order_id
    ? await db
        .from("orders")
        .select("fulfillment_method, order_type, delivery_fee, scheduled_for")
        .eq("id", subscription.original_order_id)
        .maybeSingle()
    : { data: null };
  const deliveryFee = Number(original?.delivery_fee ?? 0);

  const { data: order, error } = await db
    .from("orders")
    .insert({
      tenant_id: subscription.tenant_id,
      status: "pending_payment",
      subtotal,
      discount: Math.max(0, Math.round((subtotal + deliveryFee - total) * 100) / 100),
      total,
      paid_total: 0,
      balance_due: total,
      source: "public_store",
      payment_method: "mercadopago",
      payment_mode: "subscription",
      payment_plan_status: "active",
      fulfillment_method: original?.fulfillment_method ?? null,
      order_type: original?.order_type ?? null,
      delivery_fee: deliveryFee,
      customer_name: subscription.customer_name,
      customer_email: subscription.customer_email,
      customer_phone: subscription.customer_phone,
      customer_id: subscription.customer_id,
      subscription_id: subscription.id,
      subscription_installment: installmentNumber,
    })
    .select("id")
    .single();
  if (error || !order) {
    console.error("Webhook: error creating renewal order:", error);
    return null;
  }

  if (items.length > 0) {
    await db.from("order_items").insert(
      items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: Number(item.unit_price) * item.quantity,
        promotion_id: item.promotion_id ?? null,
      })),
    );
  }

  if (subscription.original_order_id) {
    const { data: delivery } = await db
      .from("order_delivery_details")
      .select("pickup_point_id, recipient_name, recipient_phone, address_text, reference, latitude, longitude, mapbox_feature_id")
      .eq("order_id", subscription.original_order_id)
      .maybeSingle();
    if (delivery) await db.from("order_delivery_details").insert({ ...delivery, order_id: order.id });
  }

  return settleOrderAsPaid(supabase, order.id, total);
}

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

  // Claim the charge before touching orders: a retried notification stops here
  // (unique mp_payment_id) instead of creating a second order.
  const { data: paymentRow, error: insertError } = await supabase
    .from("subscription_payments")
    .insert({
      subscription_id: subscription.id,
      tenant_id: subscription.tenant_id,
      installment_number: newInstallmentNumber,
      amount: subscription.installment_amount,
      service_fee: subscription.service_fee_per_charge,
      net_amount: subscription.installment_amount - subscription.service_fee_per_charge,
      order_id: null,
      mp_payment_id: authorizedPaymentId,
      mp_preapproval_id: preapprovalId,
      status: "paid",
    })
    .select("id")
    .single();

  if (insertError || !paymentRow) {
    if (insertError?.code === "23505") {
      console.warn(`Webhook: duplicate subscription payment ${authorizedPaymentId}`);
      return;
    }
    console.error("Webhook: error inserting subscription_payment:", insertError);
    return;
  }

  let orderId: string | null = subscription.original_order_id;
  if (subscription.type === "recurring") {
    // The checkout order is period 1: settle it instead of creating a twin.
    orderId = subscription.completed_installments === 0 && subscription.original_order_id
      ? await settleOrderAsPaid(supabase, subscription.original_order_id, Number(subscription.installment_amount))
      : await createRenewalOrder(supabase, subscription, newInstallmentNumber);
  }
  if (orderId) {
    await supabase.from("subscription_payments").update({ order_id: orderId }).eq("id", paymentRow.id);
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
