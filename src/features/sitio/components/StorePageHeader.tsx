import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { storeDisplayFont, storeFocusRing } from "@/features/sitio/constants/storeClasses";

import type { StorePageHeaderProps } from "@/features/sitio/interfaces/storeComponents";

export function StorePageHeader({ title, description, back, children }: StorePageHeaderProps) {
  return (
    <header className="pt-2 sm:pt-6">
      {back ? (
        <Link
          href={back.href}
          className={`-ml-2 mb-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-sm font-medium text-(--store-ink-2) transition-colors hover:text-(--store-ink) ${storeFocusRing}`}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          {back.label}
        </Link>
      ) : null}
      <h1
        className={`text-3xl font-semibold tracking-tight text-(--store-ink) sm:text-[40px] sm:leading-tight ${storeDisplayFont}`}
      >
        {title}
      </h1>
      {description ? (
        <p className="mt-1.5 text-[15px] text-(--store-ink-2)">{description}</p>
      ) : null}
      {children}
    </header>
  );
}
