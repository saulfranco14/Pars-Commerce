"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";

interface CartEmptyStateProps {
  productsHref: string;
  accentColor: string;
}

export function CartEmptyState({
  productsHref,
  accentColor,
}: CartEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <ShoppingCart className="h-8 w-8 text-gray-400" />
      </div>
      <p className="mt-4 text-base font-medium text-gray-700">
        Tu carrito está vacío
      </p>
      <p className="mt-1 text-sm text-gray-500">
        Agrega productos para continuar
      </p>
      <Link
        href={productsHref}
        className="mt-6 inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: accentColor }}
      >
        Ir a productos
      </Link>
    </div>
  );
}
