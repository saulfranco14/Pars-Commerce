"use client";

import { Clock } from "lucide-react";

/**
 * Aviso de "ahora no estamos recibiendo pedidos".
 *
 * Aparece EN LUGAR del checkout, no encima del catálogo: el negocio cerró la
 * caja, no la tienda. El cliente sigue viendo lo que hay y lo que ya puso en
 * el carrito, que es lo que hace que vuelva mañana en vez de irse.
 */
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
