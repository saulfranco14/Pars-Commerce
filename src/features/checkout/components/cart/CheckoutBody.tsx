"use client";

import type { MsiOption } from "@/constants/commissionConfig";
import type { RecurringPurchasesConfig } from "@/types/subscriptions";

import { CheckoutFormFields } from "@/features/checkout/components/cart/CheckoutFormFields";
import { PickupTimePicker } from "@/features/checkout/components/cart/PickupTimePicker";
import type { PickupSchedulingConfig } from "@/features/checkout/interfaces/pickupSchedule";
import type { BusinessHours } from "@/features/configuracion/interfaces/businessHours";
import { FeesBreakdownCard } from "@/features/checkout/components/payment-plan/FeesBreakdownCard";
import { FrequencyPicker } from "@/features/checkout/components/payment-plan/FrequencyPicker";
import { InstallmentsPicker } from "@/features/checkout/components/payment-plan/InstallmentsPicker";
import { MsiBreakdownCard } from "@/features/checkout/components/payment-plan/MsiBreakdownCard";
import { MsiPicker } from "@/features/checkout/components/payment-plan/MsiPicker";
import { PaymentModeTabs } from "@/features/checkout/components/payment-plan/PaymentModeTabs";
import type { CartFrequency } from "@/features/checkout/helpers/cartFrequency";
import type { FeeBreakdown } from "@/features/checkout/hooks/usePaymentMode";
import type { PaymentMode } from "@/features/checkout/interfaces/paymentMode";
import type {
  CheckoutFulfillmentMethod,
  CheckoutPaymentMethod,
} from "@/features/checkout/interfaces/publicCheckout";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Pencil,
  ReceiptText,
  UserRound,
} from "lucide-react";

interface CheckoutBodyProps {
  variant: "desktop" | "mobile";
  formState: {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    scheduled_for: string;
  };
  fieldErrors: Record<string, string>;
  onFormFieldChange: (
    field:
      | "customer_name"
      | "customer_email"
      | "customer_phone"
      | "scheduled_for",
    value: string,
  ) => void;
  /** Ventana de recolección del negocio. Con `enabled: false` no se pinta nada. */
  pickupScheduling: PickupSchedulingConfig;
  /** `null` = el negocio no dio de alta horarios. */
  businessHours: BusinessHours | null;
  pickupPointName?: string;
  pickupPointAddress?: string;
  onSubmit: (e: React.FormEvent) => void;
  onWhatsAppOrder?: () => void;
  fulfillmentMethod: CheckoutFulfillmentMethod;
  checkoutPaymentMethod: CheckoutPaymentMethod;
  onCheckoutSelectionChange: () => void;
  whatsappOrdersEnabled?: boolean;
  submitting: boolean;
  submitLabel: string;
  submitDisclaimer: string;
  subtotal: number;
  accentColor: string;
  hasRecurringOptions: boolean;
  recurringConfig: RecurringPurchasesConfig;
  paymentMode: PaymentMode;
  onPaymentModeChange: (mode: PaymentMode) => void;
  selectedInstallments: number;
  onSelectedInstallmentsChange: (value: number) => void;
  installmentOptions: number[];
  selectedFrequency: CartFrequency;
  onSelectedFrequencyChange: (value: CartFrequency) => void;
  feeBreakdown: FeeBreakdown | null;
  msiOption: MsiOption;
  onMsiOptionChange: (value: MsiOption) => void;
  msiBaseAmount: number;
  viableMsiOptions: MsiOption[];
  msiBreakdown: {
    total: number;
    perMonth: number;
    mpFee: number;
  } | null;
}

