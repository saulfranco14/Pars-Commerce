"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { TlacoLogo } from "@/components/brand/TlacoLogo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 border-b bg-background/80 backdrop-blur-md transition-shadow duration-200 ${
        scrolled
          ? "border-border shadow-soft"
          : "border-transparent"
      }`}
    >
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6"
        aria-label="Navegación principal"
      >
        <Link
          href="/"
          aria-label="Tlaco — inicio"
          className="flex items-center rounded transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
        >
          <TlacoLogo size="md" animated />
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <a
            href="#plataforma"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Plataforma
          </a>
          <a
            href="#mesas-qr"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Mesas y QR
          </a>
          <a
            href="#como-funciona"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Cómo funciona
          </a>
          <a
            href="#precios"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Precios
          </a>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 sm:hidden"
          >
            Iniciar sesión
          </Link>
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
          <div className="max-[359px]:hidden">
            <ThemeToggle />
          </div>
        </div>
      </nav>
    </header>
  );
}
