import Link from "next/link";
import { Check, ShieldCheck } from "lucide-react";

const FEATURES = [
  "Productos ilimitados",
  "Sitio web personalizado",
  "Ordenes y pedidos",
  "Checkout con MercadoPago",
  "Reportes de ventas",
  "Soporte por email",
  "Equipo de hasta 3 miembros",
  "Promociones y descuentos",
] as const;

export function LandingPricing() {
  return (
    <section id="precios" className="border-t border-border py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-accent" aria-hidden />
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Simple y transparente
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Sin sorpresas. Empieza gratis y crece con tu negocio.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-md">
          <div className="relative overflow-hidden rounded-2xl border-2 border-accent bg-surface p-8 shadow-card">
            {/* Decorative blob */}
            <div
              className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-accent/10 blur-3xl"
              aria-hidden
            />

            <div className="relative">
              <div className="text-sm font-medium text-accent">Para empezar</div>
              <h3 className="mt-1 text-2xl font-bold text-foreground">Gratis</h3>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-5xl font-bold tracking-tight text-foreground">$0</span>
                <span className="text-lg text-muted-foreground">/mes</span>
              </div>

              <ul className="mt-8 space-y-3">
                {FEATURES.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/registro"
                className="mt-8 flex min-h-[44px] w-full cursor-pointer items-center justify-center rounded-xl bg-accent px-6 py-3 text-base font-semibold text-accent-foreground transition-colors duration-200 hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
              >
                Empezar gratis
              </Link>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            <span>Sin tarjeta de credito requerida</span>
          </div>
        </div>
      </div>
    </section>
  );
}
