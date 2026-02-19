"use client";

import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";

interface CreateEditHeaderProps {
  title: string;
  backHref: string;
  onBack?: () => void;
  variant?: "arrow" | "close";
}

const btnClass =
  "flex min-h-(--touch-target,44px) min-w-(--touch-target,44px) shrink-0 items-center justify-center rounded-full bg-border-soft text-muted-foreground transition-colors hover:bg-border hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2";

export function CreateEditHeader({
  title,
  backHref,
  onBack,
  variant = "arrow",
}: CreateEditHeaderProps) {
  const Icon = variant === "close" ? X : ArrowLeft;
  const content = (
    <>
      <Icon className="h-5 w-5 shrink-0" aria-hidden />
      <span className="sr-only">{variant === "close" ? "Cerrar" : "Volver"}</span>
    </>
  );

  return (
    <header className="flex shrink-0 items-center gap-3 pb-4">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className={btnClass}
          aria-label={variant === "close" ? "Cerrar" : "Volver"}
        >
          {content}
        </button>
      ) : (
        <Link href={backHref} className={btnClass} aria-label={variant === "close" ? "Cerrar" : "Volver"}>
          {content}
        </Link>
      )}
      <h1 className="min-w-0 flex-1 truncate text-lg font-semibold text-foreground sm:text-xl">
        {title}
      </h1>
    </header>
  );
}
