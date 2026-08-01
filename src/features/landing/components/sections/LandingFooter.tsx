import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { TlacoLogo } from "@/components/brand/TlacoLogo";

export function LandingFooter() {
  return (
    <footer>
      <div className="relative border-t border-border overflow-hidden py-20 sm:py-28">
        <div
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
          aria-hidden
        />
        {/* Halo de acento detrás del cierre. Antes era un div con `blur-[80px]`
            pero sin color de fondo, así que no pintaba nada. */}
        <div
          className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[80px]"
          aria-hidden
        />

        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
            <Sparkles className="h-6 w-6 text-accent" aria-hidden />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            ¿Listo para digitalizar tu negocio?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Únete a los negocios que ya usan Tlaco para gestionar productos, recibir pedidos y
            vender en línea.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/registro"
              className="group inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-8 py-3.5 text-base font-semibold text-accent-foreground transition-colors duration-200 hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
            >
              Crear cuenta gratis
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-border bg-surface px-6 py-3.5 text-base font-medium text-foreground transition-colors duration-200 hover:bg-border-soft/50 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
            >
              Ya tengo cuenta
            </Link>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">Sin tarjeta de crédito.</p>
        </div>
      </div>

      <div className="border-t border-border bg-surface/50 py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <TlacoLogo size="sm" />
              <p className="mt-2 max-w-xs text-sm text-muted-foreground leading-relaxed">
                Todo tu negocio en un solo lugar. Tu catálogo, tus pedidos, tus cobros y tu
                dinero, desde tu celular.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground">Producto</p>
              <ul className="mt-3 space-y-2">
                <li>
                  <a href="#plataforma" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    Plataforma
                  </a>
                </li>
                <li>
                  <a href="#mesas-qr" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    Mesas y QR
                  </a>
                </li>
                <li>
                  <a href="#precios" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    Precios
                  </a>
                </li>
                <li>
                  <a href="#como-funciona" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    Cómo funciona
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground">Legal</p>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link href="/terminos" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    Términos de servicio
                  </Link>
                </li>
                <li>
                  <Link href="/privacidad" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    Aviso de Privacidad
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-border pt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
            <span className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Tlaco. Todos los derechos reservados.
            </span>
            <span className="text-xs text-muted-foreground/60">
              Hecho con amor para negocios que quieren crecer
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
