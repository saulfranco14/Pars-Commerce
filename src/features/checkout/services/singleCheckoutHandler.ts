import {
  calcMsiBuyerTotal,
  MP_MSI_MIN_INSTALLMENT_MXN,
  TARIFA_DE_SERVICIO_LABEL,
} from "@/constants/commissionConfig";
import type { MsiOption } from "@/constants/commissionConfig";
import { resolveUserError } from "@/lib/errors/resolveUserError";
import { preferenceClient } from "@/lib/mercadopago";
import { NextResponse } from "next/server";

import { mapCartItemProduct } from "@/features/checkout/helpers/cartItemMappers";
import { createPaymentAttempt } from "@/features/checkout/helpers/paymentAttempt";
import type { CheckoutContext } from "@/features/checkout/helpers/checkoutContext";
import type { PublicCheckoutResponse } from "@/features/checkout/interfaces/publicCheckout";

export async function handleSingleCheckout(
  ctx: CheckoutContext,
): Promise<NextResponse<PublicCheckoutResponse | { error: string }>> {
  const {
    admin,
    payload,
    tenantSlug,
    recurringConfig,
    cartItems,
    subtotal,
    order,
    origin,
    idempotencyKey,
    expiresAt,
  } = ctx;

  const msiOption: MsiOption = (payload.msi_option ?? 1) as MsiOption;

  if (msiOption > 1) {
    const projectedPerMonth = subtotal / msiOption;
    if (projectedPerMonth < MP_MSI_MIN_INSTALLMENT_MXN) {
      return NextResponse.json(
        {
          error: `La cuota mensual de ${msiOption} MSI quedaría por debajo del mínimo de $${MP_MSI_MIN_INSTALLMENT_MXN} MXN exigido por MercadoPago.`,
        },
        { status: 400 },
      );
    }
  }

  const {
    total: buyerTotal,
    mpFee,
    parsFee,
    perMonth,
  } = calcMsiBuyerTotal(subtotal, msiOption, recurringConfig.fee_absorbed_by);
  const mpFeeRounded = Math.round(mpFee * 100) / 100;
  const parsFeeRounded = Math.round(parsFee * 100) / 100;

  const baseItems = cartItems.map((item) => {
    const product = mapCartItemProduct(item);
    return {
      id: product.id,
      title: product.name,
      quantity: item.quantity,
      unit_price: Number(item.price_snapshot),
      currency_id: "MXN" as const,
    };
  });

  const mpItems = [
    ...baseItems,
    ...(mpFeeRounded > 0
      ? [
          {
            id: "mp-fee",
            title:
              msiOption > 1
                ? `Comisión Mercado Pago (${msiOption} MSI)`
                : "Comisión Mercado Pago",
            quantity: 1,
            unit_price: mpFeeRounded,
            currency_id: "MXN" as const,
          },
        ]
      : []),
    ...(parsFeeRounded > 0
      ? [
          {
            id: "pars-fee",
            title: TARIFA_DE_SERVICIO_LABEL,
            quantity: 1,
            unit_price: parsFeeRounded,
            currency_id: "MXN" as const,
          },
        ]
      : []),
  ];

  const attempt = await createPaymentAttempt(admin, {
    order_id: order.id,
    tenant_id: payload.tenant_id,
    mode: "single",
    amount: subtotal,
    idempotency_key: idempotencyKey,
    expires_at: expiresAt,
    metadata: {
      checkout_session_id: order.checkout_session_id,
      msi_option: msiOption,
    },
  });

  const externalReference = `order:${order.id}:mode:single:attempt:${attempt.id}`;
  await admin
    .from("order_payment_attempts")
    .update({ external_reference: externalReference })
    .eq("id", attempt.id);

  let preference;
  try {
    preference = await preferenceClient.create({
      body: {
        items: mpItems,
        external_reference: externalReference,
        back_urls: {
          success: `${origin}/sitio/${tenantSlug}/confirmacion?status=success&order_id=${order.id}&mode=single`,
          failure: `${origin}/sitio/${tenantSlug}/confirmacion?status=failure&order_id=${order.id}&mode=single`,
          pending: `${origin}/sitio/${tenantSlug}/confirmacion?status=pending&order_id=${order.id}&mode=single`,
        },
        auto_return: "approved",
        notification_url: `${origin}/api/mercadopago/webhook`,
        payer: { email: payload.customer_email.trim() },
        payment_methods: {
          installments: msiOption,
          default_installments: msiOption,
        },
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: resolveUserError(err, "mercadopago") },
      { status: 500 },
    );
  }

  const paymentLink = preference.init_point ?? preference.sandbox_init_point;
  if (!paymentLink) {
    return NextResponse.json(
      { error: "MercadoPago no devolvió link de pago" },
      { status: 502 },
    );
  }

  await admin
    .from("orders")
    .update({
      payment_link: paymentLink,
      mp_preference_id: preference.id,
      payment_method: "mercadopago",
      work_metadata: {
        checkout_mode: "single",
        public_cart_id: payload.cart_id,
        msi_option: msiOption,
        msi_charge_amount: buyerTotal,
        msi_per_month: perMonth,
        msi_fee_absorbed_by: recurringConfig.fee_absorbed_by,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  await admin
    .from("order_payment_attempts")
    .update({
      provider_reference: preference.id,
      status: "redirected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", attempt.id);

  await admin.from("payments").insert({
    order_id: order.id,
    provider: "mercadopago",
    external_id: preference.id,
    status: "pending",
    amount: subtotal,
    payment_kind: "single",
    checkout_session_id: order.checkout_session_id,
    attempt_id: attempt.id,
    idempotency_key: `payment:${attempt.id}`,
    metadata: {
      preference_id: preference.id,
      init_point: paymentLink,
      buyer_total: buyerTotal,
      msi_option: msiOption,
      msi_per_month: perMonth,
    },
  });

  return NextResponse.json({
    success: true,
    checkout_mode: "single",
    status: "redirect",
    order_id: order.id,
    payment_link: paymentLink,
    redirect_url: paymentLink,
    next_action: "open_payment_link",
  });
}
