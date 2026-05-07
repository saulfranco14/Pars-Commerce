"use client";

import type { MsiOption } from "@/constants/commissionConfig";
import type { RecurringPurchasesConfig } from "@/types/subscriptions";

import { CheckoutFormFields } from "@/features/checkout/components/cart/CheckoutFormFields";
import { FeesBreakdownCard } from "@/features/checkout/components/cart/FeesBreakdownCard";
import { FrequencyPicker } from "@/features/checkout/components/cart/FrequencyPicker";
import { InstallmentsPicker } from "@/features/checkout/components/cart/InstallmentsPicker";
import { MsiBreakdownCard } from "@/features/checkout/components/cart/MsiBreakdownCard";
import { MsiPicker } from "@/features/checkout/components/cart/MsiPicker";
import { PaymentModeTabs } from "@/features/checkout/components/cart/PaymentModeTabs";
import type { CartFrequency } from "@/features/checkout/helpers/cartFrequency";
import type { FeeBreakdown } from "@/features/checkout/hooks/usePaymentMode";
import type { PaymentMode } from "@/features/checkout/interfaces/paymentMode";

interface CheckoutBodyProps {
  variant: "desktop" | "mobile";
  formState: {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
  };
  fieldErrors: Record<string, string>;
  onFormFieldChange: (
    field: "customer_name" | "customer_email" | "customer_phone",
    value: string,
  ) => void;
  onSubmit: (e: React.FormEvent) => void;
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

/**
 * Cuerpo común del checkout — usado tanto en el aside de desktop como en el
 * bottom-sheet de mobile. Compone subtotal, selector de modo, MSI,
 * frecuencia, desgloses y formulario, sincronizando todos los IDs y `form`
 * para que los handlers funcionen con submit nativo.
 */
export function CheckoutBody({
  variant,
  formState,
  fieldErrors,
  onFormFieldChange,
  onSubmit,
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
}: CheckoutBodyProps) {
  const idPrefix = variant === "mobile" ? "m-" : "";
  const formId = `${idPrefix}checkout-form`;

  return (
    <>
      <div
        className="flex items-center justify-between rounded-xl border-2 px-4 py-4"
        style={{
          borderColor: accentColor,
          backgroundColor: `${accentColor}0c`,
        }}
      >
        <span className="text-sm font-semibold text-gray-700">Subtotal</span>
        <span
          className="text-xl font-bold tabular-nums"
          style={{ color: accentColor }}
        >
          ${subtotal.toFixed(2)}
        </span>
      </div>

      {hasRecurringOptions && (
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

      {paymentMode !== "recurring" && msiBaseAmount > 0 && (
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
          {msiBreakdown && (
            <MsiBreakdownCard
              paymentMode={paymentMode}
              msiOption={msiOption}
              total={msiBreakdown.total}
              perMonth={msiBreakdown.perMonth}
              mpFee={msiBreakdown.mpFee}
              feeAbsorbedBy={recurringConfig.fee_absorbed_by}
              accentColor={accentColor}
            />
          )}
        </div>
      )}

      <form id={formId} onSubmit={onSubmit} className="space-y-4">
        <CheckoutFormFields
          idPrefix={idPrefix}
          form={formState}
          fieldErrors={fieldErrors}
          onUpdate={onFormFieldChange}
        />

        {variant === "desktop" && (
          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[48px] cursor-pointer rounded-xl px-6 py-4 font-semibold text-white transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{ backgroundColor: accentColor }}
          >
            {submitLabel}
          </button>
        )}
      </form>

      {variant === "desktop" && (
        <p className="text-xs text-gray-500">{submitDisclaimer}</p>
      )}
    </>
  );
}
