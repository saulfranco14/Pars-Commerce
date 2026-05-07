"use client";

import Image from "next/image";
import { Package } from "lucide-react";

import type { PublicCartItem } from "@/services/publicCartService";

interface MobileOrderReviewProps {
  items: PublicCartItem[];
  totalUnits: number;
}

export function MobileOrderReview({
  items,
  totalUnits,
}: MobileOrderReviewProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
      <div className="flex items-center justify-between gap-3 pb-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Tu pedido
        </p>
        <span className="text-xs font-medium text-gray-500 tabular-nums">
          {totalUnits} {totalUnits === 1 ? "pieza" : "piezas"}
        </span>
      </div>
      <ul className="space-y-2">
        {items.map((item) => {
          const product = Array.isArray(item.product)
            ? item.product[0]
            : item.product;
          const name = product?.name ?? "Producto";
          const imageUrl = product?.image_url ?? null;
          const price = Number(item.price_snapshot);
          const itemSubtotal = price * item.quantity;
          return (
            <li key={item.id} className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt=""
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="h-5 w-5 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {name}
                </p>
                <p className="text-[11px] text-gray-500 tabular-nums">
                  ${price.toFixed(2)} × {item.quantity}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums text-gray-900">
                ${itemSubtotal.toFixed(2)}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
