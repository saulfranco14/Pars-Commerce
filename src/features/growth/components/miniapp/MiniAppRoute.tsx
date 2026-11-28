"use client";

import { useState } from "react";
import { LocateFixed, MapPin } from "lucide-react";

import { adminActionButtonPrimary, adminActionButtonSecondary } from "@/components/admin/actionButtonClasses";
import { Notification } from "@/components/ui/Notification";

import type { MiniAppClient } from "@/features/growth/services/miniAppClient";
import type { MiniAppStop } from "@/features/growth/interfaces/miniApp";

/** «Ruta»: the ten nearest prospects to visit from where the operator stands. */
export function MiniAppRoute({ client, openExternal }: { client: MiniAppClient; openExternal: (url: string) => void }) {
  const [stops, setStops] = useState<MiniAppStop[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function locate() {
    setBusy(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          setStops(await client.route(position.coords.latitude, position.coords.longitude));
        } catch (err) {
          setError(err instanceof Error ? err.message : "No pude armar la ruta.");
        } finally {
          setBusy(false);
        }
      },
      () => {
        setError("Activa la ubicación para armar tu ruta.");
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 15_000 },
    );
  }

  return (
    <div className="grid gap-3">
      <button type="button" disabled={busy} onClick={locate} className={adminActionButtonPrimary}>
        <LocateFixed className="h-4 w-4" aria-hidden />
        {busy ? "Buscando…" : stops ? "Actualizar" : "Usar mi ubicación"}
      </button>
      {error ? <Notification tone="error" message={error} /> : null}
      {stops && !stops.length ? <Notification tone="info" message="No hay negocios pendientes de visitar a 2 km de aquí." /> : null}
      <ol className="grid gap-2">
        {(stops ?? []).map((stop, index) => (
          <li key={stop.leadId} className="grid gap-2 rounded-2xl border border-border bg-surface p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">{index + 1}. {stop.businessName} · {stop.distanceM} m</p>
              <p className="truncate text-xs text-muted-foreground">{stop.giroLabel} · {stop.address}</p>
            </div>
            <button type="button" onClick={() => openExternal(stop.mapsUrl)} className={adminActionButtonSecondary}>
              <MapPin className="h-4 w-4" aria-hidden />
              Cómo llegar
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
