"use client";

import { useEffect, useState } from "react";
import { getCart } from "@/services/publicCartService";

function getFingerprint(): string {
  if (typeof window === "undefined") return "server";
  let fp = localStorage.getItem("pars_fingerprint");
  if (!fp) {
    fp = `fp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem("pars_fingerprint", fp);
  }
  return fp;
}

interface SiteCartBadgeProps {
  tenantId: string;
}

export default function SiteCartBadge({ tenantId }: SiteCartBadgeProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fp = getFingerprint();
    getCart(tenantId, fp)
      .then((r) => setCount(r.items_count))
      .catch(() => setCount(0));
  }, [tenantId]);

  if (count <= 0) return null;

  return (
    <span
      className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground"
      aria-label={`${count} items en el carrito`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
