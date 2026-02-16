import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function LandingCta() {
  return (
    <section className="border-t border-border bg-accent/5 py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          ¿Listo para vender en línea?
        </h2>
        <p className="mt-4 text-muted-foreground">
          Únete a negocios que ya usan Pars Commerce para gestionar sus ventas.
        </p>
        <Link
          href="/registro"
          className="group mt-8 inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-8 py-3 text-base font-semibold text-accent-foreground transition-colors duration-200 hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
        >
          Crear cuenta gratis
          <ArrowRight
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      </div>
    </section>
  );
}
