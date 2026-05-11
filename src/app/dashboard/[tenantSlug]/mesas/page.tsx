"use client";

import useSWR from "swr";

import { swrFetcher } from "@/lib/swrFetcher";
import { useActiveTenant } from "@/stores/useTenantStore";
import type { QrCode } from "@/features/qr/interfaces/qrCode";

export default function MesasPage() {
  const activeTenant = useActiveTenant();
  const key = activeTenant?.id
    ? `/api/qr/codes?tenant_id=${encodeURIComponent(activeTenant.id)}&kind=table`
    : null;
  const { data, isLoading } = useSWR<QrCode[]>(key, swrFetcher, {
    fallbackData: [],
  });
  const tables = data ?? [];

  if (!activeTenant) {
    return (
      <div className="text-sm text-muted-foreground">
        Selecciona un negocio para continuar.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Mesas</h1>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando mesas...</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {tables.map((table) => (
            <article
              key={table.id}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <h3 className="text-base font-medium text-foreground">{table.label}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {table.current_order_id ? "Ocupada" : "Libre"}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
