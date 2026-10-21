"use client";

import { RefreshCcw, Type } from "lucide-react";

import { FormInput } from "@/components/ui/FormInput";
import { ImageUpload } from "@/components/ImageUpload";
import { WizardStepHeading } from "@/components/wizard/WizardStepHeading";
import { FIELD_LABEL } from "@/components/wizard/wizardStyles";

import { PLAN_WIZARD_TITLE_ID } from "@/features/planes/constants/planWizard";

import type { PlanWizardValues } from "@/features/planes/interfaces/planWizard";
import type { Path, PathValue, UseFormReturn } from "react-hook-form";

export function PlanPresentationStep({
  form,
  values,
  tenantId,
  onSuggestName,
}: {
  form: UseFormReturn<PlanWizardValues>;
  values: PlanWizardValues;
  tenantId: string;
  onSuggestName: () => void;
}) {
  const errors = form.formState.errors;
  const set = <K extends Path<PlanWizardValues>>(key: K, value: PathValue<PlanWizardValues, K>) =>
    form.setValue(key, value, { shouldValidate: true, shouldDirty: true });

  return (
    <div className="space-y-6">
      <WizardStepHeading
        titleId={PLAN_WIZARD_TITLE_ID}
        eyebrow="Presentación"
        title="¿Cómo se verá en tu tienda?"
        subtitle="Un buen nombre y una foto ayudan a que más clientes se suscriban."
      />

      <div className="space-y-2">
        <FormInput
          label="Nombre del plan"
          icon={Type}
          value={values.name}
          onChange={(event) => set("name", event.target.value)}
          maxLength={80}
          error={errors.name?.message}
        />
        <button
          type="button"
          onClick={onSuggestName}
          className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-accent hover:bg-accent/10"
        >
          <RefreshCcw className="h-4 w-4" aria-hidden />
          Sugerir nombre
        </button>
      </div>

      <label className="block">
        <span className={FIELD_LABEL}>
          Descripción <span className="font-normal text-muted-foreground">(opcional)</span>
        </span>
        <textarea
          value={values.description}
          onChange={(event) => set("description", event.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Qué incluye, cuándo se entrega y cualquier condición"
          className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-base outline-none focus:border-accent"
        />
        {errors.description?.message ? <span className="mt-1 block text-sm font-medium text-red-600">{errors.description.message}</span> : null}
      </label>

      <ImageUpload
        tenantId={tenantId}
        variant="promotion"
        currentUrl={values.imageUrl || null}
        onUploaded={(url) => set("imageUrl", url)}
        label="Imagen del plan (opcional)"
      />
    </div>
  );
}
