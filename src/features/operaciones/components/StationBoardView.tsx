"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, History, Inbox, LayoutList, Plus, RefreshCw, Rows3 } from "lucide-react";

import { useStationBoard } from "@/features/operaciones/hooks/useStationBoard";
import { useBoardDensity } from "@/features/operaciones/hooks/useBoardDensity";
import { useNow } from "@/features/operaciones/hooks/useNow";
import { usePermission } from "@/stores/useTenantStore";
import { PageHeader } from "@/components/admin/PageHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { Notification } from "@/components/ui/Notification";
import { btnPrimary, btnSecondary } from "@/components/ui/buttonClasses";
import { DeliveryCompletionSheet } from "@/features/orders/components/order/DeliveryCompletionSheet";
import { BoardOrderCard } from "@/features/operaciones/components/BoardOrderCard";
import { StationCardActions } from "@/features/operaciones/components/StationCardActions";
import { StationTabs } from "@/features/operaciones/components/StationTabs";

import { formatCurrency } from "@/features/qr/helpers/format";

import type { BoardOrder } from "@/features/operaciones/interfaces/board";
import type { StationBoardViewProps } from "@/features/operaciones/interfaces/boardComponents";

const GRID_COLUMNS: Record<number, string> = {
  1: "",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-2 xl:grid-cols-4",
};

const iconButton =
  "inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:text-foreground";

