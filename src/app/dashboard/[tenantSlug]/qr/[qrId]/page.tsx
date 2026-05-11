"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";

import { swrFetcher } from "@/lib/swrFetcher";
import { useActiveTenant } from "@/stores/useTenantStore";

interface QrDetail {
  id: string;
  token: string;
  kind: "payment" | "table";
  label: string;
  is_active: boolean;
  table_capacity: number | null;
  preset_amount: number | null;
  current_order_id: string | null;
}

export default function QrDetailPage() {
  const params = useParams();
  const qrId = params.qrId as string;
  const activeTenant = useActiveTenant();
  const key = activeTenant?.id
    ? `/api/qr/codes?tenant_id=${encodeURIComponent(activeTenant.id)}`
    : null;
  const { data } = useSWR<QrDetail[]>(key, swrFetcher, { fallbackData: [] });
  const qr = (data ?? []).find((item) => item.id === qrId);

  if (!activeTenant) {
    return (
      <div className="text-sm text-muted-foreground">
        Selecciona un negocio para continuar.
      </div>
    );
  }

  if (!qr) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4 text-sm text-muted-foreground">
        Código QR no encontrado.
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{qr.label}</h1>
      <div className="rounded-xl border border-border bg-surface p-4">
        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Tipo</dt>
            <dd>{qr.kind === "table" ? "Mesa" : "Cobro"}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Token</dt>
            <dd className="font-mono text-xs">{qr.token}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Estado</dt>
            <dd>{qr.is_active ? "Activo" : "Inactivo"}</dd>
          </div>
          {qr.kind === "table" && (
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Orden activa</dt>
              <dd>{qr.current_order_id ? qr.current_order_id.slice(0, 8) : "Sin orden"}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
