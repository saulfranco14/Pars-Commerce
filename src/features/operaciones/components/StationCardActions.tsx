"use client";

import { useState } from "react";
import { Bike, Check, CheckCheck, Loader2, Play, UserPlus, Wallet, X } from "lucide-react";

import {
  btnWorkDanger,
  btnWorkPrimary,
  btnWorkSecondary,
  btnWorkSuccess,
} from "@/components/ui/buttonClasses";
import { PendingPaymentRows } from "@/features/operaciones/components/PendingPaymentRows";
import { TransferProofRow } from "@/features/operaciones/components/TransferProofRow";

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
    <div className={`grid gap-2 ${anyStarted ? "grid-cols-1" : "grid-cols-2"}`}>
      {!anyStarted && (
        <button type="button" disabled={busy} onClick={() => board.advance(order.id, "in_progress")} className={btnWorkSecondary}>
          {busy ? <Busy /> : <Play className="h-4 w-4" aria-hidden />}
          Empezar
        </button>
      )}
      <button type="button" disabled={busy} onClick={() => board.advance(order.id, "ready")} className={btnWorkSuccess}>
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
        className="select-custom min-h-12 min-w-0 flex-1 cursor-pointer rounded-xl border border-border bg-surface px-3 text-[15px] text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:min-h-11 sm:text-sm"
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
        onClick={async () => {
          const member = team.find((m) => m.userId === selected);
          if (member && (await board.assign(order, member))) setSelected("");
        }}
        className={btnWorkPrimary}
      >
        {busy ? <Busy /> : <UserPlus className="h-4 w-4" aria-hidden />}
        Asignar
      </button>
    </div>
  );
}

/** Only what this role can do on this order; the abilities come fresh from the server. */
export function StationCardActions({
  station,
  order,
  board,
  team,
  onDeliver,
  onReject,
  onRejectPayment,
  onRejectProof,
  onCharge,
}: StationCardActionsProps) {
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
          <div className="grid grid-cols-2 gap-2">
            <button type="button" disabled={busy} onClick={() => board.respondRequest(order.id, "accept-request")} className={btnWorkPrimary}>
              {busy ? <Busy /> : <Check className="h-4 w-4" aria-hidden />}
              Aceptar
            </button>
            <button type="button" disabled={busy} onClick={() => onReject(order)} className={btnWorkDanger}>
              <X className="h-4 w-4" aria-hidden />
              Rechazar
            </button>
          </div>
        );
      }
      return <AssignPicker order={order} board={board} team={team} />;

    case "entregas":
      if (!can.deliver) return null;
      if (!order.paid && order.deliveryStage === "pending") {
        return (
          <p className="text-sm text-muted-foreground">
            Lo cobra Caja. Si el cliente llega, pídele que pase a Caja; aparecerá en Listos para entregar en cuanto pague.
          </p>
        );
      }
      if (order.fulfillmentMethod === "delivery" && order.deliveryStage === "pending") {
        return (
          <button type="button" disabled={busy} onClick={() => board.deliveryEvent(order.id, "out_for_delivery")} className={`${btnWorkPrimary} w-full`}>
            {busy ? <Busy /> : <Bike className="h-4 w-4" aria-hidden />}
            Salió a entregar
          </button>
        );
      }
      return (
        <button type="button" disabled={busy} onClick={() => onDeliver(order)} className={`${btnWorkSuccess} w-full`}>
          {busy ? <Busy /> : <CheckCheck className="h-4 w-4" aria-hidden />}
          Entregado
        </button>
      );

    case "caja":
      if (can.collect && order.transferProof) {
        const proof = order.transferProof;
        return (
          <TransferProofRow
            proof={proof}
            fallbackAmount={order.balanceDue}
            busy={board.busyPaymentId === proof.id}
            onApprove={() => void board.reviewProof(order, proof.id, "approve")}
            onReject={() => onRejectProof(order)}
          />
        );
      }
      if (can.collect && order.pendingPayments.length > 0) {
        return (
          <PendingPaymentRows
            payments={order.pendingPayments}
            busyPaymentId={board.busyPaymentId}
            onConfirm={board.confirmPayment}
            onReject={onRejectPayment}
          />
        );
      }
      return can.collect && !order.paid ? (
        <button type="button" disabled={busy} onClick={() => onCharge(order)} className={`${btnWorkPrimary} w-full`}>
          {busy ? <Busy /> : <Wallet className="h-4 w-4" aria-hidden />}
          Cobrar
        </button>
      ) : null;
  }
}