export function StationBoardView({ station, tenantId, tenantSlug, view = "active" }: StationBoardViewProps) {
  const board = useStationBoard(tenantId, station.key, view);
  const density = useBoardDensity();
  const now = useNow();
  const can = usePermission();
  const [delivering, setDelivering] = useState<BoardOrder | null>(null);
  const [rejecting, setRejecting] = useState<BoardOrder | null>(null);
  const [mobileColumn, setMobileColumn] = useState<string | null>(null);

  const isHistory = view === "done";
  const abilities = board.board?.can;
  const columns = board.board?.columns ?? [];
  const activeColumn = mobileColumn ?? columns.find((c) => c.orders.length > 0)?.key ?? columns[0]?.key;
  const stationHref = `/dashboard/${tenantSlug}/operacion/${station.key}`;
  const detailHref = (order: BoardOrder) =>
    abilities?.openDetail ? `/dashboard/${tenantSlug}/ordenes/${order.id}` : undefined;
  const itemsMove = (station.key === "preparacion" || station.key === "mis-pedidos") && Boolean(abilities?.prepare) && !isHistory;

  return (
    <div className="space-y-4">
      {isHistory && (
        <Link href={stationHref} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver a {station.label}
        </Link>
      )}
      <PageHeader
        title={isHistory ? (station.historyLabel ?? station.label) : station.label}
        description={isHistory ? "Lo que se terminó hoy, con la hora y quién lo hizo." : station.purpose}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {!isHistory && station.historyLabel && (
              <Link href={`${stationHref}/terminados`} className={btnSecondary}>
                <History className="h-4 w-4" aria-hidden />
                {station.historyLabel}
              </Link>
            )}
            <button
              type="button"
              onClick={density.toggle}
              aria-label={density.compact ? "Ver pedidos completos" : "Ver pedidos en una línea"}
              title={density.compact ? "Ver pedidos completos" : "Ver pedidos en una línea"}
              className={iconButton}
            >
              {density.compact ? <LayoutList className="h-4 w-4" aria-hidden /> : <Rows3 className="h-4 w-4" aria-hidden />}
            </button>
            <button type="button" onClick={() => board.refresh()} aria-label="Actualizar" title="Se actualiza solo cada minuto" className={iconButton}>
              <RefreshCw className="h-4 w-4" aria-hidden />
            </button>
            {station.key === "mis-pedidos" && can("order.take") && (
              <Link href={`/dashboard/${tenantSlug}/ordenes/nueva`} className={btnPrimary}>
                <Plus className="h-4 w-4" aria-hidden />
                Nueva orden
              </Link>
            )}
          </div>
        }
      />

      {!isHistory && <StationTabs tenantSlug={tenantSlug} active={station.key} />}

      {board.board?.collectedToday !== null && board.board?.collectedToday !== undefined && (
        <div className="rounded-xl border border-border bg-surface-raised px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cobrado hoy</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">{formatCurrency(board.board.collectedToday)}</p>
        </div>
      )}

      {board.loadError && <Notification tone="error" message={board.loadError} />}
      {board.actionError && <Notification tone="error" message={board.actionError} />}

      {board.loading ? (
        <LoadingBlock variant="skeleton" message="Cargando pedidos" skeletonRows={4} />
      ) : (
        <>
          {columns.length > 1 && (
            <div className="lg:hidden">
              <FilterTabs
                tabs={columns.map((c) => ({ value: c.key, label: `${c.label} (${c.orders.length})` }))}
                activeValue={activeColumn ?? ""}
                onTabChange={setMobileColumn}
                ariaLabel="Columnas"
                density="touch"
              />
            </div>
          )}
          <div className={`grid gap-4 ${GRID_COLUMNS[columns.length] ?? ""}`}>
            {columns.map((column) => (
              <section
                key={column.key}
                aria-labelledby={`col-${column.key}`}
                className={`min-w-0 rounded-2xl bg-border-soft/50 p-3 ${column.key === activeColumn ? "" : "hidden"} lg:block`}
              >
                <h2 id={`col-${column.key}`} className="mb-3 hidden items-center justify-between px-1 text-sm font-bold text-foreground lg:flex">
                  {column.label}
                  <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs tabular-nums text-muted-foreground">
                    {column.orders.length}
                  </span>
                </h2>
                {column.orders.length === 0 ? (
                  <EmptyState icon={Inbox} title={column.empty} tone="muted" />
                ) : (
                  <div className={density.compact ? "space-y-2" : "space-y-3"}>
                    {column.orders.map((order) => {
                      const busyItem = board.busyKey?.startsWith(`${order.id}:`) ? board.busyKey.slice(order.id.length + 1) : null;
                      return (
                        <BoardOrderCard
                          key={order.id}
                          order={order}
                          now={now}
                          compact={density.compact}
                          showTimer={station.key !== "caja" && order.status !== "completed"}
                          canAdvanceItems={itemsMove}
                          busyItemId={busyItem}
                          onAdvanceItem={(itemId, status) => board.advanceItem(order.id, itemId, status)}
                          detailHref={station.key === "caja" ? undefined : detailHref(order)}
                        >
                          {!isHistory && (
                            <StationCardActions
                              station={station.key}
                              order={order}
                              board={board}
                              team={board.board?.team ?? []}
                              detailHref={detailHref(order)}
                              onDeliver={setDelivering}
                              onReject={setRejecting}
                            />
                          )}
                        </BoardOrderCard>
                      );
                    })}
                  </div>
                )}
              </section>
            ))}
          </div>
        </>
      )}

      <DeliveryCompletionSheet
        open={Boolean(delivering)}
        busy={Boolean(delivering) && board.isBusy(delivering?.id ?? "")}
        onClose={() => setDelivering(null)}
        onSubmit={async (photo, note) => {
          if (!delivering) return;
          const type = delivering.fulfillmentMethod === "pickup" ? "pickup_completed" : "delivered";
          await board.deliveryEvent(delivering.id, type, photo, note);
          setDelivering(null);
        }}
      />
      <ConfirmDialog
        isOpen={Boolean(rejecting)}
        onClose={() => setRejecting(null)}
        onConfirm={async () => {
          if (!rejecting) return;
          await board.respondRequest(rejecting.id, "reject-request");
          setRejecting(null);
        }}
        loading={Boolean(rejecting) && board.isBusy(rejecting?.id ?? "")}
        variant="danger"
        title={`¿Rechazar el pedido #${rejecting?.number ?? ""}?`}
        description="Le avisaremos al cliente que no se puede atender por ahora."
        confirmLabel="Rechazar"
      />
    </div>
  );
}
