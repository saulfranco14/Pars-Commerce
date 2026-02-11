"use client";

import { useState, useEffect } from "react";
import { useOrder } from "../hooks/useOrder";
import { UserPlus, UserCheck } from "lucide-react";

export function AssignmentCard() {
  const { order, team, actionLoading, handleAssign } = useOrder();
  const [assignTo, setAssignTo] = useState("");

  useEffect(() => {
    if (order?.assigned_to) {
      setAssignTo(order.assigned_to);
    }
  }, [order?.assigned_to]);

  if (!order) return null;

  const isAssigned = !!order.assigned_to;
  const showAssignment = ["draft", "assigned", "in_progress"].includes(order.status);
  
  if (!showAssignment) return null;

  // Si ya está asignado, mostramos una versión informativa sin botones de cambio
  if (isAssigned) {
    const assignedMember = team.find(t => t.user_id === order.assigned_to);
    return (
      <div className="rounded-xl border border-border bg-stone-50/50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Orden asignada</h3>
            <p className="text-sm text-muted">
              Encargado: <span className="font-medium text-foreground">{assignedMember?.display_name || assignedMember?.email || "Miembro del equipo"}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-left">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-600">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Asignación de equipo</h3>
            <p className="text-xs text-muted">Selecciona quién se encargará de este pedido.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={assignTo}
            onChange={(e) => setAssignTo(e.target.value)}
            className="select-custom min-h-[40px] rounded-lg border border-border bg-white px-3 py-1 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20"
          >
            <option value="">Seleccionar...</option>
            {team.map((t) => (
              <option key={t.user_id} value={t.user_id}>
                {t.display_name || t.email}
              </option>
            ))}
          </select>
          
          <button
            type="button"
            onClick={() => handleAssign(assignTo)}
            disabled={actionLoading || !assignTo}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50 transition-all"
          >
            Asignar
          </button>
        </div>
      </div>
    </div>
  );
}
