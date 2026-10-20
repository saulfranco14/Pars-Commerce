import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { storeDisplayFont, storeFocusRing } from "@/features/sitio/constants/storeClasses";

import type { StoreSectionHeaderProps } from "@/features/sitio/interfaces/storeComponents";

export function StoreSectionHeader({ id, title, subtitle, action }: StoreSectionHeaderProps) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 sm:mb-7">
      <div className="min-w-0">
        <h2
          id={id}
          className={`text-[28px] font-extrabold leading-tight tracking-tight text-(--store-ink) sm:text-4xl ${storeDisplayFont}`}
        >
          {title}
        </h2>
        {subtitle ? <p className="mt-1.5 text-[15px] text-(--store-ink-2)">{subtitle}</p> : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className={`hidden min-h-11 shrink-0 items-center gap-2 rounded-full bg-(--store-surface) px-5 text-sm font-bold text-(--store-ink) shadow-sm ring-1 ring-(--store-hairline) transition-shadow hover:shadow-md sm:inline-flex ${storeFocusRing}`}
        >
          {action.label}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}
