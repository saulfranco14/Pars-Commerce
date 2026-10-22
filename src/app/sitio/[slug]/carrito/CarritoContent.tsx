"use client";

import { useMemo, useState } from "react";

import { CheckoutGuide } from "@/components/onboarding/CheckoutGuide";
import { Notification } from "@/components/ui/Notification";
import { Skeleton } from "@/components/ui/Skeleton";
import { useFingerprint } from "@/hooks/useFingerprint";
import type { RecurringPurchasesConfig } from "@/types/subscriptions";

import { useCartContext } from "@/features/sitio/components/cart/CartProvider";

import { CartEmptyState } from "@/features/checkout/components/cart/CartEmptyState";
import { CartItemsList } from "@/features/checkout/components/cart/CartItemsList";
import { CartPlansSection } from "@/features/checkout/components/cart/CartPlansSection";
import { CartSummaryHeader } from "@/features/checkout/components/cart/CartSummaryHeader";
import { CartTrustBadges } from "@/features/checkout/components/cart/CartTrustBadges";
import { CheckoutBody } from "@/features/checkout/components/cart/CheckoutBody";
import type { PickupSchedulingConfig } from "@/features/checkout/interfaces/pickupSchedule";
import type { BusinessHours } from "@/features/configuracion/interfaces/businessHours";
import { DesktopCheckoutAside } from "@/features/checkout/components/cart/DesktopCheckoutAside";
import { MobileCheckoutBar } from "@/features/checkout/components/cart/MobileCheckoutBar";
import { MobileCheckoutSheet } from "@/features/checkout/components/cart/MobileCheckoutSheet";
import { getSubmitLabels } from "@/features/checkout/helpers/checkoutSubmitLabels";
import { fitSelectionToOptions, restrictCheckoutForPlans } from "@/features/checkout/helpers/planCheckout";
import { useCartActions } from "@/features/checkout/hooks/useCartActions";
import { useCartCheckoutForm } from "@/features/checkout/hooks/useCartCheckoutForm";
import { useCheckoutSheet } from "@/features/checkout/hooks/useCheckoutSheet";
import { useMsiSelector } from "@/features/checkout/hooks/useMsiSelector";
import { usePaymentMode } from "@/features/checkout/hooks/usePaymentMode";
import {
  CheckoutFulfillmentStep,
  createInitialCheckoutSelection,
  type CheckoutFulfillmentSelection,
  type PublicCheckoutOptions,
} from "@/features/checkout/components/cart/CheckoutFulfillmentStep";

interface CarritoContentProps {
  tenantId: string;
  sitioSlug: string;
  accentColor: string;
  recurringConfig: RecurringPurchasesConfig;
  pickupScheduling: PickupSchedulingConfig;
  businessHours: BusinessHours | null;
  /** `false` = el negocio pausó los pedidos; el catálogo sigue visible. */
  acceptingOrders: boolean;
  whatsappOrdersEnabled: boolean;
  checkoutOptions: PublicCheckoutOptions;
}