export function CheckoutBody({
  variant,
  formState,
  fieldErrors,
  onFormFieldChange,
  onSubmit,
  onWhatsAppOrder,
  fulfillmentMethod,
  checkoutPaymentMethod,
  onCheckoutSelectionChange,
  whatsappOrdersEnabled = false,
  submitting,
  submitLabel,
  submitDisclaimer,
  subtotal,
  accentColor,
  hasRecurringOptions,
  recurringConfig,
  paymentMode,
  onPaymentModeChange,
  selectedInstallments,
  onSelectedInstallmentsChange,
  installmentOptions,
  selectedFrequency,
  onSelectedFrequencyChange,
  feeBreakdown,
  msiOption,
  onMsiOptionChange,
  msiBaseAmount,
  viableMsiOptions,
  msiBreakdown,
  pickupScheduling,
  businessHours,
  pickupPointName,
  pickupPointAddress,
}: CheckoutBodyProps) {
  const idPrefix = variant === "mobile" ? "m-" : "";
  const formId = `${idPrefix}checkout-form`;
  const usesMercadoPago = checkoutPaymentMethod === "mercadopago";
  const paymentTitle =
    checkoutPaymentMethod === "bank_transfer"
      ? "Transferencia bancaria"
      : checkoutPaymentMethod === "cash"
        ? "Pago al recoger"
        : "Pago en línea";
  const confirmationTitle =
    checkoutPaymentMethod === "bank_transfer"
      ? "Comprobante"
      : checkoutPaymentMethod === "cash"
        ? "Confirmación"
        : "Pago seguro";

  return (
    <fieldset disabled={submitting} className="contents" aria-busy={submitting}>
      <div className="h-36 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/80 p-3 mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-gray-500">
              Paso 2 de 2
            </p>
            <p className="mt-0.5 text-sm font-semibold text-gray-900">
              {paymentTitle}
            </p>
            <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
              {fulfillmentMethod === "delivery"
                ? "Entrega a domicilio"
                : [pickupPointName, pickupPointAddress]
                    .filter(Boolean)
                    .join(" · ") || "Recolección en negocio"}
            </p>
          </div>
          <button
            type="button"
            onClick={onCheckoutSelectionChange}
            className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-gray-600 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            Cambiar
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="flex h-12 items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 font-semibold text-gray-900 shadow-sm">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <UserRound className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span>Tus datos</span>
          </div>
          <div className="flex h-12 items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 font-semibold text-gray-900 shadow-sm">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              {checkoutPaymentMethod === "cash" ? (
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <ReceiptText className="h-3.5 w-3.5" aria-hidden />
              )}
            </span>
            <span className="truncate">{confirmationTitle}</span>
          </div>
        </div>
      </div>

      {usesMercadoPago && hasRecurringOptions && (
        <div className="space-y-3">
          <PaymentModeTabs
            paymentMode={paymentMode}
            onChange={onPaymentModeChange}
            installmentsEnabled={recurringConfig.installments_enabled}
            recurringEnabled={recurringConfig.recurring_enabled}
            accentColor={accentColor}
          />

          {paymentMode === "installments" && (
            <InstallmentsPicker
              options={installmentOptions}
              selected={selectedInstallments}
              subtotal={subtotal}
              onSelect={onSelectedInstallmentsChange}
              accentColor={accentColor}
            />
          )}

          {paymentMode !== "single" && (
            <FrequencyPicker
              paymentMode={paymentMode}
              frequencies={recurringConfig.allowed_frequencies}
              selected={selectedFrequency}
              onSelect={onSelectedFrequencyChange}
              accentColor={accentColor}
            />
          )}

          {feeBreakdown && (
            <FeesBreakdownCard
              paymentMode={paymentMode}
              feeBreakdown={feeBreakdown}
              selectedFrequency={selectedFrequency}
              feeAbsorbedBy={recurringConfig.fee_absorbed_by}
            />
          )}
        </div>
      )}

      {usesMercadoPago && paymentMode !== "recurring" && msiBaseAmount > 0 && (
        <div className="space-y-3">
          <MsiPicker
            paymentMode={paymentMode}
            msiBaseAmount={msiBaseAmount}
            msiOption={msiOption}
            viableMsiOptions={viableMsiOptions}
            feeAbsorbedBy={recurringConfig.fee_absorbed_by}
            accentColor={accentColor}
            onSelect={onMsiOptionChange}
          />
          <MsiBreakdownCard
            paymentMode={paymentMode}
            msiOption={msiOption}
            total={msiBreakdown?.total ?? subtotal}
            subtotal={msiBaseAmount}
            perMonth={msiBreakdown?.perMonth ?? subtotal}
            mpFee={msiBreakdown?.mpFee ?? 0}
            feeAbsorbedBy={recurringConfig.fee_absorbed_by}
            accentColor={accentColor}
          />
        </div>
      )}

      <form id={formId} onSubmit={onSubmit} className="space-y-4">
        <CheckoutFormFields
          idPrefix={idPrefix}
          form={formState}
          fieldErrors={fieldErrors}
          onUpdate={onFormFieldChange}
          emailOptional={false}
          disabled={submitting}
        />

        {fulfillmentMethod === "pickup" ? (
          <PickupTimePicker
            config={pickupScheduling}
            businessHours={businessHours}
            value={formState.scheduled_for}
            onChange={(v) => onFormFieldChange("scheduled_for", v)}
            accentColor={accentColor}
            disabled={submitting}
            error={fieldErrors.scheduled_for}
          />
        ) : null}

        {variant === "desktop" && (
          <div className="space-y-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl px-6 py-4 font-semibold text-white transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ backgroundColor: accentColor }}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Creando tu pedido…
                </>
              ) : (
                <>
                  {submitLabel}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </>
              )}
            </button>
            <p className="px-1 text-center text-[11px] text-gray-500">
              {submitDisclaimer}
            </p>
            {whatsappOrdersEnabled && onWhatsAppOrder && (
              <button
                type="button"
                disabled={submitting}
                onClick={onWhatsAppOrder}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:opacity-50"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                Pedir por WhatsApp
              </button>
            )}
          </div>
        )}
        {variant === "mobile" && whatsappOrdersEnabled && onWhatsAppOrder && (
          <button
            type="button"
            disabled={submitting}
            onClick={onWhatsAppOrder}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:opacity-50"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            Pedir por WhatsApp
          </button>
        )}
      </form>
    </fieldset>
  );
}
