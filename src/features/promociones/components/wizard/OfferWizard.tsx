"use client";

import { BadgePercent } from "lucide-react";

import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { WizardShell } from "@/components/wizard/WizardShell";
import { useOfferWizard } from "@/features/promociones/hooks/useOfferWizard";
import { DetailsStep } from "@/features/promociones/components/wizard/DetailsStep";
import { MechanicStep } from "@/features/promociones/components/wizard/MechanicStep";
import { ProductsStep } from "@/features/promociones/components/wizard/ProductsStep";
import { ReviewStep } from "@/features/promociones/components/wizard/ReviewStep";
import { TemplateStep } from "@/features/promociones/components/wizard/TemplateStep";

import { BUSINESS_TYPES } from "@/constants/businessTypes";
import { OFFER_WIZARD_TITLE_ID } from "@/features/promociones/constants/offerWizard";

interface OfferWizardProps {
  tenantId: string;
  businessType: string | null;
  promotionId?: string | null;
  templateKey?: string | null;
  onClose: () => void;
  onSaved: (id: string) => void;
  onStartPlan?: (templateKey: string) => void;
}

export function OfferWizard({ tenantId, businessType, promotionId, templateKey, onClose, onSaved, onStartPlan }: OfferWizardProps) {
  const wizard = useOfferWizard({ tenantId, promotionId, templateKey, onClose, onSaved, onStartPlan });
  const businessLabel = BUSINESS_TYPES.find((type) => type.value === businessType)?.label.toLowerCase() ?? null;
  const isLast = wizard.stepKey === "revisar";

  return (
    <WizardShell
      titleId={OFFER_WIZARD_TITLE_ID}
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
          <BadgePercent className="h-5 w-5 text-accent" aria-hidden />
          {wizard.isEdit ? "Editar promoción" : "Nueva promoción"}
        </span>
      }
    >
      {wizard.loading ? (
        <LoadingBlock />
      ) : wizard.stepKey === "plantilla" ? (
        <TemplateStep businessType={businessType} businessLabel={businessLabel} onPick={wizard.chooseTemplate} />
      ) : wizard.stepKey === "mecanica" ? (
        <MechanicStep
          value={wizard.values.mechanic}
          onChange={(mechanic) => wizard.form.setValue("mechanic", mechanic, { shouldValidate: true })}
        />
      ) : wizard.stepKey === "productos" ? (
        <ProductsStep
          form={wizard.form}
          values={wizard.values}
          items={wizard.catalog.items}
          subcatalogs={wizard.catalog.subcatalogs}
        />
      ) : wizard.stepKey === "detalles" ? (
        <DetailsStep
          form={wizard.form}
          values={wizard.values}
          tenantId={tenantId}
          itemsById={wizard.catalog.itemsById}
          onSuggestName={wizard.suggestName}
        />
      ) : (
        <ReviewStep
          values={wizard.values}
          itemsById={wizard.catalog.itemsById}
          subcatalogs={wizard.catalog.subcatalogs}
          error={wizard.error}
          submitting={wizard.submitting}
          isEdit={wizard.isEdit}
          onSaveDraft={() => void wizard.saveDraft()}
        />
      )}
    </WizardShell>
  );
}
