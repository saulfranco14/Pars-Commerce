import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";

import { HeroLiveDemo } from "@/features/landing/components/hero/HeroLiveDemo";

/**
 * Hero de la landing, diseñado MÓVIL PRIMERO (ahí llega la mayoría del tráfico).
 *
 * Cuatro reglas que ordenan todo lo de abajo:
 *
 *  1. El titular promete un RESULTADO, no un mecanismo. "Acepta tarjeta sin
 *     terminal" le habla al dueño y le quita su objeción principal; "tu cliente
 *     pide y paga solo" solo describía cómo funciona por dentro.
 *  2. Máximo dos líneas de titular en móvil. Un titular de cuatro líneas empuja
 *     el CTA y la demo fuera de la primera pantalla.
 *  3. UN solo CTA principal. El secundario ("ver cómo funciona") competía con él
 *     y además era redundante: la demo en vivo YA es ver cómo funciona.
 *  4. La demo sube. En móvil el orden es titular → subtítulo → CTA → DEMO, y
 *     los beneficios y la prueba social van DESPUÉS. Antes la demo quedaba a
 *     ~600px de scroll, o sea invisible justo para quien más importa.
 *
 * En `lg` el grid reparte: texto y beneficios en la columna 1, demo en la 2.
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
        <div className="lg:grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-x-12 lg:items-start">
          {/* ── Bloque 1: promesa + CTA ─────────────────────────── */}
          <div className="mx-auto max-w-xl text-center lg:col-start-1 lg:row-start-1 lg:mx-0 lg:pt-4 lg:text-left">
            <div className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[13px] font-semibold text-accent">
              <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Gratis para empezar · Sin mensualidad
            </div>

            <h1 className="animate-fade-in-up animation-delay-100 mt-5 text-[2.25rem] font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem]">
              Acepta tarjeta{" "}
              <span className="text-accent">sin terminal.</span>
            </h1>

            <p className="animate-fade-in-up animation-delay-200 mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">
              Tu cliente escanea un QR y paga desde su celular. Tú llevas tus
              pedidos, tu tienda en línea, tu crédito y tu dinero desde un solo
              panel.
            </p>

            {/* Un solo CTA. El "cómo funciona" lo resuelve la demo de al lado. */}
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

          {/* ── Bloque 2: la demo. En móvil va aquí, justo tras el CTA ── */}
          <div className="animate-fade-in-up animation-delay-400 mt-10 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0">
            <HeroLiveDemo />
          </div>

          {/* ── Bloque 3: beneficios + prueba social, después de la demo ── */}
          <div className="mx-auto max-w-xl lg:col-start-1 lg:row-start-2 lg:mx-0">
            <ul className="mt-10 flex flex-col gap-2.5 lg:mt-8">
              {[
                "Sin terminal ni lector: tu cliente usa su propio celular",
                "Sin mensualidad ni contrato — solo pagas cuando te pagan",
                "Todo incluido: pedidos, sitio web, cuotas, crédito y equipo",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/12 text-accent">
                    <Check className="h-3 w-3" aria-hidden strokeWidth={3} />
                  </span>
                  <span className="text-sm leading-relaxed text-muted-foreground">
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-7 flex items-center gap-3">
              <div className="flex -space-x-2">
                {["P", "M", "S", "L"].map((initial) => (
                  <div
                    key={initial}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-accent/15 text-xs font-semibold text-accent"
                  >
                    {initial}
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">
                  +50 negocios
                </span>{" "}
                ya confían en Pars Commerce
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
