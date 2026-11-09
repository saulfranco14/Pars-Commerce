"use client";

import Link from "next/link";
import { WandSparkles } from "lucide-react";
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
  studioEnabled = false,
}: {
  solution: SolutionDefinition;
  startOnboarding?: boolean;
  studioEnabled?: boolean;
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
            <SolutionHero
              solution={solution}
              ctaLabel={ctaLabel}
              onStart={s.openOnboarding}
            />
            <SolutionJourneyCard
              solution={solution}
              name={s.name}
              setName={s.setName}
              themeColor={s.themeColor}
            />
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

        {studioEnabled && (
          <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6">
            <div className="rounded-2xl border border-border bg-surface p-6">
              <WandSparkles className="h-6 w-6 text-accent" />
              <h2 className="mt-3 text-xl font-bold">
                Convierte tu catálogo en anuncios.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                Con Tlaco Studio puedes preparar promociones y diseños usando
                las fotos y precios de tu negocio. Membresía adicional por
                negocio; editar y exportar consume 0 Tlacos.
              </p>
              <Link
                href="/studio"
                className="mt-4 inline-flex min-h-11 items-center gap-2 font-semibold text-accent"
              >
                <WandSparkles className="h-4 w-4" />
                Conocer Tlaco Studio
              </Link>
            </div>
          </section>
        )}
        <SolutionClosing name={s.name} onStart={s.openOnboarding} />
      </main>
    </div>
  );
}
