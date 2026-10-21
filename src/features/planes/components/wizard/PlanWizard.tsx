"use client";

import { Repeat } from "lucide-react";

import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { WizardShell } from "@/components/wizard/WizardShell";
import { usePlanWizard } from "@/features/planes/hooks/usePlanWizard";
import { TemplateStep } from "@/features/promociones/components/wizard/TemplateStep";
import { PlanDeliveryStep } from "@/features/planes/components/wizard/PlanDeliveryStep";
import { PlanItemsStep } from "@/features/planes/components/wizard/PlanItemsStep";
import { PlanPresentationStep } from "@/features/planes/components/wizard/PlanPresentationStep";
import { PlanPriceStep } from "@/features/planes/components/wizard/PlanPriceStep";
import { PlanReviewStep } from "@/features/planes/components/wizard/PlanReviewStep";

import { BUSINESS_TYPES } from "@/constants/businessTypes";
import { PLAN_WIZARD_TITLE_ID } from "@/features/planes/constants/planWizard";

const SUBSCRIPTION_ONLY = ["subscription"] as const;

interface PlanWizardProps {
  tenantId: string;
  businessType: string | null;
  planId?: string | null;
  templateKey?: string | null;
  onClose: () => void;
  onSaved: (id: string) => void;
}

export function PlanWizard({ tenantId, businessType, planId, templateKey, onClose, onSaved }: PlanWizardProps) {
  const wizard = usePlanWizard({ tenantId, planId, templateKey, onClose, onSaved });
  const businessLabel = BUSINESS_TYPES.find((type) => type.value === businessType)?.label.toLowerCase() ?? null;
  const isLast = wizard.stepKey === "revisar";

  return (
    <WizardShell
      titleId={PLAN_WIZARD_TITLE_ID}
      step={wizard.step}
      total={wizard.steps.length}
      canContinue={!wizard.submitting && wizard.stepKey !== "plantilla"}
      nextLabel={isLast ? (wizard.submitting ? "Guardando…" : wizard.isEdit ? "Guardar cambios" : "Publicar") : "Continuar"}
      backLabel={wizard.step === 0 ? "Salir" : "Anterior"}
      closeLabel="Cerrar sin guardar"
      onBack={wizard.back}
      onNext={() => void wizard.next()}
      onClose={onClose}
      header={
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
          <Repeat className="h-5 w-5 text-accent" aria-hidden />
          {wizard.isEdit ? "Editar suscripción" : "Nueva suscripción"}
        </span>
      }
    >
      {wizard.loading ? (
        <LoadingBlock />
      ) : wizard.stepKey === "plantilla" ? (
        <TemplateStep
          businessType={businessType}
          businessLabel={businessLabel}
          onPick={wizard.chooseTemplate}
          kinds={SUBSCRIPTION_ONLY}
          titleId={PLAN_WIZARD_TITLE_ID}
          eyebrow="Nueva suscripción"
        />
      ) : wizard.stepKey === "incluye" ? (
        <PlanItemsStep form={wizard.form} values={wizard.values} products={wizard.products} listValue={wizard.listValue} />
      ) : wizard.stepKey === "precio" ? (
        <PlanPriceStep form={wizard.form} values={wizard.values} listValue={wizard.listValue} />
      ) : wizard.stepKey === "entrega" ? (
        <PlanDeliveryStep
          form={wizard.form}
          values={wizard.values}
          pickupEnabled={wizard.pickupEnabled}
          deliveryEnabled={wizard.deliveryEnabled}
          deliveryFee={wizard.deliveryFee}
        />
      ) : wizard.stepKey === "presentacion" ? (
        <PlanPresentationStep form={wizard.form} values={wizard.values} tenantId={tenantId} onSuggestName={wizard.suggestName} />
      ) : (
        <PlanReviewStep
          values={wizard.values}
          itemsById={wizard.itemsById}
          listValue={wizard.listValue}
          error={wizard.error}
          submitting={wizard.submitting}
          isEdit={wizard.isEdit}
          onSaveDraft={() => void wizard.saveDraft()}
        />
      )}
    </WizardShell>
  );
}
