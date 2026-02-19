import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function LandingFooter() {
  return (
    <footer>
      {/* CTA Section */}
      <div className="relative border-t border-border overflow-hidden py-20 sm:py-28">
        {/* Background decoration */}
        <div className="absolute inset-0 to-transparent" aria-hidden />
        <div
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
          aria-hidden
        />
        {/* Glow blobs */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full blur-[80px]"
          aria-hidden
        />

        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
            <Sparkles className="h-6 w-6 text-accent" aria-hidden />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Listo para digitalizar tu negocio?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Unete a negocios que ya usan Pars Commerce para gestionar productos,
            recibir pedidos y vender en linea.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/registro"
              className="group inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-8 py-3.5 text-base font-semibold text-accent-foreground transition-colors duration-200 hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
            >
              Crear cuenta gratis
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-[48px] cursor-pointer items-center justify-center rounded-xl border border-border bg-surface px-6 py-3.5 text-base font-medium text-foreground transition-colors duration-200 hover:bg-border-soft/50 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
            >
              Ya tengo cuenta
            </Link>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Sin tarjeta de credito.
          </p>
        </div>
      </div>

      {/* Footer Links */}
      <div className="border-t border-border bg-surface/50 py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-4">
            {/* Brand */}
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2">
                <Image
                  src="/android-chrome-192x192.png"
                  alt="Pars Commerce"
                  width={24}
                  height={24}
                  className="h-6 w-6 rounded-lg"
                />
                <span className="font-semibold text-foreground">
                  Pars Commerce
                </span>
              </div>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground leading-relaxed">
                Plataforma de comercio para negocios. Gestiona productos,
                ordenes y ventas desde un solo lugar.
              </p>
            </div>

            {/* Product links */}
            <div>
              <p className="text-sm font-semibold text-foreground">Producto</p>
              <ul className="mt-3 space-y-2">
                <li>
                  <a
                    href="#funciones"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Funciones
                  </a>
                </li>
                <li>
                  <a
                    href="#precios"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Precios
                  </a>
                </li>
                <li>
                  <a
                    href="#como-funciona"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Como funciona
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal links */}
            <div>
              <p className="text-sm font-semibold text-foreground">Legal</p>
              <ul className="mt-3 space-y-2">
                <li>
                  <span className="text-sm text-muted-foreground">
                    Terminos de servicio
                  </span>
                </li>
                <li>
                  <span className="text-sm text-muted-foreground">
                    Privacidad
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-border pt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
            <span className="text-sm text-muted-foreground">
              &copy; 2026 Pars Commerce. Todos los derechos reservados.
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
