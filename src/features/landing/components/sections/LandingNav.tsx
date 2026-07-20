"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
        aria-label="Navegacion principal"
      >
        <Link
          href="/"
          className="flex items-center gap-2 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
        >
          <Image
            src="/android-chrome-192x192.png"
            alt="Pars Commerce"
            width={28}
            height={28}
            className="h-7 w-7 rounded-lg"
          />
          <span className="text-lg font-semibold text-foreground">
            Pars Commerce
          </span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <a
            href="#funciones"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Funciones
          </a>
          <a
            href="#como-funciona"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Como funciona
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
            className="hidden min-h-[44px] cursor-pointer items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 sm:inline-flex"
          >
            Iniciar sesion
          </Link>
          <Link
            href="/registro"
            className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          >
            Registrarse
          </Link>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
