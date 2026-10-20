"use client";

import { ArrowLeft, ArrowRight, X } from "lucide-react";

import { TlacoLogo } from "@/components/brand/TlacoLogo";
import { useSolutionOnboarding } from "@/features/solutions/hooks/useSolutionOnboarding";
import { OnboardingCatalogStep } from "@/features/solutions/components/onboarding/OnboardingCatalogStep";
import { OnboardingGoalsStep } from "@/features/solutions/components/onboarding/OnboardingGoalsStep";
import { OnboardingNameStep } from "@/features/solutions/components/onboarding/OnboardingNameStep";

import { ONBOARDING_STEP_COUNT } from "@/features/solutions/constants/solutionOnboarding";

import type { SolutionDefinition } from "@/features/solutions/solutionCatalog";

function StepProgress({ current }: { current: number }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex items-center gap-1.5" aria-hidden>
        {Array.from({ length: ONBOARDING_STEP_COUNT }, (_, index) => (
          <span
            key={index}
            className={`h-1.5 rounded-full transition-all ${
              index === current ? "w-7 bg-accent" : index < current ? "w-1.5 bg-accent/50" : "w-1.5 bg-border"
            }`}
          />
        ))}
      </div>
      <span className="text-[11px] font-medium text-muted-foreground">
        Paso {current + 1} de {ONBOARDING_STEP_COUNT}
      </span>
    </div>
  );
}

/** Tres preguntas antes del registro; el sitio se arma con estas respuestas. */
export function SolutionOnboarding({
  solution,
  name,
  setName,
  selectedTheme,
  setSelectedTheme,
  onClose,
}: {
  solution: SolutionDefinition;
  name: string;
  setName: (value: string) => void;
  selectedTheme: number;
  setSelectedTheme: (value: number) => void;
  onClose: () => void;
}) {
  const flow = useSolutionOnboarding({ solution, name, selectedTheme, onClose });

  return (
    <div
      className="fixed inset-0 z-80 overflow-y-auto bg-background text-foreground"
      role="dialog"
      aria-modal="true"
      aria-labelledby="solution-onboarding-title"
    >
      <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-5 pt-5 sm:px-8 sm:pt-7">
        <div className="flex items-center justify-between">
          <TlacoLogo size="md" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar preparación"
            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-border-soft hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="flex flex-1 items-start py-8 sm:items-center sm:py-12">
          <div key={flow.step} className="animate-fade-in-up mx-auto w-full max-w-3xl sm:min-h-118">
            {flow.step === 0 && (
              <OnboardingNameStep
                name={name}
                setName={setName}
                fallbackName={solution.preset.defaultName}
                heroImage={solution.heroImage}
                selectedTheme={selectedTheme}
                setSelectedTheme={setSelectedTheme}
                inputRef={flow.nameInputRef}
                onSubmit={flow.next}
              />
            )}
            {flow.step === 1 && <OnboardingGoalsStep goals={flow.goals} toggleGoal={flow.toggleGoal} />}
            {flow.step === 2 && (
              <OnboardingCatalogStep catalogMode={flow.catalogMode} setCatalogMode={flow.setCatalogMode} />
            )}
          </div>
        </div>

        <div className="sticky bottom-0 z-10 -mx-5 border-t border-border bg-background/95 px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur sm:-mx-8 sm:px-8">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <button
              type="button"
              onClick={flow.back}
              className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xl px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-border-soft hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {flow.step === 0 ? "Volver" : "Anterior"}
            </button>
            <StepProgress current={flow.step} />
            <button
              type="button"
              onClick={flow.next}
              disabled={!flow.canContinue}
              className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              {flow.isLastStep ? "Crear mi cuenta" : "Continuar"}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
