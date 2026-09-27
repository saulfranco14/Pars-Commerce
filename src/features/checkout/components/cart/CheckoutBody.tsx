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
import { MessageCircle } from "lucide-react";

export type CheckoutIntent = "online" | "request";

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
  onSubmit: (e: React.FormEvent) => void;
  onWhatsAppOrder?: () => void;
  onRequestOrder?: () => void;
  checkoutIntent: CheckoutIntent;
  onCheckoutIntentChange: (intent: CheckoutIntent) => void;
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
  onRequestOrder,
  checkoutIntent,
  onCheckoutIntentChange,
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
}: CheckoutBodyProps) {
  const idPrefix = variant === "mobile" ? "m-" : "";
  const formId = `${idPrefix}checkout-form`;
  const isRequest = checkoutIntent === "request";
  const requestLabel = "Enviar solicitud para recoger";
  const primaryLabel = isRequest ? requestLabel : submitLabel;
  const primaryDisclaimer = isRequest
    ? "El negocio revisará tu solicitud antes de prepararla."
    : submitDisclaimer;
  const handleFormSubmit = (event: React.FormEvent) => {
    if (!isRequest) {
      onSubmit(event);
      return;
    }
    event.preventDefault();
    onRequestOrder?.();
  };

  return (
    <>
      <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-gray-500">Finaliza en 2 pasos</p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-white px-2.5 py-2 font-semibold text-gray-900 shadow-sm">1. Tus datos</div>
          <div className="rounded-lg px-2.5 py-2 text-gray-500">2. {isRequest ? "Confirmación" : "Pago seguro"}</div>
        </div>
      </div>

      <section>
        <p className="mb-2 text-sm font-semibold text-gray-900">¿Cómo quieres finalizar?</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => onCheckoutIntentChange("online")} className={`min-h-18 rounded-xl border-2 px-3 py-3 text-left transition-colors ${!isRequest ? "border-accent bg-accent/5" : "border-gray-200 bg-white hover:bg-gray-50"}`} style={!isRequest ? { borderColor: accentColor } : undefined}>
            <span className="block text-sm font-bold text-gray-900">Pagar en línea</span>
            <span className="mt-0.5 block text-xs text-gray-500">Confirma tu compra con Mercado Pago.</span>
          </button>
          <button type="button" onClick={() => onCheckoutIntentChange("request")} className={`min-h-18 rounded-xl border-2 px-3 py-3 text-left transition-colors ${isRequest ? "border-accent bg-accent/5" : "border-gray-200 bg-white hover:bg-gray-50"}`} style={isRequest ? { borderColor: accentColor } : undefined}>
            <span className="block text-sm font-bold text-gray-900">Solicitar para recoger</span>
            <span className="mt-0.5 block text-xs text-gray-500">El negocio confirma antes de preparar.</span>
          </button>
        </div>
      </section>

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

      {!isRequest && hasRecurringOptions && (
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

      {!isRequest && paymentMode !== "recurring" && msiBaseAmount > 0 && (
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

      <form id={formId} onSubmit={handleFormSubmit} className="space-y-4">
        <CheckoutFormFields
          idPrefix={idPrefix}
          form={formState}
          fieldErrors={fieldErrors}
          onUpdate={onFormFieldChange}
          emailOptional={isRequest}
        />

        <PickupTimePicker
          config={pickupScheduling}
          businessHours={businessHours}
          value={formState.scheduled_for}
          onChange={(v) => onFormFieldChange("scheduled_for", v)}
          accentColor={accentColor}
          disabled={submitting}
          error={fieldErrors.scheduled_for}
        />

        {variant === "desktop" && (
          <div className="space-y-2">
            <button type="submit" disabled={submitting} className="w-full min-h-12 cursor-pointer rounded-xl px-6 py-4 font-semibold text-white transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2" style={{ backgroundColor: accentColor }}>{submitting ? "Procesando…" : primaryLabel}</button>
            <p className="px-1 text-center text-[11px] text-gray-500">{primaryDisclaimer}</p>
            {whatsappOrdersEnabled && onWhatsAppOrder && (
              <button type="button" disabled={submitting} onClick={onWhatsAppOrder} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:opacity-50"><MessageCircle className="h-4 w-4" aria-hidden />Pedir por WhatsApp</button>
            )}
          </div>
        )}
        {variant === "mobile" && whatsappOrdersEnabled && onWhatsAppOrder && (
          <button type="button" disabled={submitting} onClick={onWhatsAppOrder} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:opacity-50"><MessageCircle className="h-4 w-4" aria-hidden />Pedir por WhatsApp</button>
        )}
      </form>

      {variant === "desktop" && (
        <p className="text-xs text-gray-500">{primaryDisclaimer}</p>
      )}
    </>
  );
}
