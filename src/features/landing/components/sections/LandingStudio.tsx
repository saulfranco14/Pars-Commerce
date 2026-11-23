import { FeedbackLink as Link } from "@/components/navigation/FeedbackLink";
import { ArrowRight, Check } from "lucide-react";

import { LandingSection } from "@/features/landing/components/shared/LandingSection";
import { StudioHomeShowcase } from "@/features/studio/components/landing/StudioHomeShowcase";

/** A paid add-on, so it sits after the reasons to sign up, in the same dark band as hero and closing. */
export function LandingStudio() {
  return (
    <LandingSection id="tlaco-studio" tone="dark">
      <div className="grid items-center gap-10 lg:grid-cols-[.9fr_1.1fr] lg:gap-14">
        <div className="text-center lg:text-left">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-300">
            Tlaco Studio · complemento
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
            Lo que vendes. <span className="text-accent">Como nunca se vio.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-slate-300 sm:text-lg lg:mx-0">
            Tu catálogo también puede ser tu próxima campaña. Diseña anuncios de tus productos,
            promociones y combos con tu foto, tu precio y tu marca.
          </p>
          <p className="mt-5 flex items-center justify-center gap-2 text-sm text-slate-300 lg:justify-start">
            <Check className="h-4 w-4 shrink-0 text-blue-300" aria-hidden />
            Diseña y descarga gratis. Imágenes con IA desde 1 Tlaco.
          </p>
          <Link
            href="/studio"
            className="mt-6 inline-flex min-h-12 items-center gap-2 text-base font-semibold text-white hover:text-blue-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Conoce Tlaco Studio
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <p className="mt-1 text-xs text-slate-400">Empiezas con 5 Tlacos de regalo.</p>
        </div>
        <StudioHomeShowcase />
      </div>
    </LandingSection>
  );
}
