"use client";

import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";

interface CreateEditHeaderProps {
  title: string;
  backHref: string;
  backLabel?: string;
  onBack?: () => void;
  variant?: "arrow" | "close";
}

const linkClass =
  "inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-lg";

export function CreateEditHeader({
  title,
  backHref,
  backLabel = "Volver",
  onBack,
  variant = "arrow",
}: CreateEditHeaderProps) {
  const Icon = variant === "close" ? X : ArrowLeft;
  const label = variant === "close" ? "Cerrar" : backLabel;
  const content = (
    <>
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </>
  );

  return (
    <header className="shrink-0 border-b border-border pb-4">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className={linkClass}
          aria-label={label}
        >
          {content}
        </button>
      ) : (
        <Link href={backHref} className={linkClass} aria-label={label}>
          {content}
        </Link>
      )}
      <h1 className="mt-3 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        {title}
      </h1>
    </header>
  );
}
