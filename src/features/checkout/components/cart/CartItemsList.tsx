"use client";

import { CartItemRow } from "@/features/checkout/components/cart/CartItemRow";
import { CartPackGroup } from "@/features/checkout/components/cart/CartPackGroup";

import { cartTotals, groupCartLines } from "@/features/checkout/helpers/cartLineGroups";

import type { PublicCartItem } from "@/services/publicCartService";

interface CartItemsListProps {
  items: PublicCartItem[];
  accentColor: string;
  onQuantityChange: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
}

export function CartItemsList({
  items,
  accentColor,
  onQuantityChange,
  onRemove,
}: CartItemsListProps) {
  const { savings } = cartTotals(items);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
      <p className="mb-3 text-sm font-semibold text-gray-900">Tus artículos</p>
      <div className="space-y-3 xl:max-h-130 xl:overflow-y-auto xl:overscroll-contain xl:pr-1">
        {groupCartLines(items).map((entry) =>
          entry.kind === "pack" ? (
            <CartPackGroup
              key={entry.groupId}
              pack={entry}
              accentColor={accentColor}
              onQuantityChange={onQuantityChange}
              onRemove={onRemove}
            />
          ) : (
            <CartItemRow
              key={entry.item.id}
              item={entry.item}
              accentColor={accentColor}
              onQuantityChange={onQuantityChange}
              onRemove={onRemove}
            />
          ),
        )}
      </div>
      {savings > 0 ? (
        <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
          Ahorras ${savings.toFixed(2)} con tus promociones
        </p>
      ) : null}
    </div>
  );
}
