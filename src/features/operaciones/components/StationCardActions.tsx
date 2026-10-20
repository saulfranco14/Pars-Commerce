"use client";

import { useState } from "react";
import Link from "next/link";
import { Bike, Check, CheckCheck, Loader2, Play, UserPlus, Wallet, X } from "lucide-react";

import { btnPrimary, btnSecondary } from "@/components/ui/buttonClasses";

import type { StationBoardController } from "@/features/operaciones/hooks/useStationBoard";
import type { BoardOrder, BoardTeamMember } from "@/features/operaciones/interfaces/board";
import type { StationCardActionsProps } from "@/features/operaciones/interfaces/boardComponents";

function Busy() {
  return <Loader2 className="h-4 w-4 animate-spin" aria-hidden />;
}

function PrepareButtons({ order, board }: { order: BoardOrder; board: StationBoardController }) {
  const busy = board.busyOrderId === order.id;
  if (order.fulfillmentStatus === "received") {
    return (
      <div className="flex gap-2">
        <button type="button" disabled={busy} onClick={() => board.advance(order.id, "in_progress")} className={`${btnPrimary} flex-1`}>
          {busy ? <Busy /> : <Play className="h-4 w-4" aria-hidden />}
          Empezar
        </button>
        <button type="button" disabled={busy} onClick={() => board.advance(order.id, "ready")} className={`${btnSecondary} flex-1`}>
          <Check className="h-4 w-4" aria-hidden />
          Ya está listo
        </button>
      </div>
    );
  }
  if (order.fulfillmentStatus === "in_progress") {
    return (
      <button type="button" disabled={busy} onClick={() => board.advance(order.id, "ready")} className={`${btnPrimary} w-full`}>
        {busy ? <Busy /> : <Check className="h-4 w-4" aria-hidden />}
        Marcar listo
      </button>
    );
  }
  return null;
}

function AssignPicker({ order, board, team }: { order: BoardOrder; board: StationBoardController; team: BoardTeamMember[] }) {
  const [selected, setSelected] = useState("");
  const busy = board.busyOrderId === order.id;
  return (
    <div className="flex gap-2">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        aria-label={`Asignar el pedido ${order.number}`}
        className="select-custom min-h-11 min-w-0 flex-1 cursor-pointer rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      >
        <option value="">{order.assignedTo ? "Pasar a…" : "Asignar a…"}</option>
        {team
          .filter((m) => m.userId !== order.assignedTo)
          .map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.name}
            </option>
          ))}
      </select>
      <button
        type="button"
        disabled={busy || !selected}
        onClick={() => board.assign(order.id, selected).then(() => setSelected(""))}
        className={btnPrimary}
      >
        {busy ? <Busy /> : <UserPlus className="h-4 w-4" aria-hidden />}
        Asignar
      </button>
    </div>
  );
}

export function StationCardActions({
  station,
  order,
  board,
  team,
  canPrepare,
  detailHref,
  onDeliver,
  onReject,
}: StationCardActionsProps) {
  const busy = board.busyOrderId === order.id;

  switch (station) {
    case "preparacion":
      return <PrepareButtons order={order} board={board} />;

    case "mis-pedidos":
      return (
        <>
          {canPrepare && order.status !== "completed" && <PrepareButtons order={order} board={board} />}
          {detailHref && (
            <Link href={detailHref} className={`${btnSecondary} w-full`}>
              Ver pedido
            </Link>
          )}
        </>
      );

    case "recepcion":
      if (order.status === "pending_acceptance") {
        return (
          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={() => board.respondRequest(order.id, "accept-request")} className={`${btnPrimary} flex-1`}>
              {busy ? <Busy /> : <Check className="h-4 w-4" aria-hidden />}
              Aceptar
            </button>
            <button type="button" disabled={busy} onClick={() => onReject(order)} className={`${btnSecondary} flex-1`}>
              <X className="h-4 w-4" aria-hidden />
              Rechazar
            </button>
          </div>
        );
      }
      return <AssignPicker order={order} board={board} team={team} />;

    case "entregas": {
      if (!order.paid) {
        return <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Falta cobrarlo antes de entregar.</p>;
      }
      if (order.fulfillmentMethod === "delivery" && order.deliveryStage === "pending") {
        return (
          <button type="button" disabled={busy} onClick={() => board.deliveryEvent(order.id, "out_for_delivery")} className={`${btnPrimary} w-full`}>
            {busy ? <Busy /> : <Bike className="h-4 w-4" aria-hidden />}
            Salió a entregar
          </button>
        );
      }
      return (
        <button type="button" disabled={busy} onClick={() => onDeliver(order)} className={`${btnPrimary} w-full`}>
          {busy ? <Busy /> : <CheckCheck className="h-4 w-4" aria-hidden />}
          Entregado
        </button>
      );
    }

    case "caja":
      return detailHref ? (
        <Link href={detailHref} className={`${btnPrimary} w-full`}>
          <Wallet className="h-4 w-4" aria-hidden />
          Cobrar
        </Link>
      ) : null;
  }
}
