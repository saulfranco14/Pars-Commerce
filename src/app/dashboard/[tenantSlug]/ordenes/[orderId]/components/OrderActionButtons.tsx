"use client";

import { useState } from "react";
import { useOrder } from "../hooks/useOrder";
import { useTenantStore } from "@/stores/useTenantStore";
import { ConfirmModal } from "@/components/ConfirmModal";
import { AssignBeforePaidModal } from "./AssignBeforePaidModal";
import { ConfirmPaymentModal } from "./ConfirmPaymentModal";
import {
  Zap,
  PlayCircle,
  CheckCircle,
  DollarSign,
  Smartphone,
  X,
} from "lucide-react";

function isExpressOrderEnabled(settings: unknown): boolean {
  if (!settings || typeof settings !== "object") return false;
  const s = settings as Record<string, unknown>;
  return s.express_order_enabled === true || s.express_orders === true;
}

type OrderActionButtonsProps = {
  embedded?: boolean;
  fixedBar?: boolean;
};

export function OrderActionButtons({
  embedded,
  fixedBar,
}: OrderActionButtonsProps = {}) {
  const {
    order,
    team,
    actionLoading,
    handleStatusChange,
    handleAssignAndMarkPaid,
    handleMarkAsPaidWithMethod,
    handleGeneratePaymentLink,
    handleExpressToPayment,
  } = useOrder();
  const activeTenant = useTenantStore((s) => s.activeTenant)();
  const activeRole = useTenantStore((s) => s.activeRole)();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [assignBeforePaidModalOpen, setAssignBeforePaidModalOpen] =
    useState(false);
  const [confirmPaymentModalOpen, setConfirmPaymentModalOpen] = useState(false);

  if (!order) return null;

  const items = order.items ?? [];
  const hasNoItems = items.length === 0;
  const canStartOrComplete = !hasNoItems;
  const expressEnabled = isExpressOrderEnabled(activeTenant?.settings);
  const isEditableStatus = ["draft", "assigned", "in_progress"].includes(
    order.status,
  );
  const showExpressButton =
    expressEnabled && isEditableStatus && canStartOrComplete;
  const isOwner = activeRole?.name === "owner";
  const showCancel =
    isOwner &&
    ["draft", "assigned", "in_progress", "pending_pickup", "paid"].includes(order.status);
  const needsAssignBeforePaid =
    !order.assigned_to &&
    (order.status === "completed" || order.status === "pending_payment" || order.status === "pending_pickup");

  async function handleExpressClick() {
    if (!order) return;
    const wasUnassigned = !order.assigned_to;
    const ok = await handleExpressToPayment();
    if (ok) {
      if (wasUnassigned) {
        setAssignBeforePaidModalOpen(true);
      } else {
        setConfirmPaymentModalOpen(true);
      }
    }
  }

  function handlePayClick() {
    if (needsAssignBeforePaid) {
      setAssignBeforePaidModalOpen(true);
    } else {
      setConfirmPaymentModalOpen(true);
    }
  }

  const btnBase =
    "inline-flex min-h-[48px] min-w-0 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 active:scale-[0.98]";
  const btnPrimary = `${btnBase} bg-accent text-accent-foreground hover:bg-accent/90 focus-visible:ring-accent`;
  const btnSuccess = `${btnBase} bg-emerald-600 text-white shadow-sm hover:bg-emerald-500 focus-visible:ring-emerald-500`;
  const btnBlue = `${btnBase} bg-blue-600 text-white hover:bg-blue-500 focus-visible:ring-blue-500`;
  const btnDestructive = `${btnBase} border border-red-200 bg-surface text-red-600 hover:bg-red-50 focus-visible:ring-red-500/50`;

  const wrapperClass = embedded
    ? "w-full min-w-0 max-w-full overflow-hidden"
    : "w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-border bg-surface-raised p-4 shadow-sm";

  const flexClass = fixedBar
    ? "flex w-full min-w-0 max-w-full flex-col gap-3 overflow-hidden"
    : "flex w-full min-w-0 max-w-full flex-col-reverse gap-3 overflow-hidden sm:flex-row sm:flex-wrap sm:justify-end";

  return (
    <div className={wrapperClass}>
      <div className={flexClass}>
        {showExpressButton && (
          <button
            type="button"
            onClick={handleExpressClick}
            disabled={actionLoading}
            className={`w-full min-w-0 shrink-0 sm:w-auto ${btnSuccess}`}
          >
            <Zap className="h-4 w-4 shrink-0" aria-hidden />
            Ir al cobro
          </button>
        )}
        {showCancel && (
          <button
            type="button"
            onClick={() => setCancelModalOpen(true)}
            disabled={actionLoading}
            className={`w-full min-w-0 shrink-0 sm:w-auto ${btnDestructive}`}
          >
            <X className="h-4 w-4 shrink-0" aria-hidden />
            Cancelar orden
          </button>
        )}
        {!showExpressButton && order.status === "draft" && (
          <button
            type="button"
            onClick={() => handleStatusChange("in_progress")}
            disabled={actionLoading || !canStartOrComplete}
            className={`w-full min-w-0 shrink-0 sm:w-auto ${btnPrimary}`}
            title={
              hasNoItems ? "Agrega al menos un item para iniciar" : undefined
            }
          >
            <PlayCircle className="h-4 w-4 shrink-0" aria-hidden />
            Iniciar sin asignar
          </button>
        )}
        {!showExpressButton && order.status === "assigned" && (
          <button
            type="button"
            onClick={() => handleStatusChange("in_progress")}
            disabled={actionLoading || !canStartOrComplete}
            className={`w-full min-w-0 shrink-0 sm:w-auto ${btnPrimary}`}
            title={
              hasNoItems ? "Agrega al menos un item para iniciar" : undefined
            }
          >
            <PlayCircle className="h-4 w-4 shrink-0" aria-hidden />
            Iniciar trabajo
          </button>
        )}
        {!showExpressButton && order.status === "in_progress" && (
          <button
            type="button"
            onClick={() => handleStatusChange("completed")}
            disabled={actionLoading || !canStartOrComplete}
            className={`w-full min-w-0 shrink-0 sm:w-auto ${btnSuccess}`}
            title={
              hasNoItems
                ? "La orden debe tener items para completar"
                : undefined
            }
          >
            <CheckCircle className="h-4 w-4 shrink-0" aria-hidden />
            Marcar completado
          </button>
        )}
        {order.status === "completed" && (
          <>
            <button
              type="button"
              onClick={handlePayClick}
              disabled={actionLoading}
              className={`w-full min-w-0 shrink-0 sm:w-auto ${btnSuccess}`}
            >
              <DollarSign className="h-4 w-4 shrink-0" aria-hidden />
              Cobro directo
            </button>
            <button
              type="button"
              onClick={handleGeneratePaymentLink}
              disabled={actionLoading}
              className={`w-full min-w-0 shrink-0 sm:w-auto ${btnBlue}`}
            >
              <Smartphone className="h-4 w-4 shrink-0" aria-hidden />
              {actionLoading ? "Generando…" : "Generar cobro (MercadoPago)"}
            </button>
          </>
        )}
        {(order.status === "pending_payment" || order.status === "pending_pickup") && (
          <button
            type="button"
            onClick={handlePayClick}
            disabled={actionLoading}
            className={`w-full min-w-0 shrink-0 sm:w-auto ${btnSuccess}`}
          >
            <DollarSign className="h-4 w-4 shrink-0" aria-hidden />
            {order.status === "pending_pickup" ? "Marcar como cobrado (recogió)" : "Marcar como pagado"}
          </button>
        )}
      </div>

      <ConfirmModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={async () => {
          await handleStatusChange("cancelled");
          setCancelModalOpen(false);
        }}
        title="Cancelar orden"
        message="¿Estás seguro de que deseas cancelar esta orden? Esta acción no se puede deshacer y la orden no podrá recuperarse."
        confirmLabel="Sí, cancelar"
        confirmDanger={true}
        loading={actionLoading}
      />

      <AssignBeforePaidModal
        isOpen={assignBeforePaidModalOpen}
        onClose={() => setAssignBeforePaidModalOpen(false)}
        onConfirm={async (assignToId, paymentMethod) => {
          await handleAssignAndMarkPaid(assignToId, paymentMethod);
          setAssignBeforePaidModalOpen(false);
        }}
        team={team}
        loading={actionLoading}
      />

      <ConfirmPaymentModal
        isOpen={confirmPaymentModalOpen}
        onClose={() => setConfirmPaymentModalOpen(false)}
        onConfirm={async (paymentMethod) => {
          await handleMarkAsPaidWithMethod(paymentMethod);
          setConfirmPaymentModalOpen(false);
        }}
        total={Number(order.total)}
        loading={actionLoading}
      />
    </div>
  );
}
