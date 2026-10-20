"use client";

import { useSolutionExperience } from "@/features/solutions/hooks/useSolutionExperience";
import { SolutionCapabilities } from "@/features/solutions/components/SolutionCapabilities";
import { SolutionClosing } from "@/features/solutions/components/SolutionClosing";
import { SolutionHeader } from "@/features/solutions/components/SolutionHeader";
import { SolutionHero } from "@/features/solutions/components/SolutionHero";
import { SolutionJourneyCard } from "@/features/solutions/components/journey/SolutionJourneyCard";
import { SolutionOnboarding } from "@/features/solutions/components/onboarding/SolutionOnboarding";

import { solutionPreviewUrl } from "@/features/solutions/helpers/solutionFormat";

import type { SolutionDefinition } from "@/features/solutions/solutionCatalog";

/** Página de un giro: titular propio, una venta completa tocable y todo lo que incluye. */
export function FocusedSolutionExperience({
  solution,
  startOnboarding = false,
}: {
  solution: SolutionDefinition;
  startOnboarding?: boolean;
}) {
  const s = useSolutionExperience(solution, startOnboarding);
  const ctaLabel = `Preparar mi ${solution.path === "tienda" ? "tienda" : "negocio"}`;

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      {s.onboardingOpen && (
        <SolutionOnboarding
          solution={solution}
          name={s.name}
          setName={s.setName}
          selectedTheme={s.selectedTheme}
          setSelectedTheme={s.setSelectedTheme}
          onClose={s.closeOnboarding}
        />
      )}

      <SolutionHeader ctaLabel={ctaLabel} onStart={s.openOnboarding} />

      <main>
        <section className="border-b border-border">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-9 sm:px-6 sm:py-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:px-8 lg:py-14">
            <SolutionHero solution={solution} ctaLabel={ctaLabel} onStart={s.openOnboarding} />
            <SolutionJourneyCard solution={solution} name={s.name} setName={s.setName} themeColor={s.themeColor} />
          </div>
        </section>

        <SolutionCapabilities
          capability={s.capability}
          done={s.capabilityDone}
          name={s.name}
          previewUrl={solutionPreviewUrl(solution.path)}
          onSelect={s.selectCapability}
          onAction={s.runCapabilityAction}
        />

        <SolutionClosing name={s.name} onStart={s.openOnboarding} />
      </main>
    </div>
  );
}
