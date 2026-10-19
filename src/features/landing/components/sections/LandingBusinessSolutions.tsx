import { CheckCircle2 } from "lucide-react";

import { SolutionSelectorGrid } from "@/features/solutions/SolutionSelectorGrid";

const STARTER_INCLUDES = [
  "15 productos de inicio",
  "10 servicios configurables",
  "Tienda, QR, kiosco y WhatsApp",
];

/**
 * Responde al freno "me da flojera empezar": tu giro ya viene armado. "Otro
 * negocio" es la última tarjeta, así que no hace falta otro bloque que lo repita.
 */
export function LandingBusinessSolutions() {
  return (
    <section className="border-t border-border bg-border-soft/35 py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              No empiezas con una tienda vacía.
            </h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              Elige tu giro y tu catálogo de inicio ya viene armado. ¿No ves el
              tuyo? Toca «Otro negocio» y empieza con cualquier catálogo o desde
              cero.
            </p>
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {STARTER_INCLUDES.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div id="soluciones" className="mt-8 scroll-mt-24">
          <SolutionSelectorGrid />
        </div>
      </div>
    </section>
  );
}
