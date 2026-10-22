"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  History,
  Inbox,
  LayoutList,
  Plus,
  Rows3,
} from "lucide-react";

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
import {
  btnWorkPrimary,
  btnWorkSecondary,
} from "@/components/ui/buttonClasses";
import { DeliveryCompletionSheet } from "@/features/orders/components/order/DeliveryCompletionSheet";
import { BoardAccordion } from "@/features/operaciones/components/BoardAccordion";
import { CollectedSummaryCard } from "@/features/operaciones/components/CollectedSummaryCard";
import { BoardRefreshButton } from "@/features/operaciones/components/BoardRefreshButton";
import { BoardOrderCard } from "@/features/operaciones/components/BoardOrderCard";
import { StationCardActions } from "@/features/operaciones/components/StationCardActions";
import { ChargeSheet } from "@/features/orders/components/payment/ChargeSheet";
import { StationTabs } from "@/features/operaciones/components/StationTabs";

import { formatCurrency } from "@/features/qr/helpers/format";
import { BOARD_REFRESH_MS } from "@/features/operaciones/constants/stations";

import type { BoardOrder } from "@/features/operaciones/interfaces/board";
import type { StationBoardViewProps } from "@/features/operaciones/interfaces/boardComponents";

const GRID_COLUMNS: Record<number, string> = {
  1: "",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-2 xl:grid-cols-4",
};

const iconButton =
  "inline-flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-surface text-muted-foreground shadow-sm ring-1 ring-border transition-all duration-150 hover:text-foreground active:scale-95 sm:h-11 sm:w-11";

