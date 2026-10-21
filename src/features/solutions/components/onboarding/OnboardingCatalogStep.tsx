import { Check } from "lucide-react";

import { WizardStepHeading } from "@/components/wizard/WizardStepHeading";

import { CATALOG_MODES } from "@/features/solutions/constants/solutionOnboarding";
import { OPTION_CARD } from "@/components/wizard/wizardStyles";
import { ONBOARDING_TITLE_ID } from "@/features/solutions/constants/solutionOnboarding";

import type { CatalogStartMode } from "@/features/auth/registrationIntent";

export function OnboardingCatalogStep({
  catalogMode,
  setCatalogMode,
}: {
  catalogMode: CatalogStartMode;
  setCatalogMode: (mode: CatalogStartMode) => void;
}) {
  return (
    <div>
      <WizardStepHeading
        titleId={ONBOARDING_TITLE_ID}
        eyebrow="Tu catálogo"
        title="¿Cómo quieres comenzar?"
        subtitle="Podrás cambiarlo todo después; esto sólo evita empezar desde cero."
      />
      <div className="mt-8 space-y-3" role="radiogroup" aria-label="Cómo empezar tu catálogo">
        {CATALOG_MODES.map((mode) => {
          const selected = catalogMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setCatalogMode(mode.id)}
              className={`${OPTION_CARD.base} flex min-h-24 w-full items-center gap-4 p-5 ${selected ? OPTION_CARD.selected : OPTION_CARD.idle}`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                  selected ? "border-foreground bg-foreground text-background" : "border-border"
                }`}
              >
                {selected && <Check className="h-4 w-4" aria-hidden />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2 font-semibold text-foreground">
                  {mode.title}
                  {mode.recommended && (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                      Recomendado
                    </span>
                  )}
                </span>
                <span className="mt-1 block text-sm leading-5 text-muted-foreground">{mode.text}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
