"use client";

import Image from "next/image";
import { Package } from "lucide-react";

import { CartQuantityControls } from "@/features/checkout/components/cart/CartQuantityControls";

import type { PublicCartItem } from "@/services/publicCartService";

interface CartItemRowProps {
  item: PublicCartItem;
  accentColor: string;
  onQuantityChange: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
}

export function CartItemRow({
  item,
  accentColor,
  onQuantityChange,
  onRemove,
}: CartItemRowProps) {
  const product = Array.isArray(item.product) ? item.product[0] : item.product;
  const name = product?.name ?? "Producto";
  const imageUrl = item.variant?.image_url ?? product?.image_url ?? null;
  const price = Number(item.price_snapshot);
  const listPrice = item.list_unit_price == null ? null : Number(item.list_unit_price);
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
        {item.variant?.selection_key ? <p className="mt-0.5 text-xs font-medium text-gray-500">{item.variant.selection_key.replaceAll(":", " ")}</p> : null}
        {item.promotion_id && (
          <span className="mt-1 inline-block max-w-full truncate rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
            {item.promotion?.name ?? "Promoción"}
          </span>
        )}
        <p className="mt-2 flex flex-wrap items-baseline gap-x-2 text-base font-bold tabular-nums" style={{ color: accentColor }}>
          ${price.toFixed(2)} × {qty} = ${itemSubtotal.toFixed(2)}
          {listPrice != null && listPrice > price ? (
            <span className="text-xs font-medium text-gray-400 line-through">${listPrice.toFixed(2)}</span>
          ) : null}
        </p>
        <div className="mt-3">
          <CartQuantityControls
            value={qty}
            onDecrement={() => onQuantityChange(item.id, Math.max(1, qty - 1))}
            onIncrement={() => onQuantityChange(item.id, qty + 1)}
            onRemove={() => onRemove(item.id)}
          />
        </div>
      </div>
    </div>
  );
}
