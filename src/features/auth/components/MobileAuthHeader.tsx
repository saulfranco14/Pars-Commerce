import Link from "next/link";

import { TlacoLogo } from "@/components/brand/TlacoLogo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

interface MobileAuthHeaderProps {
  accountHref: "/login" | "/registro";
  accountLabel: string;
}

/** Header compacto para que el flujo de acceso nunca deje al usuario atrapado. */
export function MobileAuthHeader({
  accountHref,
  accountLabel,
}: MobileAuthHeaderProps) {
  return (
    <header className="absolute inset-x-0 top-0 z-10 flex min-h-16 items-center justify-between px-4 lg:hidden">
      <Link
        href="/"
        aria-label="Volver al inicio"
        className="inline-flex min-h-11 items-center rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
      >
        <TlacoLogo size="md" />
      </Link>
      <div className="flex items-center gap-1">
        <Link
          href={accountHref}
          className="inline-flex min-h-11 items-center rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
        >
          {accountLabel}
        </Link>
        <div className="max-[359px]:hidden">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
