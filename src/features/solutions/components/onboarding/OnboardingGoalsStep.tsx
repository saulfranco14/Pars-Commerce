import { WizardStepHeading } from "@/components/wizard/WizardStepHeading";

import { ONBOARDING_GOALS } from "@/features/solutions/constants/solutionOnboarding";
import { OPTION_CARD } from "@/components/wizard/wizardStyles";
import { ONBOARDING_TITLE_ID } from "@/features/solutions/constants/solutionOnboarding";

export function OnboardingGoalsStep({
  goals,
  toggleGoal,
}: {
  goals: string[];
  toggleGoal: (goal: string) => void;
}) {
  return (
    <div>
      <WizardStepHeading
        titleId={ONBOARDING_TITLE_ID}
        eyebrow="Elige hasta dos"
        title="¿Qué quieres resolver primero?"
        subtitle="Tu inicio mostrará primero las acciones que sí necesitas."
      />
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {ONBOARDING_GOALS.map(({ id, title, text, icon: Icon }) => {
          const selected = goals.includes(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggleGoal(id)}
              aria-pressed={selected}
              className={`${OPTION_CARD.base} flex min-h-28 items-start gap-4 p-5 ${selected ? OPTION_CARD.selected : OPTION_CARD.idle}`}
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  selected ? "bg-foreground text-background" : "bg-border-soft text-muted-foreground dark:bg-border"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span>
                <span className="block font-semibold text-foreground">{title}</span>
                <span className="mt-1 block text-sm leading-5 text-muted-foreground">{text}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
