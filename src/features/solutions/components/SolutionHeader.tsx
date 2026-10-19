import Link from "next/link";

import { TlacoLogo } from "@/components/brand/TlacoLogo";

export function SolutionHeader({ ctaLabel, onStart }: { ctaLabel: string; onStart: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <nav className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="Tlaco — inicio"
          className="inline-flex min-h-12 items-center rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <TlacoLogo size="md" />
        </Link>
        <div className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
          <a href="#recorrido" className="transition-colors hover:text-foreground">Recorrido de venta</a>
          <a href="#capacidades" className="transition-colors hover:text-foreground">Todo lo que incluye</a>
          <Link href="/#precios" className="transition-colors hover:text-foreground">Precios</Link>
        </div>
        <button
          type="button"
          onClick={onStart}
          className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {ctaLabel}
        </button>
      </nav>
    </header>
  );
}
