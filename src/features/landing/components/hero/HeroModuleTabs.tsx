import { Check } from "lucide-react";

import { HERO_BEATS } from "@/features/landing/constants/heroDemo";

import type { HeroBeatKey } from "@/features/landing/interfaces/heroDemo";

/**
 * Los 7 módulos siempre visibles, sin scroll: en móvil dos filas (4 + 3
 * centradas), desde `lg` una sola fila. La palomita marca lo que el visitante
 * ya probó.
 */
export function HeroModuleTabs({
  index,
  explored,
  goTo,
}: {
  index: number;
  explored: HeroBeatKey[];
  goTo: (index: number) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-1 rounded-2xl border border-border bg-surface-raised p-1 lg:flex-nowrap lg:items-center">
      {HERO_BEATS.map((b, i) => {
        const active = i === index;
        const tried = explored.includes(b.key);
        return (
          <button
            key={b.key}
            type="button"
            onClick={() => goTo(i)}
            aria-current={active ? "step" : undefined}
            className={`flex min-h-10 min-w-0 basis-[calc(25%-0.1875rem)] cursor-pointer items-center justify-center gap-1 rounded-xl px-1.5 text-[11px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:text-xs lg:flex-auto lg:whitespace-nowrap lg:px-1.5 lg:text-[11px] xl:px-2 xl:text-xs ${
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-surface hover:text-foreground"
            }`}
          >
            {tried && (
              <Check
                className={`h-3 w-3 shrink-0 ${active ? "" : "text-emerald-500"}`}
                strokeWidth={3}
                aria-label="probado"
              />
            )}
            <span className="truncate">{b.label}</span>
          </button>
        );
      })}
    </div>
  );
}
