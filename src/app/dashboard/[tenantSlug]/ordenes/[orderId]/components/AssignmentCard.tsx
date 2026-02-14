"use client";

import { useState, useEffect } from "react";
import { useOrder } from "../hooks/useOrder";
import { useTenantStore } from "@/stores/useTenantStore";
import { UserPlus, UserCheck, Check } from "lucide-react";

export function AssignmentCard() {
  const { order, team, actionLoading, assignmentSuccess, handleAssign } =
    useOrder();
  const activeRole = useTenantStore((s) => s.activeRole)();
  const [assignTo, setAssignTo] = useState("");

  useEffect(() => {
    if (order?.assigned_to) {
      setAssignTo(order.assigned_to);
    } else {
      setAssignTo("");
    }
  }, [order?.assigned_to]);

  if (!order) return null;

  const isAssigned = !!order.assigned_to;
  const isPaid = order.status === "paid";
  const isOwner = activeRole?.name === "owner";
  const showAssignment = ["draft", "assigned", "in_progress", "paid"].includes(
    order.status
  );

  if (!showAssignment) return null;

  const assignedMember =
    team.find((t) => t.user_id === order.assigned_to) ?? order.assigned_user;
  const assigneeLabel = isAssigned
    ? assignedMember?.display_name || assignedMember?.email || "Miembro del equipo"
    : "Sin asignar";

  const infoBlock = (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
        <UserCheck className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Encargado
        </p>
        <p className="text-sm font-semibold text-foreground">{assigneeLabel}</p>
      </div>
    </div>
  );

  if (isPaid && isOwner) {
    return (
      <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-surface-raised p-4 shadow-sm">
        {assignmentSuccess && (
          <div
            className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700"
            role="status"
          >
            <Check className="h-4 w-4 shrink-0" />
            Asignación actualizada
          </div>
        )}
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">{infoBlock}</div>
          <div className="flex min-w-0 shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value={assignTo}
              onChange={(e) => setAssignTo(e.target.value)}
              className="select-custom min-h-[44px] w-full min-w-0 max-w-full rounded-lg border border-border bg-border-soft/50 px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:w-auto"
            >
              <option value="">Cambiar a...</option>
              {team.map((t) => (
                <option key={t.user_id} value={t.user_id}>
                  {t.display_name || t.email}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => handleAssign(assignTo)}
              disabled={
                actionLoading || !assignTo || assignTo === order.assigned_to
              }
              className="inline-flex min-h-[44px] shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-border-soft/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-surface"
            >
              <UserCheck className="h-4 w-4 shrink-0" aria-hidden />
              {actionLoading ? "Guardando…" : "Cambiar asignación"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isPaid) {
    return (
      <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-surface-raised p-4 shadow-sm">
        {infoBlock}
      </div>
    );
  }

  if (isAssigned) {
    return (
      <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-surface-raised p-4 shadow-sm">
        {infoBlock}
      </div>
    );
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-surface-raised p-4 shadow-sm">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
            <UserPlus className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Asignación de equipo
            </h3>
            <p className="text-xs text-muted">
              Selecciona quién se encargará de este pedido
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={assignTo}
            onChange={(e) => setAssignTo(e.target.value)}
            className="select-custom min-h-[44px] w-full min-w-0 max-w-full rounded-lg border border-border bg-border-soft/50 px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:w-auto"
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
            className="inline-flex min-h-[44px] shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors duration-200 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
            {actionLoading ? "Asignando…" : "Asignar"}
          </button>
        </div>
      </div>
    </div>
  );
}
