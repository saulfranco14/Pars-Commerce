import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function LandingFooter() {
  return (
    <footer>
      {/* CTA Section */}
      <div className="border-t border-border bg-accent/5 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Listo para digitalizar tu negocio?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Unete a negocios que ya usan Pars Commerce para gestionar sus ventas.
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
      </div>

      {/* Footer Links */}
      <div className="border-t border-border bg-surface/50 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <p className="font-semibold text-foreground">Pars Commerce</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Plataforma de comercio para negocios
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Producto</p>
              <ul className="mt-2 space-y-1.5">
                <li>
                  <a href="#funciones" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    Funciones
                  </a>
                </li>
                <li>
                  <a href="#precios" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    Precios
                  </a>
                </li>
                <li>
                  <a href="#como-funciona" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    Como funciona
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Legal</p>
              <ul className="mt-2 space-y-1.5">
                <li>
                  <span className="text-sm text-muted-foreground">Terminos de servicio</span>
                </li>
                <li>
                  <span className="text-sm text-muted-foreground">Privacidad</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
            &copy; 2026 Pars Commerce. Todos los derechos reservados.
          </div>
        </div>
      </div>
    </footer>
  );
}
