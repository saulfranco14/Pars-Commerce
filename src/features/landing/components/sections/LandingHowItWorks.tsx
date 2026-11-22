import { LandingSection } from "@/features/landing/components/shared/LandingSection";
import { SectionHeader } from "@/features/landing/components/shared/SectionHeader";

import { STEPS } from "@/features/landing/constants/steps";

export function LandingHowItWorks() {
  return (
    <LandingSection id="como-funciona">
      <SectionHeader
        eyebrow="Cómo empezar"
        title="Vendes hoy mismo"
        accent="en tres pasos."
        lead="Sin instalar nada ni contratar a nadie."
      />
      <ol className="mt-12 grid gap-4 sm:grid-cols-3 sm:gap-5">
        {STEPS.map(({ icon: Icon, step, title, description, detail }) => (
          <li
            key={step}
            className="flex gap-4 rounded-2xl border border-border bg-surface p-6 sm:flex-col"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
              {step}
            </span>
            <div className="min-w-0">
              <h3 className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
                {title}
                <Icon className="h-4.5 w-4.5 text-accent" aria-hidden />
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{description}</p>
              <p className="mt-3 text-sm font-semibold text-accent">{detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </LandingSection>
  );
}
