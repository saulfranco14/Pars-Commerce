"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, UserCheck, UserPlus } from "lucide-react";

import { useOrder } from "@/features/orders/hooks/useOrder";
import { usePermission } from "@/stores/useTenantStore";
import { ORDER_PERMISSIONS } from "@/features/orders/constants/orderPermissions";

import type { AssignmentPickerProps } from "@/features/orders/interfaces/assignment";

/** Estados en los que todavía tiene sentido hablar de quién atiende el pedido. */
const ASSIGNABLE_STATUSES = [
  "draft",
  "assigned",
  "in_progress",
  "pending_pickup",
  "paid",
];

/**
 * Selector de a quién se le pasa el pedido. Se extrajo del cuerpo de la
 * tarjeta porque antes estaba escrito tres veces —una por cada combinación de
 * móvil/escritorio y pagado/sin pagar— y las tres se habían ido separando.
 */
function AssignmentPicker({
  team,
  assignedTo,
  onAssign,
  loading,
  actionLabel,
}: AssignmentPickerProps) {
  const [selected, setSelected] = useState(assignedTo ?? "");

  useEffect(() => setSelected(assignedTo ?? ""), [assignedTo]);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="select-custom min-h-11 w-full min-w-0 max-w-full cursor-pointer rounded-lg border border-border bg-border-soft/50 px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:w-auto"
        aria-label="Miembro del equipo"
      >
        <option value="">{assignedTo ? "Cambiar a…" : "Seleccionar…"}</option>
        {team.map((t) => (
          <option key={t.user_id} value={t.user_id}>
            {t.display_name || t.email}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => onAssign(selected)}
        disabled={loading || !selected || selected === assignedTo}
        className="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors duration-200 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
        {loading ? "Guardando…" : actionLabel}
      </button>
    </div>
  );
}

/**
 * Quién atiende el pedido, y el control para cambiarlo.
 *
 * Dos reglas que antes no se cumplían:
 *
 * 1. Se decide por PERMISO, no por nombre de rol. Antes preguntaba
 *    `activeRole?.name === "owner"`, así que un rol personalizado con
 *    `orders.assign` no podía asignar.
 * 2. Un pedido ya asignado se puede REASIGNAR. Antes, en cuanto tenía dueño la
 *    tarjeta se volvía de solo lectura para todos, lo que dejaba sin salida el
 *    caso normal: alguien recibe el pedido y luego se lo pasa a quien lo
 *    atendió de verdad.
 *
 * Sobre un pedido ya pagado se pide además `orders.addendum` (solo el dueño
 * del negocio), porque reasignarlo reescribe a quién se le atribuye la venta.
 * Es la misma regla que aplica el PATCH de `/api/orders`.
 */
export function AssignmentCard() {
  const { order, team, actionLoading, assignmentSuccess, handleAssign } =
    useOrder();
  const can = usePermission();
  const [open, setOpen] = useState(false);

  if (!order || !ASSIGNABLE_STATUSES.includes(order.status)) return null;

  const isPaid = order.status === "paid";
  const canAssign =
    can(ORDER_PERMISSIONS.assign) &&
    (!isPaid || can(ORDER_PERMISSIONS.addendum));

  const assignedMember =
    team.find((t) => t.user_id === order.assigned_to) ?? order.assigned_user;
  const assigneeLabel = order.assigned_to
    ? assignedMember?.display_name ||
      assignedMember?.email ||
      "Miembro del equipo"
    : "Sin asignar";

  const body = (
    <div className="space-y-4">
      {assignmentSuccess && (
        <div
          className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700"
          role="status"
        >
          <Check className="h-4 w-4 shrink-0" aria-hidden />
          Asignación actualizada
        </div>
      )}

      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              order.assigned_to
                ? "bg-emerald-500/10 text-emerald-600"
                : "bg-muted/60 text-muted-foreground"
            }`}
          >
            {order.assigned_to ? (
              <UserCheck className="h-4 w-4" aria-hidden />
            ) : (
              <UserPlus className="h-4 w-4" aria-hidden />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Encargado
            </p>
            <p className="truncate text-sm font-semibold text-foreground">
              {assigneeLabel}
            </p>
          </div>
        </div>

        {canAssign && (
          <AssignmentPicker
            team={team}
            assignedTo={order.assigned_to ?? null}
            onAssign={handleAssign}
            loading={actionLoading}
            actionLabel={order.assigned_to ? "Reasignar" : "Asignar"}
          />
        )}
      </div>

      {/* Un pedido de autoservicio sin dueño es un estado válido, no un dato
          faltante: el cliente escaneó el QR y nadie lo atendió. Se dice para
          que no se lea como un error. */}
      {!order.assigned_to && !canAssign && (
        <p className="text-xs text-muted-foreground">
          Nadie tiene este pedido asignado. Tu rol no puede repartir pedidos.
        </p>
      )}
    </div>
  );

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-surface-raised shadow-sm">
      <details
        open={open}
        onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
        className="group [&>summary::-webkit-details-marker]:hidden"
      >
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 md:px-4">
          <div className="flex min-w-0 items-center gap-2">
            {order.assigned_to ? (
              <UserCheck
                className="h-4 w-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
            ) : (
              <UserPlus
                className="h-4 w-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
            )}
            <span className="text-sm font-semibold text-foreground">
              Asignación
            </span>
            <span className="truncate text-sm text-muted">{assigneeLabel}</span>
          </div>
          <ChevronDown
            className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180"
            aria-hidden
          />
        </summary>
        <div className="border-t border-border/50 p-3 md:p-4">{body}</div>
      </details>
    </div>
  );
}
