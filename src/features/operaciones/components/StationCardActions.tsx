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

/** Whole-order shortcuts; single products move from their own row. */
function PrepareButtons({ order, board }: { order: BoardOrder; board: StationBoardController }) {
  const busy = board.isBusy(order.id);
  const anyStarted = order.items.some((i) => i.status !== "received");
  if (order.fulfillmentStatus === "ready") return null;
  return (
    <div className="flex gap-2">
      {!anyStarted && (
        <button type="button" disabled={busy} onClick={() => board.advance(order.id, "in_progress")} className={`${btnSecondary} flex-1`}>
          {busy ? <Busy /> : <Play className="h-4 w-4" aria-hidden />}
          Empezar todo
        </button>
      )}
      <button type="button" disabled={busy} onClick={() => board.advance(order.id, "ready")} className={`${btnPrimary} flex-1`}>
        {busy ? <Busy /> : <Check className="h-4 w-4" aria-hidden />}
        Todo listo
      </button>
    </div>
  );
}

function AssignPicker({ order, board, team }: { order: BoardOrder; board: StationBoardController; team: BoardTeamMember[] }) {
  const [selected, setSelected] = useState("");
  const busy = board.isBusy(order.id);
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

/** Only what this role can do on this order; the abilities come fresh from the server. */
export function StationCardActions({ station, order, board, team, detailHref, onDeliver, onReject }: StationCardActionsProps) {
  const can = board.board?.can;
  const busy = board.isBusy(order.id);
  if (!can || order.status === "completed") return null;

  switch (station) {
    case "preparacion":
    case "mis-pedidos":
      return can.prepare ? <PrepareButtons order={order} board={board} /> : null;

    case "recepcion":
      if (!can.assign) return null;
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

    case "entregas":
      if (!can.deliver) return null;
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

    case "caja":
      return can.collect && detailHref ? (
        <Link href={detailHref} className={`${btnPrimary} w-full`}>
          <Wallet className="h-4 w-4" aria-hidden />
          Cobrar
        </Link>
      ) : null;
  }
}
