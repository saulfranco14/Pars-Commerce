import { FeedbackLink as Link } from "@/components/navigation/FeedbackLink";
import { ArrowRight } from "lucide-react";

import { TlacoLogo } from "@/components/brand/TlacoLogo";
import { LANDING_NAV_LINKS } from "../../constants/navigation";
import type { LandingFooterProps } from "../../interfaces/navigation";

export function LandingFooter({
  links = LANDING_NAV_LINKS,
  closing,
}: LandingFooterProps = {}) {
  return (
    <footer>
      <div className="bg-slate-950 py-20 text-white sm:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-balance text-3xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
            {closing?.title ?? (
              <>
                Tu cliente ya trae <span className="text-accent">el celular en la mano.</span>
              </>
            )}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
            {closing?.description ??
              "Crea tu cuenta, elige tu giro y comparte tu QR o tu tienda hoy mismo."}
          </p>
          <div className="mt-8 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-4">
            <Link
              href={closing?.href ?? "/registro"}
              className="group inline-flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-accent px-8 text-base font-semibold text-white transition-colors hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:w-auto"
            >
              {closing?.label ?? "Crear mi cuenta gratis"}
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
            <Link
              href={closing?.loginHref ?? "/login"}
              className="inline-flex min-h-14 cursor-pointer items-center justify-center px-4 text-base font-semibold text-slate-300 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Ya tengo cuenta
            </Link>
          </div>
          <p className="mt-6 text-sm text-slate-400">
            {closing?.footnote ?? "$0 al mes para empezar · Sin tarjeta · Lista en 2 minutos"}
          </p>
        </div>
      </div>

      <div className="bg-surface py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <TlacoLogo size="sm" />
              <p className="mt-2 max-w-xs text-sm text-muted-foreground leading-relaxed">
                Todo tu negocio en un solo lugar. Tu catálogo, tus pedidos, tus
                cobros y tu dinero, desde tu celular.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground">Producto</p>
              <ul className="mt-3 space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-11 items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground">Legal</p>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link
                    href="/terminos"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Términos de servicio
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacidad"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Aviso de Privacidad
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-border pt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
            <span className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Tlaco. Todos los derechos
              reservados.
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
