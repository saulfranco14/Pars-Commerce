import { ArrowRight } from "lucide-react";

import type { SolutionDefinition } from "@/features/solutions/solutionCatalog";

/**
 * El titular y los pasos son los del giro (`solutionCatalog`): quien llega de
 * un anuncio para panaderías lee panadería, no un texto genérico.
 */
export function SolutionHero({
  solution,
  ctaLabel,
  onStart,
}: {
  solution: SolutionDefinition;
  ctaLabel: string;
  onStart: () => void;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-accent">{solution.eyebrow}</p>
      <h1 className="mt-3 max-w-xl text-balance text-3xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-4xl lg:text-[2.35rem]">
        {solution.headline}
      </h1>
      <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
        {solution.problem} Tu cliente compra o agenda y tu equipo sigue la misma operación sin volver a capturarla.
      </p>

      <ol className="mt-6 space-y-2.5">
        {solution.workflow.map((step, index) => (
          <li key={step} className="flex items-center gap-3 text-sm text-foreground">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/12 text-xs font-bold text-accent">
              {index + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onStart}
          className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-6 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {ctaLabel} <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
        <a
          href="#recorrido"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border px-5 text-sm font-semibold text-foreground transition-colors hover:bg-border-soft lg:hidden"
        >
          Ver una venta completa
        </a>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Sin tarjeta. Lo que hagas aquí es una simulación: no crea ventas ni cobros reales.
      </p>
    </div>
  );
}
