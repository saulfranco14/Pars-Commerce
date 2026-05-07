"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface CartSummaryHeaderProps {
  itemsCount: number;
  totalUnits: number;
  subtotal: number;
  productsHref: string;
  accentColor: string;
}

export function CartSummaryHeader({
  itemsCount,
  totalUnits,
  subtotal,
  productsHref,
  accentColor,
}: CartSummaryHeaderProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Resumen de tu pedido
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {itemsCount} {itemsCount === 1 ? "producto" : "productos"} en el
            carrito.
          </p>
        </div>
        <Link
          href={productsHref}
          className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Seguir comprando
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2.5">
          <p className="text-[11px] font-medium text-gray-500">Productos</p>
          <p className="mt-1 text-base font-semibold text-gray-900 tabular-nums">
            {itemsCount}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2.5">
          <p className="text-[11px] font-medium text-gray-500">Piezas</p>
          <p className="mt-1 text-base font-semibold text-gray-900 tabular-nums">
            {totalUnits}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2.5">
          <p className="text-[11px] font-medium text-gray-500">Subtotal</p>
          <p
            className="mt-1 text-base font-semibold tabular-nums"
            style={{ color: accentColor }}
          >
            ${subtotal.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
