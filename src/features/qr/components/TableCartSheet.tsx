"use client";

import type { TableOrderItem } from "@/features/qr/interfaces/tableOrder";

interface TableCartSheetProps {
  items: TableOrderItem[];
  onClose: () => void;
}

export function TableCartSheet({ items, onClose }: TableCartSheetProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Carrito de mesa</h3>
        <button
          type="button"
          className="min-h-[44px] rounded-lg border border-border px-3 text-sm"
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>
      <ul className="mt-3 space-y-2 text-sm">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-2">
            <span>{item.quantity}x</span>
            <span className="font-medium">${Number(item.subtotal).toFixed(2)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
