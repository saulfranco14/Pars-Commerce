"use client";

import { useState } from "react";
import useSWR from "swr";
import { Monitor } from "lucide-react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/admin/EmptyState";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { Notification } from "@/components/ui/Notification";
import { DeviceRow } from "@/features/dispositivos/components/DeviceRow";
import { PendingDeviceCard } from "@/features/dispositivos/components/PendingDeviceCard";
import { KioskUrlCard } from "@/features/dispositivos/components/KioskUrlCard";
import {
  approve,
  list,
  reject,
  remove,
  rename,
} from "@/features/dispositivos/services/deviceClientService";

import type { TenantDevice } from "@/features/dispositivos/interfaces/device";
import type { ConfigDispositivosSectionProps } from "@/features/dispositivos/interfaces/devicesSection";

type Pending =
  | { kind: "revoke"; device: TenantDevice }
  | { kind: "delete"; device: TenantDevice }
  | null;

export function ConfigDispositivosSection({
  tenantId,
  canManage,
}: ConfigDispositivosSectionProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<Pending>(null);

  // Se refresca solo: la pantalla puede anunciarse mientras el dueño mira.
  const { data, isLoading, mutate } = useSWR<TenantDevice[]>(
    canManage ? ["devices", tenantId] : null,
    () => list(tenantId),
    { fallbackData: [], refreshInterval: 5000 },
  );
  const devices = data ?? [];

  if (!canManage) {
    return (
      <Notification
        tone="info"
        message="Solo el propietario del negocio puede aprobar pantallas de autoservicio."
      />
    );
  }

  const waiting = devices.filter((d) => d.status === "pending");
  const rest = devices.filter((d) => d.status !== "pending");

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await mutate();
      setConfirming(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo completar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Pantallas donde el cliente arma su pedido solo. No se dan de alta desde
          aquí: se abren en el dispositivo y aparecen abajo esperando tu
          aprobación.
        </p>
        <KioskUrlCard tenantId={tenantId} />
      </div>

      <Notification
        tone="info"
        title="Qué puede hacer una pantalla aprobada"
        message="Leer tu catálogo y crear pedidos. No cobra, no ve tus ventas ni tu dinero. Si pierdes una, revócala y queda muerta al instante."
      />

      {error && <Notification tone="error" message={error} />}

      {waiting.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">
            Esperando tu aprobación ({waiting.length})
          </h3>
          <p className="text-xs text-muted-foreground">
            Compara el código con el que muestra la pantalla antes de aprobar.
            Si no coincide, no es tu dispositivo.
          </p>
          <ul className="space-y-3">
            {waiting.map((device) => (
              <PendingDeviceCard
                key={device.id}
                device={device}
                busy={busy}
                onApprove={(d) => run(() => approve(d.id))}
                onReject={(d) => run(() => reject(d.id))}
              />
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">
          Pantallas registradas
        </h3>
        {isLoading ? (
          <LoadingBlock message="Cargando pantallas…" />
        ) : rest.length === 0 ? (
          <EmptyState
            icon={Monitor}
            title="Ninguna pantalla registrada"
            description="Abre la dirección de arriba en la pantalla y aparecerá aquí para que la apruebes."
          />
        ) : (
          <ul className="space-y-2">
            {rest.map((device) => (
              <DeviceRow
                key={device.id}
                device={device}
                busy={busy}
                onRevoke={(d) => setConfirming({ kind: "revoke", device: d })}
                onDelete={(d) => setConfirming({ kind: "delete", device: d })}
                onRename={(d, name) => run(() => rename(d.id, name))}
              />
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirming !== null}
        onClose={() => setConfirming(null)}
        onConfirm={() =>
          run(() =>
            confirming?.kind === "revoke"
              ? reject(confirming.device.id)
              : remove(confirming!.device.id),
          )
        }
        title={
          confirming?.kind === "revoke"
            ? `¿Revocar ${confirming.device.name ?? "esta pantalla"}?`
            : `¿Eliminar ${confirming?.device.name ?? "esta pantalla"}?`
        }
        description={
          confirming?.kind === "revoke"
            ? "Deja de funcionar de inmediato. Si la vuelves a abrir, tendrá que pedirte permiso otra vez."
            : "Se borra el registro. Si estaba activa, también deja de funcionar."
        }
        confirmLabel={
          confirming?.kind === "revoke" ? "Sí, revocar" : "Sí, eliminar"
        }
        variant="danger"
        loading={busy}
      />
    </div>
  );
}
