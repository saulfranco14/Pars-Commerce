import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";

import { HeroLiveDemo } from "@/features/landing/components/hero/HeroLiveDemo";

/**
 * La promesa explica la plataforma completa; la demostración permite verla.
 * El hero no convierte Tlaco en un producto de QR: ese es solo uno de los
 * módulos que el visitante puede explorar desde el mismo bloque.
 */
export function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:py-20">
        <div className="lg:grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start lg:gap-x-12">
          <div className="mx-auto max-w-xl text-center lg:col-start-1 lg:row-start-1 lg:mx-0 lg:pt-4 lg:text-left">
            <div className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[13px] font-semibold text-accent">
              <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Plataforma para comercios
            </div>

            <h1 className="animate-fade-in-up animation-delay-100 mt-5 text-[2.25rem] font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem]">
              Tu negocio, tu tienda.{" "}
              <span className="text-accent">Todo en un solo lugar.</span>
            </h1>

            <p className="animate-fade-in-up animation-delay-200 mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">
              Gestiona productos, ventas y pedidos. Cobra, crea tu sitio web y
              conoce tu dinero desde un solo panel.
            </p>

            <div className="animate-fade-in-up animation-delay-300 mt-6">
              <Link
                href="/registro"
                className="group inline-flex min-h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-8 text-base font-semibold text-accent-foreground transition-colors duration-200 hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background sm:w-auto"
              >
                Crear mi cuenta gratis
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
              <p className="mt-2.5 text-[13px] text-muted-foreground">
                Sin tarjeta de crédito · Listo en 2 minutos
              </p>
            </div>
          </div>

          <div className="animate-fade-in-up animation-delay-400 mt-10 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0">
            <HeroLiveDemo />
          </div>

          <div className="mx-auto max-w-xl lg:col-start-1 lg:row-start-2 lg:mx-0">
            <ul className="mt-10 flex flex-col gap-2.5 lg:mt-8">
              {[
                "Vende por QR, en mesas, mostrador o desde tu sitio web",
                "Ve cada pedido, cobro y cliente en el momento en que ocurre",
                "Tu catálogo, equipo, créditos y dinero, conectados en Tlaco",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/12 text-accent">
                    <Check className="h-3 w-3" aria-hidden strokeWidth={3} />
                  </span>
                  <span className="text-sm leading-relaxed text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>

            <Link href="/soluciones/tienda" className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-bold text-foreground transition-colors hover:border-accent/40 hover:bg-accent/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
              Probar cómo funciona una tienda <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
