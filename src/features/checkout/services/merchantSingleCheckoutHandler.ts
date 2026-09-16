import { NextResponse } from "next/server";

import { resolveUserError } from "@/lib/errors/resolveUserError";
import {
  attachConnectionToAttempt,
  calculatePlatformFee,
  createMerchantPendingPayment,
  getActiveSaleFeePolicy,
  getConnectedMercadoPagoConnection,
} from "@/features/payment-providers/connectionService";
import { createMercadoPagoMerchantCheckout } from "@/features/payment-providers/mercadoPagoProvider";
import { mapCartItemProduct } from "@/features/checkout/helpers/cartItemMappers";
import { createPaymentAttempt } from "@/features/checkout/helpers/paymentAttempt";
import type { CheckoutContext } from "@/features/checkout/helpers/checkoutContext";
import type { PublicCheckoutResponse } from "@/features/checkout/interfaces/publicCheckout";

/**
 * Checkout created with the merchant's OAuth token. It intentionally does not
 * import the global Tlaco Mercado Pago client: merchant funds never pass
 * through Tlaco in this path.
 */
export async function handleMerchantSingleCheckout(
  ctx: CheckoutContext,
): Promise<NextResponse<PublicCheckoutResponse | { error: string }>> {
  const { admin, payload, cartItems, subtotal, order, origin, tenantSlug, idempotencyKey, expiresAt, backUrls } = ctx;
  try {
    const { connection, accessToken } = await getConnectedMercadoPagoConnection(admin, payload.tenant_id);
    const capabilities = connection.capabilities as Record<string, unknown> | null;
    if (capabilities?.checkout !== true) {
      return NextResponse.json({ error: "La cuenta del negocio no tiene checkout web habilitado" }, { status: 409 });
    }

    const policy = await getActiveSaleFeePolicy(admin, payload.tenant_id);
    const fee = calculatePlatformFee({
      policy,
      amount: subtotal,
      splitEnabled: capabilities?.split_fee === true,
    });
    const attempt = await createPaymentAttempt(admin, {
      order_id: order.id,
      tenant_id: payload.tenant_id,
      mode: "single",
      amount: subtotal,
      idempotency_key: idempotencyKey,
      expires_at: expiresAt,
      metadata: { checkout_session_id: order.checkout_session_id, funds_owner: "tenant", fee_policy_id: fee.policyId },
    });
    await attachConnectionToAttempt({ admin, attemptId: attempt.id, connectionId: connection.id });
    const externalReference = `order:${order.id}:mode:single:attempt:${attempt.id}`;
    await admin.from("order_payment_attempts").update({ external_reference: externalReference }).eq("id", attempt.id);

    const result = await createMercadoPagoMerchantCheckout({
      accessToken,
      externalReference,
      notificationUrl: `${origin}/api/payment-providers/mercadopago/webhook`,
      payerEmail: payload.customer_email.trim(),
      marketplaceFee: fee.marketplaceFee,
      items: cartItems.map((item) => {
        const product = mapCartItemProduct(item);
        return { id: product.id, title: product.name, quantity: item.quantity, unit_price: Number(item.price_snapshot), currency_id: "MXN" as const };
      }),
      backUrls: backUrls ?? {
        success: `${origin}/sitio/${tenantSlug}/confirmacion?status=success&order_id=${order.id}&mode=single`,
        failure: `${origin}/sitio/${tenantSlug}/confirmacion?status=failure&order_id=${order.id}&mode=single`,
        pending: `${origin}/sitio/${tenantSlug}/confirmacion?status=pending&order_id=${order.id}&mode=single`,
      },
    });

    await admin.from("orders").update({
      payment_link: result.paymentLink,
      mp_preference_id: result.preferenceId,
      payment_method: "mercadopago",
      work_metadata: { checkout_mode: "single", public_cart_id: payload.cart_id, funds_owner: "tenant", provider_connection_id: connection.id },
      updated_at: new Date().toISOString(),
    }).eq("id", order.id);
    await admin.from("order_payment_attempts").update({ provider_reference: result.preferenceId, status: "redirected", updated_at: new Date().toISOString() }).eq("id", attempt.id);
    await createMerchantPendingPayment({
      admin,
      orderId: order.id,
      attemptId: attempt.id,
      checkoutSessionId: order.checkout_session_id,
      amount: subtotal,
      preferenceId: result.preferenceId,
      paymentLink: result.paymentLink,
      connection,
      platformFeeAmount: fee.marketplaceFee,
      invoiceFeeAmount: fee.invoiceFee,
      idempotencyKey: `payment:${attempt.id}`,
    });
    return NextResponse.json({ success: true, checkout_mode: "single", status: "redirect", order_id: order.id, payment_link: result.paymentLink, redirect_url: result.paymentLink, next_action: "open_payment_link" });
  } catch (error) {
    return NextResponse.json({ error: resolveUserError(error, "mercadopago") }, { status: 500 });
  }
}
