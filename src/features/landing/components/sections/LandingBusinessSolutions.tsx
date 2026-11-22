import { CheckCircle2 } from "lucide-react";

import { LandingSection } from "@/features/landing/components/shared/LandingSection";
import { SectionHeader } from "@/features/landing/components/shared/SectionHeader";
import { SolutionSelectorGrid } from "@/features/solutions/components/SolutionSelectorGrid";

const STARTER_INCLUDES = [
  "15 productos de inicio",
  "10 servicios configurables",
  "Tienda, QR, kiosco y WhatsApp",
];

/**
 * Answers "will this work for my business?" right after the demo. «Otro
 * negocio» is the last card, so no extra block repeats it.
 */
export function LandingBusinessSolutions() {
  return (
    <LandingSection id="soluciones" tone="alt" width="max-w-7xl">
      <SectionHeader
        eyebrow="Tu giro ya viene armado"
        title="No empiezas con"
        accent="una tienda vacía."
        lead="Elige tu giro y tu catálogo de inicio ya viene armado. ¿No ves el tuyo? Toca «Otro negocio» y empieza con cualquier catálogo o desde cero."
      />
      <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
        {STARTER_INCLUDES.map((item) => (
          <li key={item} className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-accent" aria-hidden />
            {item}
          </li>
        ))}
      </ul>
      <div className="mt-10">
        <SolutionSelectorGrid />
      </div>
    </LandingSection>
  );
}
