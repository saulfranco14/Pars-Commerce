"use client";

import Image from "next/image";
import { Package, Tag } from "lucide-react";

import { CartQuantityControls } from "@/features/checkout/components/cart/CartQuantityControls";

import type { CartPackEntry } from "@/features/checkout/helpers/cartLineGroups";

interface CartPackGroupProps {
  pack: CartPackEntry;
  accentColor: string;
  onQuantityChange: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
}

export function CartPackGroup({ pack, accentColor, onQuantityChange, onRemove }: CartPackGroupProps) {
  const anchor = pack.lines[0];
  const savings = pack.listTotal - pack.total;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3 sm:p-4">
      <div className="flex items-start gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
          <Tag className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 line-clamp-2">{pack.name}</h3>
          <p className="text-xs text-gray-500">Se agrega y se cambia completo.</p>
        </div>
        <div className="text-right">
          <p className="text-base font-bold tabular-nums" style={{ color: accentColor }}>
            ${pack.total.toFixed(2)}
          </p>
          {savings > 0 ? <p className="text-xs font-medium text-gray-400 line-through tabular-nums">${pack.listTotal.toFixed(2)}</p> : null}
        </div>
      </div>

      <ul className="mt-3 space-y-2">
        {pack.lines.map((line) => {
          const product = Array.isArray(line.product) ? line.product[0] : line.product;
          const name = product?.name ?? "Producto";
          const imageUrl = line.variant?.image_url ?? product?.image_url ?? null;
          return (
            <li key={line.id} className="flex items-center gap-3 rounded-lg bg-white p-2">
              <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {imageUrl ? (
                  <Image src={imageUrl} alt="" width={48} height={48} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center">
                    <Package className="h-5 w-5 text-gray-300" aria-hidden />
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1 text-sm font-medium text-gray-900 line-clamp-2">{name}</span>
              <span className="shrink-0 text-sm tabular-nums text-gray-500">× {line.quantity}</span>
            </li>
          );
        })}
      </ul>

      <div className="mt-3">
        <CartQuantityControls
          value={pack.packs}
          unitLabel={pack.packs === 1 ? "paquete" : "paquetes"}
          onDecrement={() => onQuantityChange(anchor.id, anchor.quantity - 1)}
          onIncrement={() => onQuantityChange(anchor.id, anchor.quantity + 1)}
          onRemove={() => onRemove(anchor.id)}
          removeLabel={`Quitar ${pack.name}`}
        />
      </div>
    </div>
  );
}
