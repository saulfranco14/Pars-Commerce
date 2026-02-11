"use client";

import { useOrder } from "../hooks/useOrder";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useState } from "react";

export function OrderActionButtons() {
  const { order, actionLoading, handleStatusChange } = useOrder();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  if (!order) return null;

  const showCancel = ["draft", "assigned", "in_progress"].includes(
    order.status,
  );

  return (
    <div className="flex flex-wrap gap-2">
      {order.status === "draft" && (
        <button
          type="button"
          onClick={() => handleStatusChange("in_progress")}
          disabled={actionLoading}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
        >
          Iniciar sin asignar
        </button>
      )}
      {order.status === "assigned" && (
        <button
          type="button"
          onClick={() => handleStatusChange("in_progress")}
          disabled={actionLoading}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
        >
          Iniciar trabajo
        </button>
      )}
      {order.status === "in_progress" && (
        <button
          type="button"
          onClick={() => handleStatusChange("completed")}
          disabled={actionLoading}
          className="rounded-lg bg-green-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
        >
          Marcar completado
        </button>
      )}
      {order.status === "completed" && (
        <>
          <button
            type="button"
            onClick={() => handleStatusChange("paid")}
            disabled={actionLoading}
            className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            Cobro directo
          </button>
          <button
            type="button"
            onClick={() => handleStatusChange("pending_payment")}
            disabled={actionLoading}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            Generar cobro (link de pago)
          </button>
        </>
      )}
      {order.status === "pending_payment" && (
        <button
          type="button"
          onClick={() => handleStatusChange("paid")}
          disabled={actionLoading}
          className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          Marcar como pagado
        </button>
      )}
      {showCancel && (
        <button
          type="button"
          onClick={() => setCancelModalOpen(true)}
          disabled={actionLoading}
          className="rounded-lg border border-red-300 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          Cancelar orden
        </button>
      )}

      <ConfirmModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={async () => {
          await handleStatusChange("cancelled");
          setCancelModalOpen(false);
        }}
        title="Cancelar orden"
        message="¿Estás seguro de que deseas cancelar esta orden? Esta acción no se puede deshacer."
        confirmLabel="Sí, cancelar"
        confirmDanger={true}
        loading={actionLoading}
      />
    </div>
  );
}