export function StationBoardView({
  station,
  tenantId,
  tenantSlug,
  view = "active",
}: StationBoardViewProps) {
  const board = useStationBoard(tenantId, station.key, view);
  const density = useBoardDensity(
    station.key,
    station.layout === "accordion" && station.key !== "preparacion"
      ? "compact"
      : "detailed",
  );
  const now = useNow();
  const can = usePermission();
  const [delivering, setDelivering] = useState<BoardOrder | null>(null);
  const [rejecting, setRejecting] = useState<BoardOrder | null>(null);
  const [rejectingPayment, setRejectingPayment] = useState<string | null>(null);
  const [charging, setCharging] = useState<BoardOrder | null>(null);
  const [mobileColumn, setMobileColumn] = useState<string | null>(null);

  const isHistory = view === "done";
  const abilities = board.board?.can;
  const columns = board.board?.columns ?? [];
  const activeColumn =
    mobileColumn ??
    columns.find((c) => c.orders.length > 0)?.key ??
    columns[0]?.key;
  const stationHref = `/dashboard/${tenantSlug}/operacion/${station.key}`;
  // ?volver= brings "Volver" in the order page back to this station, not to the orders list.
  const detailHref = (order: BoardOrder) =>
    abilities?.openDetail
      ? `/dashboard/${tenantSlug}/ordenes/${order.id}?volver=${encodeURIComponent(stationHref)}`
      : undefined;
  const itemsMove =
    (station.key === "preparacion" || station.key === "mis-pedidos") &&
    Boolean(abilities?.prepare) &&
    !isHistory;
  const accordion = station.layout === "accordion";

  function renderOrder(order: BoardOrder, compact: boolean) {
    return (
      <BoardOrderCard
        key={order.id}
        order={order}
        now={now}
        compact={compact}
        showTimer={station.key !== "caja" && !order.finished}
        canAdvanceItems={itemsMove}
        busyItemId={board.busyItemOf(order.id)}
        locked={board.isBusy(order.id)}
        onAdvanceItem={(itemId, status) =>
          board.advanceItem(order.id, itemId, status)
        }
        detailHref={detailHref(order)}
      >
        {!isHistory && (
          <StationCardActions
            station={station.key}
            order={order}
            board={board}
            team={board.board?.team ?? []}
            onDeliver={setDelivering}
            onCharge={setCharging}
            onReject={setRejecting}
            onRejectPayment={setRejectingPayment}
          />
        )}
      </BoardOrderCard>
    );
  }

  return (
    <div className="space-y-4">
      {isHistory && (
        <Link
          href={stationHref}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver a {station.label}
        </Link>
      )}
      {!isHistory && <StationTabs tenantSlug={tenantSlug} active={station.key} />}
      <PageHeader
        title={
          isHistory ? (station.historyLabel ?? station.label) : station.label
        }
        description={
          isHistory
            ? station.key === "caja"
              ? "Cada cobro de hoy con su hora, método y quién lo confirmó."
              : "Lo que se terminó hoy, con la hora y quién lo hizo."
            : station.purpose
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            {!isHistory && station.historyLabel && (
              <Link
                href={`${stationHref}/terminados`}
                className={btnWorkSecondary}
              >
                <History className="h-4 w-4" aria-hidden />
                {station.historyLabel}
              </Link>
            )}
            {
              <button
                type="button"
                onClick={density.toggle}
                aria-label={
                  density.compact
                    ? "Ver pedidos completos"
                    : "Ver pedidos en una línea"
                }
                title={
                  density.compact
                    ? "Ver pedidos completos"
                    : "Ver pedidos en una línea"
                }
                className={iconButton}
              >
                {density.compact ? (
                  <LayoutList className="h-4 w-4" aria-hidden />
                ) : (
                  <Rows3 className="h-4 w-4" aria-hidden />
                )}
              </button>
            }
            <BoardRefreshButton
              refreshing={board.refreshing}
              updatedAt={board.updatedAt}
              intervalMs={BOARD_REFRESH_MS}
              onRefresh={() => void board.refresh()}
            />
            {station.key === "mis-pedidos" && can("order.take") && (
              <Link
                href={`/dashboard/${tenantSlug}/ordenes/nueva`}
                className={btnWorkPrimary}
              >
                <Plus className="h-4 w-4" aria-hidden />
                Nueva orden
              </Link>
            )}
          </div>
        }
      />

      {board.board?.collectedToday !== null &&
        board.board?.collectedToday !== undefined && (
          <Link
            href={`${stationHref}/terminados`}
            className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm transition-colors hover:bg-border-soft/40"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Cobrado hoy
              </p>
              <p className="mt-1 text-4xl font-bold tracking-tight text-foreground tabular-nums">
                {formatCurrency(board.board.collectedToday)}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent">
              Ver cobros
              <ChevronRight className="h-4 w-4" aria-hidden />
            </span>
          </Link>
        )}

      {board.board?.collectedSummary && (
        <CollectedSummaryCard summary={board.board.collectedSummary} />
      )}

      {board.loadError && (
        <Notification tone="error" message={board.loadError} />
      )}
      {board.actionError && (
        <Notification tone="error" message={board.actionError} />
      )}
      {board.notice && <Notification tone="success" message={board.notice} />}

      {board.loading ? (
        <LoadingBlock
          variant="skeleton"
          message="Cargando pedidos"
          skeletonRows={4}
        />
      ) : isHistory ? (
        (columns[0]?.orders.length ?? 0) === 0 ? (
          <EmptyState
            icon={Inbox}
            title={columns[0]?.empty ?? "Nada todavía."}
            tone="muted"
          />
        ) : (
          <div className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
            {columns[0].orders.map((order) =>
              renderOrder(order, density.compact),
            )}
          </div>
        )
      ) : accordion ? (
        <BoardAccordion
          columns={columns}
          renderOrder={(order) => renderOrder(order, density.compact)}
        />
      ) : (
        <>
          {columns.length > 1 && (
            <div className="lg:hidden">
              <FilterTabs
                tabs={columns.map((c) => ({
                  value: c.key,
                  label: `${c.label} (${c.orders.length})`,
                }))}
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
                <h2
                  id={`col-${column.key}`}
                  className="mb-3 hidden items-center justify-between px-1 text-sm font-bold text-foreground lg:flex"
                >
                  {column.label}
                  <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs tabular-nums text-muted-foreground">
                    {column.orders.length}
                  </span>
                </h2>
                {column.orders.length === 0 ? (
                  <EmptyState icon={Inbox} title={column.empty} tone="muted" />
                ) : (
                  <div className={density.compact ? "space-y-2" : "space-y-3"}>
                    {column.orders.map((order) =>
                      renderOrder(order, density.compact),
                    )}
                  </div>
                )}
              </section>
            ))}
          </div>
        </>
      )}

      <ChargeSheet
        target={
          charging
            ? {
                id: charging.id,
                number: charging.number,
                due: Number(charging.balanceDue ?? charging.total ?? 0),
                originLabel: charging.originLabel,
                customerName: charging.customerName,
                paymentMethod: charging.paymentMethod,
                assignedTo: charging.assignedTo,
              }
            : null
        }
        team={board.board?.team ?? []}
        onClose={() => setCharging(null)}
        onCharged={() => void board.refresh()}
      />
      <DeliveryCompletionSheet
        open={Boolean(delivering)}
        busy={Boolean(delivering) && board.isBusy(delivering?.id ?? "")}
        onClose={() => setDelivering(null)}
        onSubmit={async (photo, note) => {
          if (!delivering) return;
          const type =
            delivering.fulfillmentMethod === "pickup"
              ? "pickup_completed"
              : "delivered";
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
      <ConfirmDialog
        isOpen={Boolean(rejectingPayment)}
        onClose={() => setRejectingPayment(null)}
        onConfirm={async () => {
          if (!rejectingPayment) return;
          await board.rejectPayment(rejectingPayment);
          setRejectingPayment(null);
        }}
        loading={
          Boolean(rejectingPayment) && board.busyPaymentId === rejectingPayment
        }
        variant="danger"
        title="¿El dinero no llegó?"
        description="El cliente verá que su pago fue rechazado y podrá intentarlo de nuevo."
        confirmLabel="No llegó"
      />
    </div>
  );
}
