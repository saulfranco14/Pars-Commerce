"use client";

import Image from "next/image";
import { Minus, Package, Plus, Trash2 } from "lucide-react";

import type { PublicCartItem } from "@/services/publicCartService";

interface CartItemRowProps {
  item: PublicCartItem;
  accentColor: string;
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

export function CartItemRow({
  item,
  accentColor,
  onQuantityChange,
  onRemove,
}: CartItemRowProps) {
  const product = Array.isArray(item.product) ? item.product[0] : item.product;
  const name = product?.name ?? "Producto";
  const imageUrl = product?.image_url ?? null;
  const price = Number(item.price_snapshot);
  const qty = item.quantity;
  const itemSubtotal = price * qty;

  return (
    <div className="flex gap-3 rounded-xl border border-gray-100 bg-white p-3 transition-shadow duration-200 hover:shadow-sm sm:gap-4 sm:p-4">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:h-24 sm:w-24">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            width={96}
            height={96}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-8 w-8 text-gray-300 sm:h-10 sm:w-10" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-gray-900 line-clamp-2">{name}</h3>
        {item.promotion_id && (
          <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
            Promoción
          </span>
        )}
        <p
          className="mt-2 text-base font-bold tabular-nums"
          style={{ color: accentColor }}
        >
          ${price.toFixed(2)} × {qty} = ${itemSubtotal.toFixed(2)}
        </p>
        <div className="mt-3 flex min-h-[44px] items-center gap-1">
          <button
            type="button"
            onClick={() =>
              onQuantityChange(item.product_id, Math.max(1, qty - 1))
            }
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300/30"
            aria-label="Reducir cantidad"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-8 px-2 text-center text-sm font-medium tabular-nums">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => onQuantityChange(item.product_id, qty + 1)}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300/30"
            aria-label="Aumentar cantidad"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onRemove(item.product_id)}
            className="ml-auto flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/20"
            aria-label="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
