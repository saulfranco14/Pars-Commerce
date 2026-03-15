"use client";

import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";

interface CreateEditHeaderProps {
  title: string;
  backHref: string;
  backLabel?: string;
  description?: React.ReactNode;
  onBack?: () => void;
  variant?: "arrow" | "close";
}

export function CreateEditHeader({
  title,
  backHref,
  backLabel = "Volver",
  description,
  onBack,
  variant = "arrow",
}: CreateEditHeaderProps) {
  const Icon = variant === "close" ? X : ArrowLeft;
  const label = variant === "close" ? "Cerrar" : backLabel;

  const backButton = onBack ? (
    <button
      type="button"
      onClick={onBack}
      className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors duration-200 hover:bg-border-soft/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer shrink-0"
      aria-label={label}
    >
      <Icon className="h-5 w-5" aria-hidden />
    </button>
  ) : (
    <Link
      href={backHref}
      className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors duration-200 hover:bg-border-soft/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent shrink-0"
      aria-label={label}
    >
      <Icon className="h-5 w-5" aria-hidden />
    </Link>
  );

  return (
    <header className="shrink-0">
      {/* ── Mobile: compact app-bar style ─────────────────────────────── */}
      <div className="flex items-center gap-2 md:hidden">
        {backButton}
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-bold tracking-tight text-foreground truncate">{title}</h1>
          {description && (
            <p className="text-[11px] leading-tight text-muted-foreground truncate">{description}</p>
          )}
        </div>
      </div>

      {/* ── Desktop: traditional header ──────────────────────────────── */}
      <div className="hidden md:block">
        <Link
          href={backHref}
          className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-lg"
          aria-label={label}
        >
          <Icon className="h-4 w-4 shrink-0" aria-hidden />
          {label}
        </Link>
        <h1 className="mt-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h1>
        {description && (
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
    </header>
  );
}
