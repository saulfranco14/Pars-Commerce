"use client";

import { ShieldCheck } from "lucide-react";

interface DesktopCheckoutAsideProps {
  children: React.ReactNode;
}

export function DesktopCheckoutAside({ children }: DesktopCheckoutAsideProps) {
  return (
    <aside className="hidden xl:block">
      <div className="space-y-5 rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 xl:sticky xl:top-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Finalizar pedido
        </h2>
        <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/70 px-3 py-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-gray-500" />
          <p className="text-xs text-gray-600">
            Pago seguro y protegido con Mercado Pago.
          </p>
        </div>
        {children}
      </div>
    </aside>
  );
}
