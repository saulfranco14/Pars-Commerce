"use client";

import { CheckCircle2, CreditCard, Store, Truck, Users } from "lucide-react";

import { FormInput } from "@/components/ui/FormInput";
import { TouchStepper } from "@/components/ui/TouchStepper";
import { WizardStepHeading } from "@/components/wizard/WizardStepHeading";
import { CHOICE_CHIP, FIELD_LABEL, OPTION_CARD } from "@/components/wizard/wizardStyles";

import { formatCurrency } from "@/features/qr/helpers/format";
import { BILLING_LABELS, FULFILLMENT_LABELS, WEEKDAY_LABELS } from "@/features/planes/constants/planOptions";
import { PLAN_WIZARD_TITLE_ID } from "@/features/planes/constants/planWizard";

import type { PlanWizardValues } from "@/features/planes/interfaces/planWizard";
import type { Path, PathValue, UseFormReturn } from "react-hook-form";

const METHODS = [
  { value: "pickup", icon: Store },
  { value: "delivery", icon: Truck },
] as const;

export function PlanDeliveryStep({
  form,
  values,
  pickupEnabled,
  deliveryEnabled,
  deliveryFee,
}: {
  form: UseFormReturn<PlanWizardValues>;
  values: PlanWizardValues;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  deliveryFee: number;
}) {
  const errors = form.formState.errors;
  const set = <K extends Path<PlanWizardValues>>(key: K, value: PathValue<PlanWizardValues, K>) =>
    form.setValue(key, value, { shouldValidate: true, shouldDirty: true });
  const enabled = { pickup: pickupEnabled, delivery: deliveryEnabled };

  function toggle(method: "pickup" | "delivery") {
    const has = values.fulfillmentMethods.includes(method);
    set("fulfillmentMethods", has ? values.fulfillmentMethods.filter((value) => value !== method) : [...values.fulfillmentMethods, method]);
  }

  return (
    <div className="space-y-6">
      <WizardStepHeading
        titleId={PLAN_WIZARD_TITLE_ID}
        eyebrow="Entrega y cobro"
        title="¿Cómo lo recibe y cómo paga?"
        subtitle="Solo aparecen las entregas que tienes activas en tu sitio."
      />

      <fieldset>
        <legend className={FIELD_LABEL}>Entrega</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {METHODS.map(({ value, icon: Icon }) => {
            const active = values.fulfillmentMethods.includes(value);
            const available = enabled[value] || active;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                disabled={!available}
                onClick={() => toggle(value)}
                className={`${OPTION_CARD.base} ${active ? OPTION_CARD.selected : OPTION_CARD.idle} flex items-start gap-3 bg-surface p-4 disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
                <span>
                  <span className="block text-sm font-semibold text-foreground">{FULFILLMENT_LABELS[value]}</span>
                  <span className="block text-xs text-muted-foreground">
                    {!enabled[value]
                      ? "Actívala en Sitio web › Entregas y pagos."
                      : value === "delivery" && deliveryFee > 0
                        ? `Se cobra ${formatCurrency(deliveryFee)} de envío cada periodo.`
                        : value === "delivery"
                          ? "Sin costo de envío."
                          : "El cliente pasa por su pedido."}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        {errors.fulfillmentMethods?.message ? <p className="mt-2 text-sm font-medium text-red-600">{errors.fulfillmentMethods.message}</p> : null}
      </fieldset>

      <fieldset>
        <legend className={FIELD_LABEL}>
          Día preferido <span className="font-normal text-muted-foreground">(opcional)</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={values.preferredWeekday === null}
            onClick={() => set("preferredWeekday", null)}
            className={`${CHOICE_CHIP.base} ${values.preferredWeekday === null ? CHOICE_CHIP.on : CHOICE_CHIP.off}`}
          >
            Sin día fijo
          </button>
          {WEEKDAY_LABELS.map((label, index) => (
            <button
              key={label}
              type="button"
              aria-pressed={values.preferredWeekday === index}
              onClick={() => set("preferredWeekday", index)}
              className={`${CHOICE_CHIP.base} ${values.preferredWeekday === index ? CHOICE_CHIP.on : CHOICE_CHIP.off}`}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={FIELD_LABEL}>Cobro</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className={`${OPTION_CARD.base} ${OPTION_CARD.selected} flex items-start gap-3 bg-surface p-4`}>
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
            <span>
              <span className="block text-sm font-semibold text-foreground">{BILLING_LABELS.manual.title}</span>
              <span className="block text-xs text-muted-foreground">{BILLING_LABELS.manual.description}</span>
            </span>
          </div>
          <div className={`${OPTION_CARD.base} ${OPTION_CARD.idle} flex cursor-not-allowed items-start gap-3 bg-surface p-4 opacity-60`}>
            <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            <span>
              <span className="block text-sm font-semibold text-foreground">{BILLING_LABELS.mp_auto.title}</span>
              <span className="block text-xs text-muted-foreground">{BILLING_LABELS.mp_auto.description}</span>
            </span>
          </div>
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <span className={FIELD_LABEL}>Días antes para generar el cobro</span>
          <TouchStepper value={values.renewalLeadDays} min={0} max={14} onChange={(value) => set("renewalLeadDays", value)} />
        </div>
        <div>
          <span className={FIELD_LABEL}>Días de tolerancia para pagar</span>
          <TouchStepper value={values.graceDays} min={0} max={30} onChange={(value) => set("graceDays", value)} />
        </div>
      </div>

      <FormInput
        label="Cupo de clientes (opcional)"
        icon={Users}
        inputMode="numeric"
        value={values.maxActiveMembers}
        onChange={(event) => set("maxActiveMembers", event.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder="Sin límite"
        error={errors.maxActiveMembers?.message}
      />
    </div>
  );
}
