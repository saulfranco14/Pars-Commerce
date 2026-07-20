"use client";

import type { ConfigRecurrentesSectionProps } from "@/features/configuracion/interfaces/sections";
import {
  labelClass,
  checkboxItemClass,
} from "@/features/configuracion/constants/formClasses";

const FREQUENCY_OPTIONS = [
  { value: "weekly" as const, label: "Semanal" },
  { value: "biweekly" as const, label: "Quincenal" },
  { value: "monthly" as const, label: "Mensual" },
];

const MAX_INSTALLMENT_OPTIONS = ["2", "3", "4", "6", "9", "12"];

export function ConfigRecurrentesSection({
  installmentsEnabled,
  onInstallmentsEnabledChange,
  recurringEnabled,
  onRecurringEnabledChange,
  feeAbsorbedBy,
  onFeeAbsorbedByChange,
  subscriptionDiscountPercent,
  onSubscriptionDiscountPercentChange,
  deliveryOn,
  onDeliveryOnChange,
  allowedFrequencies,
  onAllowedFrequenciesChange,
  maxInstallments,
  onMaxInstallmentsChange,
}: ConfigRecurrentesSectionProps) {
  function toggleFrequency(freq: "weekly" | "biweekly" | "monthly") {
    if (allowedFrequencies.includes(freq)) {
      if (allowedFrequencies.length > 1) {
        onAllowedFrequenciesChange(allowedFrequencies.filter((f) => f !== freq));
      }
    } else {
      onAllowedFrequenciesChange([...allowedFrequencies, freq]);
    }
  }

  const anyEnabled = installmentsEnabled || recurringEnabled;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Configura las opciones de compra en cuotas y recurrente para tu tienda
        pública. Tus clientes podrán elegir estas opciones al finalizar su
        compra.
      </p>

      {/* Toggles principales */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          Modos de pago habilitados
        </h3>
        <label className={checkboxItemClass}>
          <input
            type="checkbox"
            checked={installmentsEnabled}
            onChange={(e) => onInstallmentsEnabledChange(e.target.checked)}
            className="h-4 w-4 cursor-pointer rounded border-border text-accent focus:ring-accent/30"
          />
          <div>
            <span className="text-sm font-medium text-foreground">
              Pago en cuotas
            </span>
            <p className="text-xs text-muted-foreground">
              El cliente divide su compra en N pagos fijos
            </p>
          </div>
        </label>
        <label className={checkboxItemClass}>
          <input
            type="checkbox"
            checked={recurringEnabled}
            onChange={(e) => onRecurringEnabledChange(e.target.checked)}
            className="h-4 w-4 cursor-pointer rounded border-border text-accent focus:ring-accent/30"
          />
          <div>
            <span className="text-sm font-medium text-foreground">
              Compra recurrente
            </span>
            <p className="text-xs text-muted-foreground">
              Cobro automático periódico hasta que el cliente cancele
            </p>
          </div>
        </label>
      </div>

      {anyEnabled && (
        <>
          {/* Tarifa de servicio */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              Tarifa de servicio
            </h3>
            <p className="text-xs text-muted-foreground">
              Se aplica una tarifa por procesamiento de pago en cada cobro
              automático.
            </p>
            <div className="flex gap-3">
              <label
                className={`flex flex-1 min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-medium transition-colors ${
                  feeAbsorbedBy === "customer"
                    ? "border-accent bg-accent/5 text-accent"
                    : "border-border text-muted-foreground hover:border-muted"
                }`}
              >
                <input
                  type="radio"
                  name="fee_absorbed"
                  value="customer"
                  checked={feeAbsorbedBy === "customer"}
                  onChange={() => onFeeAbsorbedByChange("customer")}
                  className="sr-only"
                />
                Cliente la paga
              </label>
              <label
                className={`flex flex-1 min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-medium transition-colors ${
                  feeAbsorbedBy === "business"
                    ? "border-accent bg-accent/5 text-accent"
                    : "border-border text-muted-foreground hover:border-muted"
                }`}
              >
                <input
                  type="radio"
                  name="fee_absorbed"
                  value="business"
                  checked={feeAbsorbedBy === "business"}
                  onChange={() => onFeeAbsorbedByChange("business")}
                  className="sr-only"
                />
                Yo la absorbo
              </label>
            </div>
          </div>

          {/* Frecuencias permitidas */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              Frecuencias disponibles
            </h3>
            <p className="text-xs text-muted-foreground">
              Elige qué frecuencias de cobro pueden seleccionar tus clientes.
            </p>
            <div className="flex gap-2">
              {FREQUENCY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleFrequency(opt.value)}
                  className={`min-h-[44px] cursor-pointer rounded-xl border-2 px-4 py-2 text-sm font-medium transition-colors ${
                    allowedFrequencies.includes(opt.value)
                      ? "border-accent bg-accent/5 text-accent"
                      : "border-border text-muted-foreground hover:border-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Descuento por suscripcion */}
          {recurringEnabled && (
            <div className="space-y-2">
              <label htmlFor="config-sub-discount" className={labelClass}>
                Descuento por compra recurrente (%)
              </label>
              <p className="text-xs text-muted-foreground">
                Incentiva a tus clientes con un descuento por activar compra
                recurrente. Déjalo en 0 si no quieres ofrecer descuento.
              </p>
              <div className="flex gap-2">
                {["0", "5", "10", "15"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => onSubscriptionDiscountPercentChange(v)}
                    className={`min-h-[44px] cursor-pointer rounded-xl border-2 px-4 py-2 text-sm font-medium transition-colors ${
                      subscriptionDiscountPercent === v
                        ? "border-accent bg-accent/5 text-accent"
                        : "border-border text-muted-foreground hover:border-muted"
                    }`}
                  >
                    {v}%
                  </button>
                ))}
                <input
                  id="config-sub-discount"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={50}
                  step={1}
                  value={subscriptionDiscountPercent}
                  onChange={(e) =>
                    onSubscriptionDiscountPercentChange(e.target.value)
                  }
                  className="min-h-[44px] w-20 rounded-xl border border-border px-3 py-2 text-center text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="%"
                />
              </div>
            </div>
          )}

          {/* Cuotas maximas */}
          {installmentsEnabled && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                Cuotas máximas
              </h3>
              <p className="text-xs text-muted-foreground">
                Máximo número de cuotas que puede elegir el cliente.
              </p>
              <div className="flex flex-wrap gap-2">
                {MAX_INSTALLMENT_OPTIONS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => onMaxInstallmentsChange(v)}
                    className={`min-h-[44px] cursor-pointer rounded-xl border-2 px-4 py-2 text-sm font-medium transition-colors ${
                      maxInstallments === v
                        ? "border-accent bg-accent/5 text-accent"
                        : "border-border text-muted-foreground hover:border-muted"
                    }`}
                  >
                    {v}x
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Entrega en cuotas */}
          {installmentsEnabled && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                Entrega del producto (cuotas)
              </h3>
              <p className="text-xs text-muted-foreground">
                Define cuándo entregar el producto cuando el cliente paga en
                cuotas.
              </p>
              <div className="flex gap-3">
                <label
                  className={`flex flex-1 min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-medium transition-colors ${
                    deliveryOn === "first_payment"
                      ? "border-accent bg-accent/5 text-accent"
                      : "border-border text-muted-foreground hover:border-muted"
                  }`}
                >
                  <input
                    type="radio"
                    name="delivery_on"
                    value="first_payment"
                    checked={deliveryOn === "first_payment"}
                    onChange={() => onDeliveryOnChange("first_payment")}
                    className="sr-only"
                  />
                  Al primer cobro
                </label>
                <label
                  className={`flex flex-1 min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-medium transition-colors ${
                    deliveryOn === "full_payment"
                      ? "border-accent bg-accent/5 text-accent"
                      : "border-border text-muted-foreground hover:border-muted"
                  }`}
                >
                  <input
                    type="radio"
                    name="delivery_on"
                    value="full_payment"
                    checked={deliveryOn === "full_payment"}
                    onChange={() => onDeliveryOnChange("full_payment")}
                    className="sr-only"
                  />
                  Al completar pagos
                </label>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
