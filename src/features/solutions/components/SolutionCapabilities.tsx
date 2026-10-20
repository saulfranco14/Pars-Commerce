import { Check } from "lucide-react";

import { CapabilityPreview } from "@/features/solutions/components/CapabilityPreview";

import { SOLUTION_CAPABILITIES } from "@/features/solutions/constants/solutionCapabilities";

import type { CapabilityKey, SolutionCapability } from "@/features/solutions/interfaces/solutionExperience";

/** Todo lo que incluye, sin scroll lateral: 2 columnas en móvil, una fila en escritorio. */
export function SolutionCapabilities({
  capability,
  done,
  name,
  previewUrl,
  onSelect,
  onAction,
}: {
  capability: SolutionCapability;
  done: boolean;
  name: string;
  previewUrl: string;
  onSelect: (key: CapabilityKey) => void;
  onAction: () => void;
}) {
  const Icon = capability.icon;

  return (
    <section id="capacidades" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-14 sm:px-6 sm:py-18 lg:px-8">
      <div className="max-w-3xl">
        <h2 className="max-w-[24ch] text-balance text-3xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-[2.65rem]">
          Elige qué quieres resolver y mira qué hará Tlaco.
        </h2>
        <p className="mt-4 leading-7 text-muted-foreground">
          Empiezas con lo esencial. Todo trabaja sobre el mismo catálogo, clientes, pedidos y caja.
        </p>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7" role="tablist" aria-label="Capacidades">
        {SOLUTION_CAPABILITIES.map(({ key, title, short, icon: TileIcon }) => {
          const active = capability.key === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(key)}
              className={`min-h-24 cursor-pointer rounded-2xl border p-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                active ? "border-foreground bg-foreground text-background" : "border-border bg-surface text-foreground hover:border-accent/40"
              }`}
            >
              <TileIcon className={`h-5 w-5 ${active ? "text-background" : "text-accent"}`} aria-hidden />
              <span className="mt-3 block text-sm font-bold leading-tight">{title}</span>
              <span className={`mt-1 block text-[11px] leading-4 ${active ? "opacity-70" : "text-muted-foreground"}`}>{short}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-7 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
        <div key={capability.key} className="animate-fade-in-up">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <h3 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{capability.promise}</h3>
          <ul className="mt-5 space-y-3">
            {capability.benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3 text-sm text-muted-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
                {benefit}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <CapabilityPreview capability={capability} done={done} onAction={onAction} name={name} previewUrl={previewUrl} />
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            Interacción ilustrativa: no escribe ventas, pagos ni inventario real.
          </p>
        </div>
      </div>
    </section>
  );
}
