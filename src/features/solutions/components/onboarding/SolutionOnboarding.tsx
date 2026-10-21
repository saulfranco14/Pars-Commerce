"use client";

import { TlacoLogo } from "@/components/brand/TlacoLogo";
import { WizardShell } from "@/components/wizard/WizardShell";
import { useSolutionOnboarding } from "@/features/solutions/hooks/useSolutionOnboarding";
import { OnboardingCatalogStep } from "@/features/solutions/components/onboarding/OnboardingCatalogStep";
import { OnboardingGoalsStep } from "@/features/solutions/components/onboarding/OnboardingGoalsStep";
import { OnboardingNameStep } from "@/features/solutions/components/onboarding/OnboardingNameStep";

import { ONBOARDING_STEP_COUNT, ONBOARDING_TITLE_ID } from "@/features/solutions/constants/solutionOnboarding";

import type { SolutionDefinition } from "@/features/solutions/solutionCatalog";

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
    <WizardShell
      titleId={ONBOARDING_TITLE_ID}
      step={flow.step}
      total={ONBOARDING_STEP_COUNT}
      canContinue={flow.canContinue}
      nextLabel={flow.isLastStep ? "Crear mi cuenta" : "Continuar"}
      backLabel={flow.step === 0 ? "Volver" : "Anterior"}
      closeLabel="Cerrar preparación"
      onBack={flow.back}
      onNext={flow.next}
      onClose={onClose}
      header={<TlacoLogo size="md" />}
    >
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
    </WizardShell>
  );
}
