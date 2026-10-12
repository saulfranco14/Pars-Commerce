"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartContext } from "./CartProvider";

interface CartBadgeProps {
  sitioSlug: string;
  accentColor: string;
  variant?: "light" | "dark";
}

export default function CartBadge({
  sitioSlug,
  accentColor,
  variant = "light",
}: CartBadgeProps) {
  const { itemsCount, isLoading } = useCartContext();

  return (
    <Link
      href={`/sitio/${sitioSlug}/carrito`}
      className={`relative flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center overflow-visible rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 ${
        variant === "dark"
          ? "text-gray-300 hover:bg-gray-800 hover:text-white"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      }`}
      aria-label={`Carrito${itemsCount > 0 ? ` con ${itemsCount} productos` : ""}`}
    >
      {isLoading ? (
        <span
          className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-gray-300 border-t-transparent"
          style={{ borderTopColor: accentColor }}
          aria-hidden
        />
      ) : (
        <ShoppingCart className="h-5 w-5 shrink-0" aria-hidden />
      )}
      {!isLoading && itemsCount > 0 && (
        <span
          className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold text-white shadow-sm"
          style={{ backgroundColor: accentColor }}
        >
          {itemsCount > 99 ? "99+" : itemsCount}
        </span>
      )}
    </Link>
  );
}
