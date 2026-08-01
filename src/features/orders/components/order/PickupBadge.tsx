"use client";

import { AlertTriangle, CalendarClock } from "lucide-react";

import { formatAgendaDateTime } from "@/features/orders/helpers/agendaBuckets";

import type { PickupBadgeProps } from "@/features/orders/interfaces/pickupBadge";

const CLOSED_STATUSES = ["cancelled", "completed", "paid"];

// Red only when past due and still open — the case that demands action.
export function PickupBadge({ scheduledFor, status, className = "" }: PickupBadgeProps) {
  if (!scheduledFor) return null;

  const when = new Date(scheduledFor);
  if (Number.isNaN(when.getTime())) return null;

  const late =
    when.getTime() < Date.now() && !CLOSED_STATUSES.includes(status ?? "");
  const Icon = late ? AlertTriangle : CalendarClock;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        late
          ? "bg-red-100 text-red-700"
          : "bg-accent/10 text-accent"
      } ${className}`}
      title={late ? "Ya pasó la hora acordada" : "Hora de recolección"}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      {late ? "Atrasado · " : "Recoge "}
      {formatAgendaDateTime(scheduledFor)}
    </span>
  );
}
