"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { Archive, ArrowLeft, Power } from "lucide-react";

import { swrFetcher } from "@/lib/swrFetcher";
import { useActiveTenant } from "@/stores/useTenantStore";
import { buildQrCodesKey } from "@/features/qr/helpers/buildQrKey";
import { QrPreview } from "@/features/qr/components/qr-create/QrPreview";
import { useQrActions } from "@/features/qr/hooks/useQrActions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

import type { QrCode } from "@/features/qr/interfaces/qrCode";

type PendingAction = "toggle" | "archive" | null;

export default function QrDetailPage() {
  const params = useParams();
  const router = useRouter();
  const qrId = params.qrId as string;
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useActiveTenant();

  const key = buildQrCodesKey(activeTenant?.id ?? null);
  const { data } = useSWR<QrCode[]>(key, swrFetcher, { fallbackData: [] });
  const qr = (data ?? []).find((item) => item.id === qrId);

  const { toggleActive, archive, busyId, error } = useQrActions(
    activeTenant?.id ?? null,
  );
  const busy = busyId === qrId;
  const [pending, setPending] = useState<PendingAction>(null);

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

  const backHref =
    qr.kind === "table"
      ? `/dashboard/${tenantSlug}/mesas`
      : `/dashboard/${tenantSlug}/qr`;

  function requestToggle() {
    if (!qr) return;
    // If activating, do it instantly. If deactivating, ask for confirmation.
    if (!qr.is_active) {
      toggleActive(qr);
      return;
    }
    setPending("toggle");
  }

  function requestArchive() {
    setPending("archive");
  }

  async function handleConfirm() {
    if (!qr) return;
    if (pending === "toggle") {
      await toggleActive(qr);
    } else if (pending === "archive") {
      const ok = await archive(qr);
      if (ok) router.push(backHref);
    }
    setPending(null);
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <Link
        href={backHref}
        className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold text-foreground sm:text-2xl">
            {qr.label}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{qr.kind === "table" ? "QR de mesa" : "QR de cobro"}</span>
            <span aria-hidden>·</span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                qr.is_active
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  qr.is_active ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              {qr.is_active ? "Activo" : "Inactivo"}
            </span>
          </div>
        </div>
        {qr.kind === "table" && qr.table_capacity ? (
          <span className="shrink-0 rounded-full bg-border-soft/50 px-3 py-1 text-xs font-medium text-foreground">
            {qr.table_capacity} personas
          </span>
        ) : null}
      </div>

      {!qr.is_active && (
        <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Este QR está inactivo. No funcionará al ser escaneado hasta que lo
          actives.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <QrPreview
        token={qr.token}
        label={qr.label}
        kind={qr.kind}
        tableCapacity={qr.table_capacity}
        presetAmount={qr.preset_amount}
        businessName={activeTenant.name}
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={requestToggle}
          disabled={busy}
          className={`inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-border-soft/40 disabled:cursor-not-allowed disabled:opacity-60 ${
            qr.is_active
              ? "border-amber-200 text-amber-800"
              : "border-emerald-200 text-emerald-700"
          }`}
        >
          <Power className="h-4 w-4" />
          {busy ? "..." : qr.is_active ? "Desactivar" : "Activar"}
        </button>
        <button
          type="button"
          onClick={requestArchive}
          disabled={busy}
          className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-lg border border-red-200 bg-surface px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Archive className="h-4 w-4" />
          Archivar
        </button>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Tipo</dt>
            <dd>{qr.kind === "table" ? "Mesa" : "Cobro"}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Token</dt>
            <dd className="truncate font-mono text-xs">{qr.token}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Estado</dt>
            <dd>{qr.is_active ? "Activo" : "Inactivo"}</dd>
          </div>
          {qr.kind === "table" && (
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Orden activa</dt>
              <dd>
                {qr.current_order_id
                  ? qr.current_order_id.slice(0, 8)
                  : "Sin orden"}
              </dd>
            </div>
          )}
          {qr.kind === "payment" && qr.preset_amount != null && (
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Monto sugerido</dt>
              <dd>
                ${Number(qr.preset_amount).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </dd>
            </div>
          )}
        </dl>
      </div>

      <ConfirmDialog
        isOpen={pending !== null}
        onClose={() => setPending(null)}
        onConfirm={handleConfirm}
        title={
          pending === "toggle"
            ? "Desactivar este código QR"
            : "Archivar este código QR"
        }
        description={
          pending === "toggle"
            ? "Al desactivarlo dejará de funcionar para los clientes que lo escaneen. Puedes reactivarlo después."
            : "Se quitará del listado activo. Esta acción no se puede deshacer fácilmente."
        }
        confirmLabel={pending === "toggle" ? "Desactivar" : "Archivar"}
        variant="danger"
        loading={busy}
      />
    </div>
  );
}
