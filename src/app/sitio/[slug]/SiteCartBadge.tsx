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
    <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}
