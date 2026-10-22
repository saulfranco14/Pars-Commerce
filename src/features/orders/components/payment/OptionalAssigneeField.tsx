"use client";

import { Notification } from "@/components/ui/Notification";

import type { OptionalAssigneeFieldProps } from "@/features/orders/interfaces/chargeSheet";

/** Assigning is never required: says nobody has the order and lets them pick someone, or not. */
export function OptionalAssigneeField({ team, value, onChange, disabled = false }: OptionalAssigneeFieldProps) {
  return (
    <div className="space-y-2">
      <Notification tone="warning" message="Este pedido no tiene a nadie asignado." />
      <label className="block">
        <span className="text-sm font-semibold text-foreground">¿Quién lo atendió? (opcional)</span>
        <select
          value={value ?? ""}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value || null)}
          className="select-custom mt-1.5 min-h-12 w-full cursor-pointer rounded-xl border border-border bg-surface px-3 text-[15px] text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-60 sm:min-h-11 sm:text-sm"
        >
          <option value="">Dejar sin asignar</option>
          {team.map((member) => (
            <option key={member.userId} value={member.userId}>
              {member.name}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-muted-foreground">Si eliges a alguien, la venta y la propina quedan a su nombre.</span>
      </label>
    </div>
  );
}
