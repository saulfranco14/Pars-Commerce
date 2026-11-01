import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";

import type { ParaStickyCtaProps } from "@/features/growth/interfaces/para";

/** Phones: «Activar gratis» stays at the thumb the whole visit, so nobody has to scroll back to find it. */
export function ParaStickyCta({ claimUrl, helpUrl, helpLabel }: ParaStickyCtaProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border-soft bg-surface/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:hidden">
      <div className="flex items-center gap-2">
        <Link
          href={claimUrl}
          data-para-action="claim:bar"
          className="inline-flex min-h-13 flex-1 items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-base font-bold text-accent-foreground shadow-md shadow-accent/20 active:scale-[0.99]"
        >
          Activar gratis
          <ArrowRight className="h-5 w-5" aria-hidden />
        </Link>
        {helpUrl ? (
          <a
            href={helpUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-para-action="help:bar"
            aria-label={helpLabel}
            className="inline-flex min-h-13 min-w-13 items-center justify-center rounded-2xl border border-border bg-surface text-foreground"
          >
            <MessageCircle className="h-5 w-5" aria-hidden />
          </a>
        ) : null}
      </div>
    </div>
  );
}
