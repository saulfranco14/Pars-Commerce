"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { getCart } from "@/services/publicCartService";
import { useFingerprint } from "@/hooks/useFingerprint";

interface CartBadgeProps {
  tenantId: string;
  sitioSlug: string;
  accentColor: string;
}

export default function CartBadge({ tenantId, sitioSlug, accentColor }: CartBadgeProps) {
  const fingerprint = useFingerprint();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!fingerprint) return;
    const fetchCount = () => {
      getCart(tenantId, fingerprint)
        .then((res) => setCount(res.items_count ?? 0))
        .catch(() => setCount(0));
    };
    fetchCount();
    const onFocus = () => fetchCount();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fingerprint, tenantId]);

  return (
    <Link
      href={`/sitio/${sitioSlug}/carrito`}
      className="relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-900"
    >
      <ShoppingCart className="h-5 w-5" />
      {count > 0 && (
        <span
          className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold text-white"
          style={{ backgroundColor: accentColor }}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
