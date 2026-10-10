import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { SolutionSelectorGrid } from "@/features/solutions/SolutionSelectorGrid";

export function LandingBusinessSolutions() {
  return (
    <section className="border-t border-border bg-border-soft/35 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-bold text-accent">
              HECHO PARA EL NEGOCIO QUE YA TIENES
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              No empiezas con una tienda vacía.
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Elige tu giro y Tlaco te da un punto de partida realista:
              catálogo, servicios y una operación que conecta los canales donde
              ya vendes.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {[
              "15 productos de inicio",
              "10 servicios configurables",
              "Tienda, QR, kiosco y WhatsApp",
            ].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                {item}
              </span>
            ))}
          </div>
        </div>

        <div id="soluciones" className="mt-8 scroll-mt-24">
          <SolutionSelectorGrid />
        </div>

        <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h3 className="font-bold text-foreground">
              ¿Tu giro no está en estas tarjetas?
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Puedes iniciar con cualquier catálogo, editarlo por completo o
              comenzar vacío.
            </p>
          </div>
          <Link
            href="/soluciones/otro?iniciar=1"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover"
          >
            Crear mi negocio <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
