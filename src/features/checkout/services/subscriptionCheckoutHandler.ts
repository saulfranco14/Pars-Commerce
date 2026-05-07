import { calcSubscriptionFees } from "@/constants/commissionConfig";
import { resolveUserError } from "@/lib/errors/resolveUserError";
import { MercadoPagoConfig, PreApproval } from "mercadopago";
import { NextResponse } from "next/server";

import { mapCartItemProduct } from "@/features/checkout/helpers/cartItemMappers";
import { createPaymentAttempt } from "@/features/checkout/helpers/paymentAttempt";
import type { CheckoutContext } from "@/features/checkout/helpers/checkoutContext";
import type { PublicCheckoutResponse } from "@/features/checkout/interfaces/publicCheckout";
import type { SubscriptionItemSnapshot } from "@/types/subscriptions";

const SHORT_CONCEPT_LIMIT = 100;

export async function handleSubscriptionCheckout(
  ctx: CheckoutContext,
): Promise<NextResponse<PublicCheckoutResponse | { error: string }>> {
  const {
    admin,
    payload,
    tenantSlug,
    recurringConfig,
    cartItems,
    subtotal,
    customerId,
    order,
    origin,
    idempotencyKey,
    expiresAt,
    frequency,
    frequencyType,
  } = ctx;

  if (!recurringConfig.recurring_enabled) {
    return NextResponse.json(
      { error: "Compra recurrente no está habilitada para esta tienda" },
      { status: 400 },
    );
  }

  const discountPercent = recurringConfig.subscription_discount_percent;
  const discountedAmount =
    Math.round(subtotal * (1 - discountPercent / 100) * 100) / 100;
  const feeCalc = calcSubscriptionFees(
    discountedAmount,
    recurringConfig.fee_absorbed_by,
  );
  const serviceFee =
    Math.round((feeCalc.chargeAmount - discountedAmount) * 100) / 100;

  const itemsSnapshot: SubscriptionItemSnapshot[] = cartItems.map((item) => {
    const product = mapCartItemProduct(item);
    return {
      product_id: item.product_id,
      name: product.name,
      quantity: item.quantity,
      unit_price: Number(item.price_snapshot),
      image_url: product.image_url,
      promotion_id: item.promotion_id ?? null,
    };
  });

  const concept = itemsSnapshot.map((item) => item.name).join(", ");
  const shortConcept =
    concept.length > SHORT_CONCEPT_LIMIT
      ? `${concept.slice(0, SHORT_CONCEPT_LIMIT - 3)}...`
      : concept;

  const { data: subscription, error: subError } = await admin
    .from("subscriptions")
    .insert({
      tenant_id: payload.tenant_id,
      customer_id: customerId,
      customer_name: payload.customer_name.trim(),
      customer_email: payload.customer_email.trim().toLowerCase(),
      customer_phone: payload.customer_phone?.trim() || null,
      type: "recurring",
      frequency,
      frequency_type: frequencyType,
      original_amount: subtotal,
      discount_percent: discountPercent,
      discounted_amount: discountedAmount,
      installment_amount: discountedAmount,
      charge_amount: feeCalc.chargeAmount,
      service_fee_per_charge: serviceFee,
      total_installments: null,
      completed_installments: 0,
      status: "pending_setup",
      mp_fee_absorbed_by: recurringConfig.fee_absorbed_by,
      original_order_id: order.id,
      concept: shortConcept,
      items_snapshot: itemsSnapshot,
      start_date: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (subError || !subscription) {
    return NextResponse.json(
      { error: subError?.message ?? "Error creating subscription" },
      { status: 500 },
    );
  }

  await admin
    .from("orders")
    .update({
      subscription_id: subscription.id,
      subscription_installment: 1,
      payment_mode: "subscription",
      payment_plan_status: "pending",
      total: discountedAmount,
      discount: subtotal - discountedAmount,
      balance_due: discountedAmount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  const attempt = await createPaymentAttempt(admin, {
    order_id: order.id,
    tenant_id: payload.tenant_id,
    mode: "subscription",
    amount: feeCalc.chargeAmount,
    idempotency_key: idempotencyKey,
    expires_at: expiresAt,
    metadata: {
      checkout_session_id: order.checkout_session_id,
      subscription_id: subscription.id,
    },
  });

  const externalReference = `order:${order.id}:mode:subscription:attempt:${attempt.id}`;
  await admin
    .from("order_payment_attempts")
    .update({ external_reference: externalReference })
    .eq("id", attempt.id);

  const mpConfig = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  });
  const preApproval = new PreApproval(mpConfig);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1);

  const backUrl = `${origin}/sitio/${tenantSlug}/confirmacion?order_id=${order.id}&subscription_id=${subscription.id}&status=success&mode=subscription`;
  let mpSubscription;
  try {
    mpSubscription = await preApproval.create({
      body: {
        reason: shortConcept,
        payer_email: payload.customer_email.trim(),
        back_url: backUrl,
        status: "pending",
        external_reference: externalReference,
        auto_recurring: {
          frequency: frequencyType === "weeks" ? frequency * 7 : frequency,
          frequency_type: frequencyType === "weeks" ? "days" : "months",
          transaction_amount: feeCalc.chargeAmount,
          currency_id: "MXN",
          start_date: startDate.toISOString(),
        },
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: resolveUserError(err, "mercadopago") },
      { status: 500 },
    );
  }

  if (!mpSubscription?.id || !mpSubscription?.init_point) {
    return NextResponse.json(
      { error: "Respuesta inválida de MercadoPago" },
      { status: 502 },
    );
  }

  await admin
    .from("subscriptions")
    .update({
      mp_preapproval_id: mpSubscription.id,
      mp_subscription_init_point: mpSubscription.init_point,
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscription.id);

  await admin
    .from("order_payment_attempts")
    .update({
      provider_reference: mpSubscription.id,
      status: "redirected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", attempt.id);

  return NextResponse.json({
    success: true,
    checkout_mode: "subscription",
    status: "redirect",
    order_id: order.id,
    subscription_id: subscription.id,
    payment_link: mpSubscription.init_point,
    redirect_url: mpSubscription.init_point,
    next_action: "open_payment_link",
  });
}
