"use client";

import { useStoreNavigation } from "@/features/sitio/hooks/useStoreNavigation";

import type { CatalogResultsProps } from "@/features/sitio/interfaces/storeNavigation";

/** Dims the current results while the next filter loads, then the new set fades in. */
export function CatalogResults({ children }: CatalogResultsProps) {
  const { pendingHref } = useStoreNavigation();
  return (
    <div
      data-pending={pendingHref !== null}
      className="store-page-enter space-y-5 transition-opacity duration-200 data-[pending=true]:opacity-45 data-[pending=true]:delay-100 sm:space-y-6"
    >
      {children}
    </div>
  );
}
