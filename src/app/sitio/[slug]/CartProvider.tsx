"use client";

import { createContext, useContext, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import useSWR from "swr";
import { getCart } from "@/services/publicCartService";
import { getCartUpdatedEventName } from "@/lib/cartEvents";
import { useFingerprint } from "@/hooks/useFingerprint";
import type { PublicCartItem } from "@/services/publicCartService";

interface CartData {
  cart: { id: string; tenant_id: string } | null;
  items: PublicCartItem[];
  subtotal: number;
  items_count: number;
}

interface CartContextValue {
  cart: CartData["cart"];
  items: PublicCartItem[];
  subtotal: number;
  itemsCount: number;
  isLoading: boolean;
  error: Error | null;
  mutate: (data?: CartData, opts?: { revalidate?: boolean }) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function cartFetcher([, tenantId, fingerprint]: [string, string, string]) {
  return getCart(tenantId, fingerprint);
}

interface CartProviderProps {
  tenantId: string;
  children: React.ReactNode;
}

export function CartProvider({ tenantId, children }: CartProviderProps) {
  const fingerprint = useFingerprint();
  const key =
    tenantId && fingerprint ? (["cart", tenantId, fingerprint] as const) : null;
  const { data, error, isLoading, mutate } = useSWR(key, cartFetcher, {
    dedupingInterval: 10000,
    revalidateOnFocus: false,
  });

  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const onCartUpdated = useCallback((event: Event) => {
    const detail = (event as CustomEvent<{ label?: string }>).detail;
    setLastAdded(detail?.label ?? "Artículo agregado");
    void mutate();
  }, [mutate]);
  useEffect(() => {
    window.addEventListener(getCartUpdatedEventName(), onCartUpdated);
    return () => window.removeEventListener(getCartUpdatedEventName(), onCartUpdated);
  }, [onCartUpdated]);

  const value: CartContextValue = {
    cart: data?.cart ?? null,
    items: data?.items ?? [],
    subtotal: data?.subtotal ?? 0,
    itemsCount: data?.items_count ?? 0,
    isLoading,
    error: error ?? null,
    mutate,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDock lastAdded={lastAdded} />
    </CartContext.Provider>
  );
}

function CartDock({ lastAdded }: { lastAdded: string | null }) {
  const { itemsCount, subtotal } = useCartContext();
  const pathname = usePathname();
  const match = pathname.match(/^\/sitio\/([^/]+)/);
  const slug = match?.[1];
  if (!slug || pathname.endsWith("/carrito") || itemsCount === 0) return null;
  return <div className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 mx-auto w-auto max-w-md md:inset-x-auto md:bottom-6 md:right-6"><div className="rounded-2xl border border-border/70 bg-surface/95 p-2 shadow-xl backdrop-blur"><p className="px-2 pb-1 text-xs text-muted-foreground" aria-live="polite">{lastAdded ?? "Tu carrito está listo"}</p><Link href={`/sitio/${slug}/carrito`} className="flex min-h-12 items-center justify-between gap-4 rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground transition-transform active:scale-[0.98] md:min-w-72"><span className="flex items-center gap-2"><ShoppingCart className="h-4 w-4" />Ver carrito · {itemsCount}</span><span className="tabular-nums">${Number(subtotal).toFixed(2)}</span></Link></div></div>;
}

export function useCartContext(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCartContext must be used within CartProvider");
  }
  return ctx;
}
