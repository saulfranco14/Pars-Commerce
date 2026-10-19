import { Check, Pause, Play } from "lucide-react";

import { HERO_BEATS } from "@/features/landing/constants/heroDemo";

import type { HeroBeatKey } from "@/features/landing/interfaces/heroDemo";

/**
 * Los 7 módulos siempre visibles, sin scroll: en móvil una cuadrícula de 4
 * columnas (7 módulos + pausa = 2 filas completas), desde `lg` una sola fila.
 * La palomita marca lo que el visitante ya probó.
 */
export function HeroModuleTabs({
  index,
  playing,
  explored,
  goTo,
  toggle,
}: {
  index: number;
  playing: boolean;
  explored: HeroBeatKey[];
  goTo: (index: number) => void;
  toggle: () => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-1 rounded-2xl border border-border bg-surface-raised p-1 lg:flex lg:items-center">
      {HERO_BEATS.map((b, i) => {
        const active = i === index;
        const tried = explored.includes(b.key);
        return (
          <button
            key={b.key}
            type="button"
            onClick={() => goTo(i)}
            aria-current={active ? "step" : undefined}
            className={`flex min-h-10 min-w-0 cursor-pointer items-center justify-center gap-1 rounded-xl px-1.5 text-[11px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:text-xs lg:flex-auto lg:whitespace-nowrap lg:px-1.5 lg:text-[11px] xl:px-2 xl:text-xs ${
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
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pausar demostración" : "Reproducir demostración"}
        className="flex min-h-10 cursor-pointer items-center justify-center gap-1 rounded-xl text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-surface hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:w-10 lg:shrink-0"
      >
        {playing ? <Pause className="h-3.5 w-3.5" aria-hidden /> : <Play className="h-3.5 w-3.5" aria-hidden />}
        <span className="lg:hidden">{playing ? "Pausar" : "Reproducir"}</span>
      </button>
    </div>
  );
}
