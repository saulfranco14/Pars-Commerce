"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Clock,
  Link2,
  Power,
  QrCode as QrIcon,
  ShoppingBag,
  Store,
  Unlink,
  Users,
} from "lucide-react";

import { swrFetcher } from "@/lib/swrFetcher";
import { useActiveTenant } from "@/stores/useTenantStore";
import { Notification } from "@/components/ui/Notification";
import {
  adminActionButtonDanger,
  adminActionButtonPrimary,
  adminActionButtonSecondary,
} from "@/components/admin/actionButtonClasses";
import { buildQrCodesKey } from "@/features/qr/helpers/buildQrKey";
import { formatCurrency } from "@/features/qr/helpers/format";
import { QrPreview } from "@/features/qr/components/QrPreview";
import { TableTimeline } from "@/features/qr/components/TableTimeline";
import { PendingPaymentsCard } from "@/features/qr/components/PendingPaymentsCard";
import { CloseTableDialog } from "@/features/qr/components/CloseTableDialog";
import { MergeTableDialog } from "@/features/qr/components/MergeTableDialog";
import { PerPersonFulfillmentCard } from "@/features/qr/components/PerPersonFulfillmentCard";
import { useTableAdminLive } from "@/features/qr/hooks/useTableAdminLive";

import type { QrCode } from "@/features/qr/interfaces/qrCode";
import type { AdminViewDevice } from "@/features/qr/services/tableAdminViewService";

function elapsedLabel(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Hace un momento";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h} h ${m} min`;
}

