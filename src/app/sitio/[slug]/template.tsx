"use client";

import { usePathname } from "next/navigation";

import type { SitioTemplateProps } from "@/features/sitio/interfaces/storeNavigation";

// Keyed by path: Next only remounts a template when its direct child segment changes, which skipped product detail pages.
export default function SitioTemplate({ children }: SitioTemplateProps) {
  return (
    <div key={usePathname()} className="store-page-enter">
      {children}
    </div>
  );
}
