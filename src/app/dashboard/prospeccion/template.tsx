"use client";

import { usePathname } from "next/navigation";

// Keyed by path so opening a lead and coming back both fade in, like the storefront.
// The bottom room keeps the last row clear of the phone's action bar and the floating Tlaco IA.
export default function ProspeccionTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div key={usePathname()} className="page-enter pb-40 md:pb-24 lg:pb-0">
      {children}
    </div>
  );
}
