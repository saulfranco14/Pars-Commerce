"use client";

import { Check } from "lucide-react";

import { OPTION_CARD } from "@/components/wizard/wizardStyles";
import { WizardStepHeading } from "@/components/wizard/WizardStepHeading";

import { PROMOTION_MECHANICS } from "@/features/promociones/constants/promotionMechanics";
import { OFFER_WIZARD_TITLE_ID } from "@/features/promociones/constants/offerWizard";

import type { PromotionMechanic } from "@/features/promociones/interfaces/offerTemplate";

export function MechanicStep({
  value,
  onChange,
}: {
  value: PromotionMechanic;
  onChange: (mechanic: PromotionMechanic) => void;
}) {
  return (
    <div className="space-y-6">
      <WizardStepHeading
        titleId={OFFER_WIZARD_TITLE_ID}
        eyebrow="Cómo funciona"
        title="¿Qué tipo de promoción es?"
        subtitle="Esto define cómo se calcula el precio en tu tienda y en el carrito."
      />
      <div role="radiogroup" aria-label="Tipo de promoción" className="grid gap-3 sm:grid-cols-2">
        {PROMOTION_MECHANICS.map((mechanic) => {
          const selected = mechanic.value === value;
          const Icon = mechanic.icon;
          return (
            <button
              key={mechanic.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(mechanic.value)}
              className={`${OPTION_CARD.base} ${selected ? OPTION_CARD.selected : OPTION_CARD.idle} flex items-start gap-3 bg-surface p-4`}
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  selected ? "bg-accent text-accent-foreground" : "bg-accent/10 text-accent"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold text-foreground">{mechanic.title}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{mechanic.description}</span>
                <span className="mt-1 block text-xs font-medium text-foreground/70">Ej. {mechanic.example}</span>
              </span>
              {selected ? <Check className="h-5 w-5 shrink-0 text-foreground" aria-hidden /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