export default function CarritoContent({
  tenantId,
  sitioSlug,
  accentColor,
  recurringConfig,
  pickupScheduling,
  businessHours,
  acceptingOrders,
  whatsappOrdersEnabled,
  checkoutOptions: storeCheckoutOptions,
}: CarritoContentProps) {
  const fingerprint = useFingerprint();
  const { cart, items, subtotal: itemsSubtotal, plans, plansTotal, isLoading, mutate } = useCartContext();
  const hasPlans = plans.length > 0;
  // Today's charge: products plus each plan's first period.
  const subtotal = itemsSubtotal + plansTotal;
  const checkoutOptions = useMemo(() => restrictCheckoutForPlans(storeCheckoutOptions, plans), [storeCheckoutOptions, plans]);

  // A cart with a plan pays once; installments and the legacy recurring mode don't apply.
  const hasRecurringOptions =
    !hasPlans && (recurringConfig.installments_enabled || recurringConfig.recurring_enabled);
  const productsHref = `/sitio/${sitioSlug}/productos`;

  const totalUnits = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0) + plans.length,
    [items, plans.length],
  );
  const [rawCheckoutDraft, setCheckoutDraft] =
    useState<CheckoutFulfillmentSelection>(() =>
      createInitialCheckoutSelection(storeCheckoutOptions),
    );
  const checkoutDraft = fitSelectionToOptions(rawCheckoutDraft, checkoutOptions);
  const [checkoutSelection, setCheckoutSelection] =
    useState<CheckoutFulfillmentSelection | null>(null);
  const activeFulfillment =
    checkoutSelection?.fulfillment ?? checkoutDraft.fulfillment;
  const activePayment = checkoutSelection?.payment ?? checkoutDraft.payment;
  const checkoutTotal =
    subtotal +
    (activeFulfillment === "delivery" ? checkoutOptions.deliveryFee : 0);
  const selectedPickupPoint = checkoutOptions.pickupPoints.find(
    (point) => point.id === (checkoutSelection?.pickupPointId ?? checkoutDraft.pickupPointId),
  );
  const effectivePickupHours = selectedPickupPoint?.business_hours ?? businessHours;

  const {
    paymentMode,
    setPaymentMode,
    selectedInstallments,
    setSelectedInstallments,
    selectedFrequency,
    setSelectedFrequency,
    installmentOptions,
    feeBreakdown,
  } = usePaymentMode({ subtotal: checkoutTotal, recurringConfig });

  const {
    msiOption,
    setMsiOption,
    msiBaseAmount,
    viableMsiOptions,
    msiBreakdown,
  } = useMsiSelector({
    paymentMode,
    subtotal: checkoutTotal,
    selectedInstallments,
    feeAbsorbedBy: recurringConfig.fee_absorbed_by,
  });

  const sheet = useCheckoutSheet();

  const cartActions = useCartActions({
    cart,
    items,
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
    fulfillmentMethod: checkoutSelection?.fulfillment,
    paymentMethod: checkoutSelection?.payment,
    pickupPointId: checkoutSelection?.pickupPointId,
    delivery: checkoutSelection?.delivery,
    onCheckoutFailed: () => void mutate(),
  });

  const combinedError = checkoutForm.error ?? cartActions.error;
  const singlePayAmount = msiBreakdown ? msiBreakdown.total : checkoutTotal;
  const customerAbsorbsFee =
    recurringConfig.fee_absorbed_by === "customer" && singlePayAmount > checkoutTotal;
  const { submitLabel, submitDisclaimer } = getSubmitLabels({
    submitting: checkoutForm.submitting,
    paymentMode,
    msiOption,
    payAmount: singlePayAmount,
    perMonth: msiBreakdown?.perMonth ?? 0,
    customerAbsorbsFee,
  });
  const checkoutPrimaryLabel = checkoutForm.submitting
    ? "Creando tu pedido…"
    : activePayment === "bank_transfer"
      ? "Crear pedido y subir comprobante"
      : activePayment === "cash"
        ? "Enviar pedido para recoger"
        : submitLabel;
  const checkoutPrimaryDisclaimer =
    activePayment === "bank_transfer"
      ? activeFulfillment === "delivery"
        ? "El negocio validará tu transferencia antes de enviar el pedido a tu domicilio."
        : "El negocio validará tu transferencia y te avisará cuándo recoger."
      : activePayment === "cash"
        ? "El negocio confirmará cuándo estará listo; pagarás al recoger."
        : activeFulfillment === "delivery"
          ? "Pagarás con Mercado Pago y el negocio entregará en la dirección indicada."
          : submitDisclaimer;

  const continueFromFulfillment = (
    selection: CheckoutFulfillmentSelection,
  ) => {
    if (selection.payment !== "mercadopago") setPaymentMode("single");
    if (selection.fulfillment === "delivery" && selection.delivery) {
      if (!checkoutForm.form.customer_name.trim()) {
        checkoutForm.updateField(
          "customer_name",
          selection.delivery.recipient_name,
        );
      }
      if (!checkoutForm.form.customer_phone.trim()) {
        checkoutForm.updateField(
          "customer_phone",
          selection.delivery.phone.replace(/\D/g, "").slice(0, 12),
        );
      }
    }
    setCheckoutSelection(selection);
  };
  const updateCheckoutDraft = (next: CheckoutFulfillmentSelection) => {
    if (
      next.pickupPointId !== checkoutDraft.pickupPointId &&
      checkoutForm.form.scheduled_for
    ) {
      // Each location may publish a different schedule. A time selected for
      // one branch must never silently travel to another one.
      checkoutForm.updateField("scheduled_for", "");
    }
    setCheckoutDraft(next);
  };

  if (isLoading) {
    return (
      <div
        className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]"
        aria-busy="true"
        aria-label="Cargando carrito"
      >
        <div className="space-y-3">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-black/5">
              <Skeleton className="h-16 w-16 rounded-xl" />
              <span className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/5" />
                <Skeleton className="h-3.5 w-20" />
              </span>
            </div>
          ))}
        </div>
        <Skeleton className="hidden h-72 rounded-2xl xl:block" />
      </div>
    );
  }

  if (!cart || (items.length === 0 && !hasPlans)) {
    return (
      <CartEmptyState productsHref={productsHref} accentColor={accentColor} />
    );
  }

  const checkoutBodyProps = {
    formState: checkoutForm.form,
    fieldErrors: checkoutForm.fieldErrors,
    onFormFieldChange: checkoutForm.updateField,
    onSubmit: checkoutForm.handleSubmit,
    onWhatsAppOrder: checkoutForm.handleWhatsAppOrder,
    fulfillmentMethod: checkoutSelection?.fulfillment ?? checkoutDraft.fulfillment,
    checkoutPaymentMethod: checkoutSelection?.payment ?? checkoutDraft.payment,
    onCheckoutSelectionChange: () => setCheckoutSelection(null),
    whatsappOrdersEnabled: whatsappOrdersEnabled && !hasPlans,
    submitting: checkoutForm.submitting,
    submitLabel: checkoutPrimaryLabel,
    submitDisclaimer: checkoutPrimaryDisclaimer,
    subtotal: checkoutTotal,
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
    pickupScheduling,
    businessHours: effectivePickupHours,
    pickupPointName: selectedPickupPoint?.name,
    pickupPointAddress: selectedPickupPoint?.address_text,
  };

  return (
    // Room for the fixed "Finalizar pedido" bar so the last items can scroll above it.
    <div className="space-y-4 pb-[calc(11rem+env(safe-area-inset-bottom))] xl:pb-0">
      {combinedError && <Notification tone="error" message={combinedError} />}

      {/* El aviso lo pone el layout del sitio, que sale en todas las páginas. */}
      {acceptingOrders && hasRecurringOptions && (
        <CheckoutGuide
          accentColor={accentColor}
          hasInstallments={recurringConfig.installments_enabled}
          hasRecurring={recurringConfig.recurring_enabled}
        />
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)] xl:items-start">
        <div className="space-y-4">
          <CartSummaryHeader
            itemsCount={items.length + plans.length}
            totalUnits={totalUnits}
            subtotal={subtotal}
            productsHref={productsHref}
            accentColor={accentColor}
          />
          <CartPlansSection plans={plans} accentColor={accentColor} onRemove={(id) => void cartActions.handleRemovePlan(id)} />
          {items.length > 0 ? (
            <CartItemsList
              items={items}
              accentColor={accentColor}
              onQuantityChange={cartActions.handleQuantityChange}
              onRemove={cartActions.handleRemove}
            />
          ) : null}
          <CartTrustBadges />
        </div>

        {/* Con la recepción cerrada desaparece el checkout, no el carrito:
            los productos y sus cantidades siguen ahí para cuando reabran. */}
        {acceptingOrders && (
          <DesktopCheckoutAside
            footerId="desktop-checkout-fulfillment-footer"
            paymentMethod={activePayment}
            totalUnits={totalUnits}
            total={checkoutTotal}
          >
            {!checkoutSelection ? (
              <CheckoutFulfillmentStep
                options={checkoutOptions}
                selection={checkoutDraft}
                subtotal={subtotal}
                accentColor={accentColor}
                footerContainerId="desktop-checkout-fulfillment-footer"
                onSelectionChange={updateCheckoutDraft}
                onContinue={continueFromFulfillment}
              />
            ) : (
              <CheckoutBody variant="desktop" {...checkoutBodyProps} />
            )}
          </DesktopCheckoutAside>
        )}
      </div>

      {acceptingOrders && (
        <MobileCheckoutBar
          subtotal={subtotal}
          accentColor={accentColor}
          onContinue={sheet.open}
        />
      )}

      {acceptingOrders && sheet.mounted && (
        <MobileCheckoutSheet
          visible={sheet.visible}
          items={items}
          totalUnits={totalUnits}
          subtotal={checkoutTotal}
          error={combinedError}
          submitting={checkoutForm.submitting}
          submitLabel={checkoutPrimaryLabel}
          submitDisclaimer={checkoutPrimaryDisclaimer}
          accentColor={accentColor}
          onClose={sheet.close}
          showPrimaryAction={Boolean(checkoutSelection)}
          selectionFooterId="mobile-checkout-fulfillment-footer"
          paymentMethod={activePayment}
        >
          {!checkoutSelection ? (
            <CheckoutFulfillmentStep
              options={checkoutOptions}
              selection={checkoutDraft}
              subtotal={subtotal}
              accentColor={accentColor}
              footerContainerId="mobile-checkout-fulfillment-footer"
              onSelectionChange={updateCheckoutDraft}
              onContinue={continueFromFulfillment}
            />
          ) : (
            <CheckoutBody variant="mobile" {...checkoutBodyProps} />
          )}
        </MobileCheckoutSheet>
      )}
    </div>
  );
}
