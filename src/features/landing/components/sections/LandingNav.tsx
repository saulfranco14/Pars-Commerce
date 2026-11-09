"use client";
import { useEffect, useState } from "react";
import { FeedbackLink as Link } from "@/components/navigation/FeedbackLink";
import { Menu } from "lucide-react";
import { TlacoLogo } from "@/components/brand/TlacoLogo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LANDING_NAV_LINKS } from "../../constants/navigation";
import type { LandingNavProps } from "../../interfaces/navigation";

export function LandingNav({
  links = LANDING_NAV_LINKS,
  registrationHref = "/registro",
  registrationLabel = "Registrarse",
  loginHref = "/login",
}: LandingNavProps) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 border-b bg-background/90 backdrop-blur-md transition-shadow ${scrolled ? "border-border shadow-soft" : "border-transparent"}`}
    >
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:px-6 lg:px-8"
        aria-label="Navegación principal"
      >
        <Link
          href="/"
          aria-label="Tlaco — inicio"
          className="shrink-0 rounded focus-visible:ring-2 focus-visible:ring-accent"
        >
          <TlacoLogo size="md" animated />
        </Link>
        <div className="hidden items-center gap-4 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-11 items-center text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <details className="relative lg:hidden">
            <summary
              aria-label="Abrir navegación"
              className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-xl hover:bg-border-soft"
            >
              <Menu className="h-5 w-5" />
            </summary>
            <div className="absolute right-0 top-12 min-w-52 rounded-2xl border border-border bg-surface p-2 shadow-sm">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium hover:bg-border-soft"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href={loginHref}
                className="flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-accent"
              >
                Iniciar sesión
              </Link>
            </div>
          </details>
          <Link
            href={loginHref}
            className="hidden min-h-11 items-center rounded-xl px-3 text-sm font-medium text-muted-foreground lg:inline-flex"
          >
            Iniciar sesión
          </Link>
          <Link
            href={registrationHref}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent"
          >
            {registrationLabel}
          </Link>
          <div className="max-[359px]:hidden">
            <ThemeToggle />
          </div>
        </div>
      </nav>
    </header>
  );
}
