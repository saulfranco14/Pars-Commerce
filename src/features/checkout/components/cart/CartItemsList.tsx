"use client";

import type { PublicCartItem } from "@/services/publicCartService";

import { CartItemRow } from "@/features/checkout/components/cart/CartItemRow";

interface CartItemsListProps {
  items: PublicCartItem[];
  accentColor: string;
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

export function CartItemsList({
  items,
  accentColor,
  onQuantityChange,
  onRemove,
}: CartItemsListProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
      <p className="mb-3 text-sm font-semibold text-gray-900">Tus artículos</p>
      <div className="max-h-[420px] space-y-3 overflow-y-auto overscroll-contain pr-1 sm:max-h-[520px]">
        {items.map((item) => (
          <CartItemRow
            key={item.id}
            item={item}
            accentColor={accentColor}
            onQuantityChange={onQuantityChange}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
}
