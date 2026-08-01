"use client";

import { Clock } from "lucide-react";

// Replaces the checkout, not the catalog: the business closed the till, not
// the shop.
export function OrdersClosedNotice({ businessName }: { businessName?: string }) {
  return (
    <div
      className="rounded-xl border border-amber-300 bg-amber-50 p-4"
      role="status"
    >
      <div className="flex gap-3">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-amber-900">
            No estamos recibiendo pedidos por ahora
          </p>
          <p className="mt-1 text-sm text-amber-800">
            {businessName ?? "El negocio"} pausó los pedidos en línea
            temporalmente. Tu carrito se queda guardado — vuelve más tarde para
            terminar tu compra.
          </p>
        </div>
      </div>
    </div>
  );
}
