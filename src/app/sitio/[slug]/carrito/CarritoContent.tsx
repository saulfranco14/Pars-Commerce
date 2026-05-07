"use client";

import { useMemo } from "react";

import { CheckoutGuide } from "@/components/onboarding/CheckoutGuide";
import { useFingerprint } from "@/hooks/useFingerprint";
import type { RecurringPurchasesConfig } from "@/types/subscriptions";

import { useCartContext } from "../CartProvider";

import { CartEmptyState } from "@/features/checkout/components/cart/CartEmptyState";
import { CartItemsList } from "@/features/checkout/components/cart/CartItemsList";
import { CartSummaryHeader } from "@/features/checkout/components/cart/CartSummaryHeader";
import { CartTrustBadges } from "@/features/checkout/components/cart/CartTrustBadges";
import { CheckoutBody } from "@/features/checkout/components/cart/CheckoutBody";
import { DesktopCheckoutAside } from "@/features/checkout/components/cart/DesktopCheckoutAside";
import { MobileCheckoutBar } from "@/features/checkout/components/cart/MobileCheckoutBar";
import { MobileCheckoutSheet } from "@/features/checkout/components/cart/MobileCheckoutSheet";
import { getSubmitLabels } from "@/features/checkout/helpers/checkoutSubmitLabels";
import { useCartActions } from "@/features/checkout/hooks/useCartActions";
import { useCartCheckoutForm } from "@/features/checkout/hooks/useCartCheckoutForm";
import { useCheckoutSheet } from "@/features/checkout/hooks/useCheckoutSheet";
import { useMsiSelector } from "@/features/checkout/hooks/useMsiSelector";
import { usePaymentMode } from "@/features/checkout/hooks/usePaymentMode";

interface CarritoContentProps {
  tenantId: string;
  sitioSlug: string;
  accentColor: string;
  recurringConfig: RecurringPurchasesConfig;
}

export default function CarritoContent({
  tenantId,
  sitioSlug,
  accentColor,
  recurringConfig,
}: CarritoContentProps) {
  const fingerprint = useFingerprint();
  const { cart, items, subtotal, isLoading, mutate } = useCartContext();

  const hasRecurringOptions =
    recurringConfig.installments_enabled || recurringConfig.recurring_enabled;
  const productsHref = `/sitio/${sitioSlug}/productos`;

  const totalUnits = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const {
    paymentMode,
    setPaymentMode,
    selectedInstallments,
    setSelectedInstallments,
    selectedFrequency,
    setSelectedFrequency,
    installmentOptions,
    feeBreakdown,
  } = usePaymentMode({ subtotal, recurringConfig });

  const {
    msiOption,
    setMsiOption,
    msiBaseAmount,
    viableMsiOptions,
    msiBreakdown,
  } = useMsiSelector({
    paymentMode,
    subtotal,
    selectedInstallments,
    feeAbsorbedBy: recurringConfig.fee_absorbed_by,
  });

  const sheet = useCheckoutSheet();

  const cartActions = useCartActions({
    cart,
    items,
    subtotal,
    fingerprint,
    mutate,
  });

  const checkoutForm = useCartCheckoutForm({
    tenantId,
    cartId: cart?.id ?? null,
    fingerprint,
    paymentMode,
    selectedInstallments,
    selectedFrequency,
    msiOption,
  });

  const combinedError = checkoutForm.error ?? cartActions.error;
  const singlePayAmount = msiBreakdown ? msiBreakdown.total : subtotal;
  const customerAbsorbsFee =
    recurringConfig.fee_absorbed_by === "customer" && singlePayAmount > subtotal;
  const { submitLabel, submitDisclaimer } = getSubmitLabels({
    submitting: checkoutForm.submitting,
    paymentMode,
    msiOption,
    payAmount: singlePayAmount,
    perMonth: msiBreakdown?.perMonth ?? 0,
    customerAbsorbsFee,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-transparent"
          style={{ borderTopColor: accentColor }}
        />
      </div>
    );
  }

  if (!cart || items.length === 0) {
    return (
      <CartEmptyState productsHref={productsHref} accentColor={accentColor} />
    );
  }

  const checkoutBodyProps = {
    formState: checkoutForm.form,
    fieldErrors: checkoutForm.fieldErrors,
    onFormFieldChange: checkoutForm.updateField,
    onSubmit: checkoutForm.handleSubmit,
    submitting: checkoutForm.submitting,
    submitLabel,
    submitDisclaimer,
    subtotal,
    accentColor,
    hasRecurringOptions,
    recurringConfig,
    paymentMode,
    onPaymentModeChange: setPaymentMode,
    selectedInstallments,
    onSelectedInstallmentsChange: setSelectedInstallments,
    installmentOptions,
    selectedFrequency,
    onSelectedFrequencyChange: setSelectedFrequency,
    feeBreakdown,
    msiOption,
    onMsiOptionChange: setMsiOption,
    msiBaseAmount,
    viableMsiOptions,
    msiBreakdown,
  };

  return (
    <div className="space-y-4 xl:pb-0">
      {combinedError && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {combinedError}
        </div>
      )}

      {hasRecurringOptions && (
        <CheckoutGuide
          accentColor={accentColor}
          hasInstallments={recurringConfig.installments_enabled}
          hasRecurring={recurringConfig.recurring_enabled}
        />
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)] xl:items-start">
        <div className="space-y-4">
          <CartSummaryHeader
            itemsCount={items.length}
            totalUnits={totalUnits}
            subtotal={subtotal}
            productsHref={productsHref}
            accentColor={accentColor}
          />
          <CartItemsList
            items={items}
            accentColor={accentColor}
            onQuantityChange={cartActions.handleQuantityChange}
            onRemove={cartActions.handleRemove}
          />
          <CartTrustBadges />
        </div>

        <DesktopCheckoutAside>
          <CheckoutBody variant="desktop" {...checkoutBodyProps} />
        </DesktopCheckoutAside>
      </div>

      <MobileCheckoutBar
        subtotal={subtotal}
        accentColor={accentColor}
        onContinue={sheet.open}
      />

      {sheet.mounted && (
        <MobileCheckoutSheet
          visible={sheet.visible}
          items={items}
          totalUnits={totalUnits}
          subtotal={subtotal}
          error={combinedError}
          submitting={checkoutForm.submitting}
          submitLabel={submitLabel}
          submitDisclaimer={submitDisclaimer}
          accentColor={accentColor}
          onClose={sheet.close}
        >
          <CheckoutBody variant="mobile" {...checkoutBodyProps} />
        </MobileCheckoutSheet>
      )}
    </div>
  );
}
