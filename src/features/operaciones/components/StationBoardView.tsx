"use client";

import { useState } from "react";
import Link from "next/link";
import { Inbox, Plus, RefreshCw } from "lucide-react";

import { useStationBoard } from "@/features/operaciones/hooks/useStationBoard";
import { useNow } from "@/features/operaciones/hooks/useNow";
import { useCanOpenSection, usePermission } from "@/stores/useTenantStore";
import { PageHeader } from "@/components/admin/PageHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { Notification } from "@/components/ui/Notification";
import { btnPrimary } from "@/components/ui/buttonClasses";
import { DeliveryCompletionSheet } from "@/features/orders/components/order/DeliveryCompletionSheet";
import { BoardOrderCard } from "@/features/operaciones/components/BoardOrderCard";
import { StationCardActions } from "@/features/operaciones/components/StationCardActions";
import { StationTabs } from "@/features/operaciones/components/StationTabs";

import { formatCurrency } from "@/features/qr/helpers/format";

import type { BoardOrder } from "@/features/operaciones/interfaces/board";
import type { StationBoardViewProps } from "@/features/operaciones/interfaces/boardComponents";

const GRID_COLUMNS: Record<number, string> = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-2 xl:grid-cols-4",
};

export function StationBoardView({
  station,
  tenantId,
  tenantSlug,
}: StationBoardViewProps) {
  const board = useStationBoard(tenantId, station.key);
  const now = useNow();
  const can = usePermission();
  const canOpen = useCanOpenSection();
  const [delivering, setDelivering] = useState<BoardOrder | null>(null);
  const [rejecting, setRejecting] = useState<BoardOrder | null>(null);

  const canSeeDetail = canOpen("ordenes");
  const detailHref = (order: BoardOrder) => (canSeeDetail ? `/dashboard/${tenantSlug}/ordenes/${order.id}` : undefined);
  const columns = board.board?.columns ?? [];
  const showTimer = station.key !== "caja";

  return (
    <div className="space-y-4">
      <PageHeader
        title={station.label}
        description={station.purpose}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => board.refresh()}
              aria-label="Actualizar"
              title="Se actualiza solo cada minuto"
              className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:text-foreground"
            >
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

      <StationTabs tenantSlug={tenantSlug} active={station.key} />

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
        <div className={`grid gap-4 ${GRID_COLUMNS[columns.length] ?? ""}`}>
          {columns.map((column) => (
            <section key={column.key} aria-labelledby={`col-${column.key}`} className="min-w-0 rounded-2xl bg-border-soft/50 p-3">
              <h2 id={`col-${column.key}`} className="mb-3 flex items-center justify-between px-1 text-sm font-bold text-foreground">
                {column.label}
                <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs tabular-nums text-muted-foreground">
                  {column.orders.length}
                </span>
              </h2>
              {column.orders.length === 0 ? (
                <EmptyState icon={Inbox} title={column.empty} tone="muted" />
              ) : (
                <div className="space-y-3">
                  {column.orders.map((order) => (
                    <BoardOrderCard
                      key={order.id}
                      order={order}
                      now={now}
                      showTimer={showTimer && order.status !== "completed"}
                      detailHref={detailHref(order)}
                    >
                      <StationCardActions
                        station={station.key}
                        order={order}
                        board={board}
                        team={board.board?.team ?? []}
                        canPrepare={can("orders.prepare")}
                        detailHref={detailHref(order)}
                        onDeliver={setDelivering}
                        onReject={setRejecting}
                      />
                    </BoardOrderCard>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      <DeliveryCompletionSheet
        open={Boolean(delivering)}
        busy={Boolean(delivering) && board.busyOrderId === delivering?.id}
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
        loading={Boolean(rejecting) && board.busyOrderId === rejecting?.id}
        variant="danger"
        title={`¿Rechazar el pedido #${rejecting?.number ?? ""}?`}
        description="Le avisaremos al cliente que no se puede atender por ahora."
        confirmLabel="Rechazar"
      />
    </div>
  );
}
