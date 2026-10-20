import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { HeroLiveDemo } from "@/features/landing/components/hero/HeroLiveDemo";

import { HERO_PROMISES } from "@/features/landing/constants/heroPromises";

/**
 * La primera frase dice lo que ninguna tienda en línea ni terminal puede decir;
 * la demo de al lado lo demuestra. Pensado para tráfico de campañas: la
 * diferencia y el CTA se leen sin hacer scroll, también en móvil.
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

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <div className="lg:grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start lg:gap-x-10">
          <div className="mx-auto max-w-xl text-center lg:mx-0 lg:pt-6 lg:text-left">
            <h1 className="animate-fade-in-up text-balance text-[2.25rem] font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-[2.625rem] xl:text-[2.875rem]">
              Tu cliente pide y paga desde su celular.{" "}
              <span className="text-accent">Tú lo ves al instante.</span>
            </h1>

            <p className="animate-fade-in-up animation-delay-100 mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">
              Mesas con QR, tienda en línea, cuotas y crédito en una sola
              cuenta. Eliges tu giro y empiezas con tu catálogo ya armado.
            </p>

            <div className="animate-fade-in-up animation-delay-200 mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2.5 lg:justify-start">
              <Link
                href="/registro"
                className="group order-1 inline-flex min-h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-8 text-base font-semibold text-accent-foreground transition-colors duration-200 hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto"
              >
                Crear mi cuenta gratis
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
              <p className="order-2 basis-full text-[13px] text-muted-foreground">
                $0 al mes para empezar · Sin tarjeta · Lista en 2 minutos
              </p>
            </div>

            <ul className="animate-fade-in-up animation-delay-300 mt-8 hidden max-w-md flex-col gap-3 text-left lg:flex">
              {HERO_PROMISES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-accent">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="pt-1 text-sm leading-snug text-foreground">
                    {text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="animate-fade-in-up animation-delay-300 mt-8 lg:mt-0">
            <HeroLiveDemo />
          </div>
        </div>
      </div>
    </section>
  );
}
