"use client";

import Link from "next/link";

import { TlacoLogo } from "@/components/brand/TlacoLogo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

/**
 * Encabezado de las páginas legales (términos, privacidad). A propósito NO es
 * `LandingNav`: un documento legal no necesita enlaces a "Plataforma" o
 * "Precios" — son navegación de venta, no de lectura. Aquí solo va lo mínimo
 * para orientarse: el logo, iniciar sesión o registrarse, y el tema.
 */
export function LegalNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <nav
        className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6"
        aria-label="Navegación"
      >
        <Link
          href="/"
          aria-label="Tlaco — inicio"
          className="flex items-center rounded transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
        >
          <TlacoLogo size="md" />
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden min-h-11 cursor-pointer items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 sm:inline-flex"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/registro"
            className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          >
            Registrarse
          </Link>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
