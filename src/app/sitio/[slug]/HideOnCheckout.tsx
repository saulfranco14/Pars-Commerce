"use client";

import { usePathname } from "next/navigation";

export function HideOnCheckout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.split("/").pop() === "carrito") return null;
  return <>{children}</>;
}