export default function MesaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { mutate: globalMutate } = useSWRConfig();
  const mesaQrId = params.mesaId as string;
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useActiveTenant();

  // Resolve the QR (and its current_order_id) from the list cache.
  const qrKey = buildQrCodesKey(activeTenant?.id ?? null);
  const { data: qrList } = useSWR<QrCode[]>(qrKey, swrFetcher, {
    fallbackData: [],
  });
  const qr = (qrList ?? []).find((q) => q.id === mesaQrId);
  const orderId = qr?.current_order_id ?? null;

  const live = useTableAdminLive(orderId);
  const [showQr, setShowQr] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);

  // Other tables currently in use — candidates to merge into this one.
  const mergeCandidates = useMemo(
    () =>
      (qrList ?? []).filter(
        (q) =>
          q.kind === "table" &&
          !!q.current_order_id &&
          q.current_order_id !== orderId,
      ),
    [qrList, orderId],
  );

  const deviceById = useMemo(() => {
    const map = new Map<string, AdminViewDevice>();
    for (const d of live.data?.devices ?? []) map.set(d.id, d);
    return map;
  }, [live.data?.devices]);

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
        Mesa no encontrada.
      </div>
    );
  }

  const backHref = `/dashboard/${tenantSlug}/mesas`;

  /* ---------- Free table ---------- */
  if (!orderId) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-5">
        <Link
          href={backHref}
          className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a mesas
        </Link>

        {/* Header — icon tile + state, mirrors the list card */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Store className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {qr.label}
              </h1>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Libre
                </span>
                {qr.table_capacity ? (
                  <span className="text-xs text-muted-foreground">
                    {qr.table_capacity} personas
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Share card — the QR with a single clean frame (no cuadro-sobre-cuadro) */}
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Comparte para que ordenen
          </p>
          <p className="mb-3 mt-0.5 text-xs text-muted-foreground">
            Cuando un cliente escanee este QR, aquí verás sus productos en vivo.
          </p>
          <QrPreview
            token={qr.token}
            label={qr.label}
            kind="table"
            tableCapacity={qr.table_capacity}
            businessName={activeTenant.name}
          />
        </div>
      </div>
    );
  }

  /* ---------- Active table ---------- */
  const data = live.data;
  const hasPendingPayments = (data?.pending_payments ?? []).length > 0;

  async function handleClose(payload: Parameters<typeof live.closeTable>[0]) {
    const ok = await live.closeTable(payload);
    if (ok) {
      setCloseOpen(false);
      // Mark this table free in BOTH qr-codes caches (detail key has no kind,
      // the tables list uses kind=table) so the list shows "Libre" instantly
      // instead of waiting for its next 8s poll.
      const freeTable = (list: QrCode[] | undefined) =>
        (list ?? []).map((q) =>
          q.id === mesaQrId ? { ...q, current_order_id: null } : q,
        );
      await Promise.all([
        globalMutate(qrKey, freeTable, { revalidate: true }),
        globalMutate(
          buildQrCodesKey(activeTenant?.id ?? null, "table"),
          freeTable,
          { revalidate: true },
        ),
      ]);
      router.push(`/dashboard/${tenantSlug}/mesas`);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <Link
        href={backHref}
        className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a mesas
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
              {qr.label}
            </h1>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              En uso
            </span>
            {(data?.linked_tables?.length ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                <Link2 className="h-3 w-3" />
                Unida con {data!.linked_tables.join(", ")}
              </span>
            )}
            {data?.order?.created_at && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {elapsedLabel(data.order.created_at)}
              </span>
            )}
            {qr.table_capacity ? (
              <span className="text-xs text-muted-foreground">
                Capacidad: {qr.table_capacity}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Staff takes/extends this table's order (appends to its account) */}
          {orderId && (
            <Link
              href={`/dashboard/${tenantSlug}/pedidos/nuevo?table_order_id=${orderId}`}
              className={adminActionButtonPrimary}
            >
              <ClipboardList className="h-4 w-4" />
              Tomar pedido
            </Link>
          )}
          {(data?.linked_tables?.length ?? 0) > 0 ? (
            <button
              type="button"
              onClick={() => live.unlink()}
              disabled={live.merging}
              className={adminActionButtonSecondary}
            >
              <Unlink className="h-4 w-4" />
              Separar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setMergeOpen(true)}
              className={adminActionButtonSecondary}
            >
              <Users className="h-4 w-4" />
              Unir mesa
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowQr((v) => !v)}
            className={adminActionButtonSecondary}
          >
            <QrIcon className="h-4 w-4" />
            {showQr ? "Ocultar QR" : "Ver QR"}
          </button>
        </div>
      </div>

      {showQr && (
        <QrPreview
          token={qr.token}
          label={qr.label}
          kind="table"
          tableCapacity={qr.table_capacity}
          businessName={activeTenant.name}
        />
      )}

      {live.isLoading && !data && (
        <p className="text-sm text-muted-foreground">Cargando información...</p>
      )}

      {live.error && <Notification tone="error" message={live.error} />}

      {data && (
        <>
          {/* Pending payments — most urgent */}
          {hasPendingPayments && (
            <PendingPaymentsCard
              payments={data.pending_payments}
              busyPaymentId={live.busyPaymentId}
              onConfirm={live.confirmPayment}
              onReject={live.rejectPayment}
            />
          )}

          {/* Totals card */}
          <section className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Total acumulado</p>
              <p className="mt-0.5 text-xl font-bold text-foreground">
                {data.order ? formatCurrency(data.order.total) : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pagado</p>
              <p className="mt-0.5 text-xl font-semibold text-emerald-600">
                {data.order ? formatCurrency(data.order.paid_total) : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Por pagar</p>
              <p className="mt-0.5 text-xl font-bold text-foreground">
                {data.order ? formatCurrency(data.order.balance_due) : "—"}
              </p>
            </div>
          </section>

          {/* Preparation state — staff advances each person received → ready */}
          {data.order && (
            <PerPersonFulfillmentCard
              devices={data.devices}
              busyDeviceId={live.busyDeviceId}
              busyAll={live.advancing}
              onAdvanceDevice={live.advanceDevice}
              onAdvanceAll={live.advanceAll}
            />
          )}

          {/* Devices */}
          <section className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">
                Clientes conectados ({data.devices.length})
              </h2>
            </div>
            {data.devices.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Aún nadie ha escaneado el QR.
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {data.devices.map((d, idx) => (
                  <div
                    key={d.id}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5"
                  >
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: d.color_hex }}
                    />
                    <span className="text-sm font-medium text-foreground">
                      {d.display_name || `Cliente ${idx + 1}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Split groups */}
          {data.split_groups.length > 0 && (
            <section className="rounded-xl border border-border bg-surface p-4">
              <h2 className="text-sm font-semibold text-foreground">
                Cuenta dividida
              </h2>
              <ul className="mt-3 space-y-2">
                {data.split_groups.map((g) => {
                  const isPaid = g.payment_status === "paid";
                  const isPending = g.payment_status === "pending_validation";
                  return (
                    <li
                      key={g.id}
                      className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${
                        isPaid
                          ? "border-emerald-200 bg-emerald-50/60"
                          : isPending
                            ? "border-amber-200 bg-amber-50/60"
                            : "border-border"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isPaid ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm font-medium text-foreground">
                          {g.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {formatCurrency(g.total)}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            isPaid
                              ? "bg-emerald-200 text-emerald-800"
                              : isPending
                                ? "bg-amber-200 text-amber-900"
                                : "bg-border-soft text-muted-foreground"
                          }`}
                        >
                          {isPaid
                            ? "Pagado"
                            : isPending
                              ? "Por validar"
                              : "Pendiente"}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* Timeline */}
          <section className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">
                Historial de actividad
              </h2>
            </div>
            <TableTimeline
              items={data.items}
              activityLog={data.activity_log}
              devices={deviceById}
            />
          </section>

          {/* Manual close action */}
          <section className="rounded-xl border border-red-200 bg-red-50/40 p-4">
            <h2 className="text-sm font-semibold text-foreground">
              ¿Necesitas cerrar la mesa manualmente?
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              La mesa se cierra automáticamente cuando se completa el pago.
              Solo cierra manualmente si algo salió fuera de lo normal.
            </p>
            <button
              type="button"
              onClick={() => setCloseOpen(true)}
              className={`mt-3 ${adminActionButtonDanger}`}
            >
              <Power className="h-4 w-4" />
              Cerrar mesa manualmente
            </button>
          </section>
        </>
      )}

      <CloseTableDialog
        isOpen={closeOpen}
        onClose={() => {
          if (live.closing) return;
          setCloseOpen(false);
          live.resetError();
        }}
        onConfirm={handleClose}
        loading={live.closing}
        error={live.error}
      />

      <MergeTableDialog
        isOpen={mergeOpen}
        onClose={() => {
          if (live.merging) return;
          setMergeOpen(false);
          live.resetError();
        }}
        candidates={mergeCandidates}
        onMerge={live.mergeTable}
        merging={live.merging}
        error={live.error}
      />
    </div>
  );
}
