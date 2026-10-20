import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";

import { storeDisplayFont, storeFocusRing } from "@/features/sitio/constants/storeClasses";

import type { StoreClosingCtaProps } from "@/features/sitio/interfaces/storeHome";

const BUTTON = `inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-accent-foreground px-6 text-[15px] font-bold text-accent shadow-lg shadow-black/10 transition-transform motion-safe:hover:-translate-y-0.5 ${storeFocusRing}`;

export function StoreClosingCta({ title, description, action }: StoreClosingCtaProps) {
  const Icon = action.external ? MessageCircle : ArrowRight;
  return (
    <section className="relative isolate overflow-hidden rounded-[28px] bg-accent px-6 py-10 text-accent-foreground sm:rounded-[36px] sm:px-12 sm:py-14">
      <span aria-hidden className="absolute -right-16 -top-20 -z-10 h-64 w-64 rounded-full bg-accent-foreground/10" />
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <h2 className={`text-3xl font-extrabold tracking-tight sm:text-4xl ${storeDisplayFont}`}>{title}</h2>
          <p className="mt-2 text-base text-accent-foreground/85">{description}</p>
        </div>
        {action.external ? (
          <a href={action.href} target="_blank" rel="noopener noreferrer" className={BUTTON}>
            <Icon className="h-4 w-4" aria-hidden />
            {action.label}
          </a>
        ) : (
          <Link href={action.href} className={BUTTON}>
            {action.label}
            <Icon className="h-4 w-4" aria-hidden />
          </Link>
        )}
      </div>
    </section>
  );
}
