import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";

import { PARA_PLACEMENT_BY_LAYOUT } from "@/features/growth/constants/para";

import type { ParaActionsProps } from "@/features/growth/interfaces/para";

const CLAIM_LABEL = "Activar mi tienda gratis";

/** Taps are recorded by `useParaSession` through the data-para-action attributes. */
export function ParaActions({ claimUrl, helpUrl, helpLabel, layout }: ParaActionsProps) {
  const placement = PARA_PLACEMENT_BY_LAYOUT[layout];
  const claim = `claim:${placement}`;
  const help = `help:${placement}`;

  if (layout === "bar") {
    return (
      <div className="flex shrink-0 items-center gap-2">
        {helpUrl ? (
          <a
            href={helpUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-para-action={help}
            aria-label={helpLabel}
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-border bg-surface px-3 text-sm font-semibold text-foreground transition hover:bg-border-soft/50"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Ayuda</span>
          </a>
        ) : null}
        <Link
          href={claimUrl}
          data-para-action={claim}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-accent px-4 text-sm font-bold text-accent-foreground shadow-md shadow-accent/20 transition active:scale-[0.99]"
        >
          Activar gratis
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    );
  }

  if (layout === "intro") {
    return (
      <div className="flex items-center gap-2">
        <Link
          href={claimUrl}
          data-para-action={claim}
          className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-[15px] font-bold text-accent-foreground shadow-md shadow-accent/20 transition active:scale-[0.99]"
        >
          {CLAIM_LABEL}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        {helpUrl ? (
          <a
            href={helpUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-para-action={help}
            aria-label={helpLabel}
            className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-2xl border border-(--store-hairline) bg-(--store-surface) text-(--store-ink) transition hover:bg-(--store-well)"
          >
            <MessageCircle className="h-5 w-5" aria-hidden />
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <Link
        href={claimUrl}
        data-para-action={claim}
        className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-accent px-6 text-base font-bold text-accent-foreground shadow-md shadow-accent/20 transition active:scale-[0.99]"
      >
        {CLAIM_LABEL}
        <ArrowRight className="h-5 w-5" aria-hidden />
      </Link>
      <p className="text-center text-sm text-muted-foreground">Sin tarjeta y sin costo para empezar. Toma un par de minutos.</p>
      {helpUrl ? (
        <a
          href={helpUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-para-action={help}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-5 text-sm font-semibold text-foreground transition hover:bg-border-soft/50"
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          {helpLabel}
        </a>
      ) : null}
    </div>
  );
}
