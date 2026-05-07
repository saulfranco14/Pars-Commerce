import {
  calcMsiBuyerTotal,
  calcSubscriptionFees,
  MP_MSI_MIN_INSTALLMENT_MXN,
} from "@/constants/commissionConfig";
import type { MsiOption } from "@/constants/commissionConfig";
import { resolveUserError } from "@/lib/errors/resolveUserError";
import { preferenceClient } from "@/lib/mercadopago";
import { NextResponse } from "next/server";

import { frequencyToDate } from "@/features/checkout/helpers/frequency";
import { createPaymentAttempt } from "@/features/checkout/helpers/paymentAttempt";
import type { CheckoutContext } from "@/features/checkout/helpers/checkoutContext";
import type { PublicCheckoutResponse } from "@/features/checkout/interfaces/publicCheckout";

const MIN_INSTALLMENT_AMOUNT_MXN = 15;

export async function handlePartialCheckout(
  ctx: CheckoutContext,
): Promise<NextResponse<PublicCheckoutResponse | { error: string }>> {
  const {
    admin,
    payload,
    tenantSlug,
    recurringConfig,
    subtotal,
    order,
    origin,
    idempotencyKey,
    expiresAt,
    installments,
    frequency,
    frequencyType,
  } = ctx;

  const partialInstallments = installments >= 2 ? installments : 3;
  const installmentBase =
    Math.round((subtotal / partialInstallments) * 100) / 100;
  if (installmentBase < MIN_INSTALLMENT_AMOUNT_MXN) {
    return NextResponse.json(
      {
        error: `El monto por abono debe ser al menos $${MIN_INSTALLMENT_AMOUNT_MXN} MXN`,
      },
      { status: 400 },
    );
  }

  const msiOption: MsiOption = (payload.msi_option ?? 1) as MsiOption;

  if (msiOption > 1) {
    const projectedPerMonth = installmentBase / msiOption;
    if (projectedPerMonth < MP_MSI_MIN_INSTALLMENT_MXN) {
      return NextResponse.json(
        {
          error: `La cuota mensual de ${msiOption} MSI sobre tu primer abono quedaría por debajo del mínimo de $${MP_MSI_MIN_INSTALLMENT_MXN} MXN exigido por MercadoPago.`,
        },
        { status: 400 },
      );
    }
  }

  const firstChargeBreakdown =
    msiOption > 1
      ? calcMsiBuyerTotal(
          installmentBase,
          msiOption,
          recurringConfig.fee_absorbed_by,
        )
      : null;

  const fees = calcSubscriptionFees(
    installmentBase,
    recurringConfig.fee_absorbed_by,
  );
  const firstCharge = firstChargeBreakdown
    ? firstChargeBreakdown.total
    : fees.chargeAmount;

  const now = new Date();
  const scheduleRows = Array.from({ length: partialInstallments }).map(
    (_, idx) => {
      const installmentNumber = idx + 1;
      const dueDate = frequencyToDate(now, idx * frequency, frequencyType);
      const amountDue =
        installmentNumber === partialInstallments
          ? Math.round(
              (subtotal - installmentBase * (partialInstallments - 1)) * 100,
            ) / 100
          : installmentBase;
      return {
        order_id: order.id,
        tenant_id: payload.tenant_id,
        installment_number: installmentNumber,
        due_date: dueDate.toISOString(),
        amount_due: amountDue,
        amount_paid: 0,
        status: "pending",
        metadata: { mode: "partial" },
      };
    },
  );

  const { data: createdSchedules, error: scheduleError } = await admin
    .from("order_payment_schedules")
    .insert(scheduleRows)
    .select("id, installment_number, amount_due")
    .order("installment_number", { ascending: true });

  if (scheduleError || !createdSchedules || createdSchedules.length === 0) {
    return NextResponse.json(
      {
        error: scheduleError?.message ?? "No se pudo crear el plan de abonos",
      },
      { status: 500 },
    );
  }

  const firstSchedule = createdSchedules[0] as {
    id: string;
    installment_number: number;
    amount_due: number;
  };

  const attempt = await createPaymentAttempt(admin, {
    order_id: order.id,
    tenant_id: payload.tenant_id,
    mode: "partial",
    amount: Number(firstSchedule.amount_due),
    idempotency_key: idempotencyKey,
    expires_at: expiresAt,
    metadata: {
      checkout_session_id: order.checkout_session_id,
      installment_number: firstSchedule.installment_number,
      schedule_id: firstSchedule.id,
      msi_option: msiOption,
    },
  });

  const externalReference = `order:${order.id}:mode:partial:attempt:${attempt.id}`;
  await admin
    .from("order_payment_attempts")
    .update({ external_reference: externalReference })
    .eq("id", attempt.id);

  const titleBase = `Abono 1/${partialInstallments} - Pedido ${order.id.slice(0, 8).toUpperCase()}`;
  const title = msiOption > 1 ? `${titleBase} · ${msiOption} MSI` : titleBase;
  let preference;
  try {
    preference = await preferenceClient.create({
      body: {
        items: [
          {
            id: `partial-${order.id}`,
            title,
            quantity: 1,
            unit_price: firstCharge,
            currency_id: "MXN",
          },
        ],
        external_reference: externalReference,
        back_urls: {
          success: `${origin}/sitio/${tenantSlug}/confirmacion?status=success&order_id=${order.id}&mode=partial`,
          failure: `${origin}/sitio/${tenantSlug}/confirmacion?status=failure&order_id=${order.id}&mode=partial`,
          pending: `${origin}/sitio/${tenantSlug}/confirmacion?status=pending&order_id=${order.id}&mode=partial`,
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
      payment_plan_status: "active",
      work_metadata: {
        checkout_mode: "partial",
        public_cart_id: payload.cart_id,
        msi_option: msiOption,
        msi_charge_amount: firstCharge,
        msi_per_month: firstChargeBreakdown?.perMonth ?? null,
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
    amount: Number(firstSchedule.amount_due),
    payment_kind: "partial",
    installment_number: firstSchedule.installment_number,
    checkout_session_id: order.checkout_session_id,
    attempt_id: attempt.id,
    idempotency_key: `payment:${attempt.id}`,
    metadata: {
      preference_id: preference.id,
      init_point: paymentLink,
      schedule_id: firstSchedule.id,
      charge_amount: firstCharge,
      msi_option: msiOption,
      msi_per_month: firstChargeBreakdown?.perMonth ?? null,
    },
  });

  return NextResponse.json({
    success: true,
    checkout_mode: "partial",
    status: "redirect",
    order_id: order.id,
    payment_link: paymentLink,
    redirect_url: paymentLink,
    next_action: "open_payment_link",
  });
}
