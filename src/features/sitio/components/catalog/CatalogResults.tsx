"use client";

import { useNavigationFeedback } from "@/hooks/useNavigationFeedback";

import type { CatalogResultsProps } from "@/features/sitio/interfaces/storeNavigation";

/** Dims the current results while the next filter loads, then the new set fades in. */
export function CatalogResults({ children }: CatalogResultsProps) {
  const { pendingHref } = useNavigationFeedback();
  return (
    <div
      data-pending={pendingHref !== null}
      className="page-enter space-y-5 transition-opacity duration-200 data-[pending=true]:opacity-45 data-[pending=true]:delay-100 sm:space-y-6"
    >
      {children}
    </div>
  );
}
