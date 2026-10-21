"use client";

import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { WizardStepHeading } from "@/components/wizard/WizardStepHeading";
import { CHOICE_CHIP, FIELD_LABEL } from "@/components/wizard/wizardStyles";

import { formatCurrency } from "@/features/qr/helpers/format";
import { formatInterval } from "@/lib/offers/planPeriods";
import { DURATION_PRESETS, INTERVAL_PRESETS } from "@/features/planes/constants/planOptions";
import { PLAN_WIZARD_TITLE_ID } from "@/features/planes/constants/planWizard";

import type { PlanWizardValues } from "@/features/planes/interfaces/planWizard";
import type { Path, PathValue, UseFormReturn } from "react-hook-form";

const DISCOUNTS = [0.05, 0.1, 0.15];

export function PlanPriceStep({
  form,
  values,
  listValue,
}: {
  form: UseFormReturn<PlanWizardValues>;
  values: PlanWizardValues;
  listValue: number;
}) {
  const errors = form.formState.errors;
  const set = <K extends Path<PlanWizardValues>>(key: K, value: PathValue<PlanWizardValues, K>) =>
    form.setValue(key, value, { shouldValidate: true, shouldDirty: true });
  const price = Number(values.price) || 0;
  const savings = listValue - price;
  const every = formatInterval({ unit: values.intervalUnit, count: values.intervalCount });

  return (
    <div className="space-y-6">
      <WizardStepHeading
        titleId={PLAN_WIZARD_TITLE_ID}
        eyebrow="Precio"
        title="¿Cada cuánto y a qué precio?"
        subtitle="El cliente paga el primer periodo al comprar; los siguientes se cobran antes de cada periodo."
      />

      <fieldset>
        <legend className={FIELD_LABEL}>Se repite</legend>
        <div className="flex flex-wrap gap-2">
          {INTERVAL_PRESETS.map((preset) => {
            const active = values.intervalUnit === preset.interval.unit && values.intervalCount === preset.interval.count;
            return (
              <button
                key={preset.label}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  set("intervalUnit", preset.interval.unit);
                  set("intervalCount", preset.interval.count);
                }}
                className={`${CHOICE_CHIP.base} ${active ? CHOICE_CHIP.on : CHOICE_CHIP.off}`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <span className={FIELD_LABEL}>Precio por {every}</span>
        <CurrencyInput value={values.price} onValueChange={(value) => set("price", value)} placeholder="0.00" aria-label="Precio por periodo" />
        {listValue > 0 ? (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            Por separado suman {formatCurrency(listValue)}.
            {DISCOUNTS.map((discount) => (
              <button
                key={discount}
                type="button"
                onClick={() => set("price", Math.floor(listValue * (1 - discount)).toFixed(2))}
                className={`${CHOICE_CHIP.base} min-h-9 px-3 text-xs ${CHOICE_CHIP.off}`}
              >
                {Math.round(discount * 100)}% menos
              </button>
            ))}
          </div>
        ) : null}
        {errors.price?.message ? <p className="mt-2 text-sm font-medium text-red-600">{errors.price.message}</p> : null}
        {price > 0 && savings > 0 ? (
          <p className="mt-3 rounded-xl bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            Tu cliente ahorra {formatCurrency(savings)} cada {every}.
          </p>
        ) : null}
      </div>

      <fieldset>
        <legend className={FIELD_LABEL}>Duración</legend>
        <div className="flex flex-wrap gap-2">
          {DURATION_PRESETS.map((preset) => {
            const active = values.maxPeriods === preset.value;
            return (
              <button
                key={preset.label}
                type="button"
                aria-pressed={active}
                onClick={() => set("maxPeriods", preset.value)}
                className={`${CHOICE_CHIP.base} ${active ? CHOICE_CHIP.on : CHOICE_CHIP.off}`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
