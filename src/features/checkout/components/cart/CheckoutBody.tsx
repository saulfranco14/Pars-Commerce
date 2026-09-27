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

export function CheckoutIntentPicker({
  accentColor,
  onSelect,
}: {
  accentColor: string;
  onSelect: (intent: CheckoutIntent) => void;
}) {
  return (
    <section className="space-y-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-gray-500">Paso 1 de 2</p>
        <h3 className="mt-1 text-lg font-bold text-gray-900">¿Cómo quieres finalizar?</h3>
        <p className="mt-1 text-sm text-gray-500">Elige una opción y te mostraremos sólo los datos necesarios.</p>
      </div>
      <button type="button" onClick={() => onSelect("online")} className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" style={{ "--tw-ring-color": accentColor } as React.CSSProperties}>
        <span className="block text-base font-bold text-gray-900">Pagar en línea</span>
        <span className="mt-1 block text-sm text-gray-500">Paga de inmediato y recibe confirmación de Mercado Pago.</span>
        <span className="mt-3 inline-flex min-h-10 items-center rounded-xl px-3 text-sm font-bold text-white" style={{ backgroundColor: accentColor }}>Continuar con pago</span>
      </button>
      <button type="button" onClick={() => onSelect("request")} className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" style={{ "--tw-ring-color": accentColor } as React.CSSProperties}>
        <span className="block text-base font-bold text-gray-900">Solicitar para recoger</span>
        <span className="mt-1 block text-sm text-gray-500">El negocio revisa la solicitud antes de prepararla; pagas al recoger.</span>
        <span className="mt-3 inline-flex min-h-10 items-center rounded-xl border px-3 text-sm font-bold" style={{ borderColor: `${accentColor}55`, color: accentColor }}>Enviar solicitud</span>
      </button>
    </section>
  );
}

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
  onCheckoutIntentChange: () => void;
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
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-gray-500">Paso 2 de 2</p>
            <p className="mt-0.5 text-sm font-semibold text-gray-900">{isRequest ? "Solicitud para recoger" : "Pago en línea"}</p>
          </div>
          <button type="button" onClick={onCheckoutIntentChange} className="min-h-10 rounded-lg px-2 text-xs font-semibold text-gray-600 hover:bg-white">Cambiar</button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-white px-2.5 py-2 font-semibold text-gray-900 shadow-sm">1. Tus datos</div>
          <div className="rounded-lg bg-white px-2.5 py-2 font-semibold text-gray-900 shadow-sm">2. {isRequest ? "Confirmación" : "Pago seguro"}</div>
        </div>
      </div>

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
