import { Check } from "lucide-react";

import { NOVEDADES } from "@/features/novedades/constants/catalog";

/**
 * "Lo que viene" — muestra las próximas funcionalidades como visión de
 * producto (argumento de venta para prospectos). Reusa el catálogo NOVEDADES
 * para no duplicar el copy con el dashboard. Sin "me interesa" aquí — eso vive
 * en la sesión del negocio; el CTA de la landing es el general.
 */
export function LandingComingSoon() {
  return (
    <section
      id="lo-que-viene"
      className="border-t border-border py-16 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-1 w-10 rounded-full bg-accent"
            aria-hidden
          />
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Estamos construyendo más para ti
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            La plataforma no se queda quieta. Esto es lo que viene para que tu
            negocio venda más y crezca formal.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {NOVEDADES.map(
            ({ key, icon: Icon, title, description, highlight, Mockup }) => (
              <div
                key={key}
                className="flex flex-col rounded-xl border border-border bg-surface-raised p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-bold text-accent">
                    Próximamente
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold tracking-tight text-foreground">
                  {title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
                <div className="mt-4">
                  <Mockup />
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-accent">
                  <Check className="h-4 w-4" aria-hidden />
                  {highlight}
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
