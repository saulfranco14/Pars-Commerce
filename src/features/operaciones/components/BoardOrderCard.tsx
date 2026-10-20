"use client";

import Link from "next/link";
import { CalendarClock, Clock, MapPin, Phone, User } from "lucide-react";

import { StatusBadge } from "@/components/admin/StatusBadge";

import { elapsedLabel, elapsedTone, minutesSince } from "@/features/operaciones/helpers/elapsed";
import { formatCurrency } from "@/features/qr/helpers/format";

import type { BoardOrderCardProps } from "@/features/operaciones/interfaces/boardComponents";

const TIMER_CLASSES = {
  neutral: "text-muted-foreground",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-red-600 dark:text-red-400",
};

export function BoardOrderCard({
  order,
  now,
  detailHref,
  showTimer = true,
  children,
}: BoardOrderCardProps) {
  const minutes = minutesSince(order.createdAt, now);
  const header = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-mono text-sm font-bold text-foreground">#{order.number}</p>
        <p className="mt-0.5 truncate text-sm font-medium text-foreground">{order.originLabel}</p>
      </div>
      {showTimer && (
        <span className={`inline-flex shrink-0 items-center gap-1 text-sm font-semibold ${TIMER_CLASSES[elapsedTone(minutes)]}`}>
          <Clock className="h-4 w-4" aria-hidden />
          {elapsedLabel(minutes)}
        </span>
      )}
    </div>
  );

  return (
    <article className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      {detailHref ? (
        <Link href={detailHref} className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          {header}
        </Link>
      ) : (
        header
      )}

      {order.items.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-border-soft pt-3">
          {order.items.map((item, index) => (
            <li key={`${item.name}-${index}`} className="flex gap-2 text-sm text-foreground">
              <span className="w-7 shrink-0 font-bold tabular-nums">{item.quantity}×</span>
              <span className="min-w-0 break-words">{item.name}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
        {order.customerName && (
          <p className="flex items-center gap-2">
            <User className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">{order.customerName}</span>
          </p>
        )}
        {order.customerPhone && (
          <a href={`tel:${order.customerPhone}`} className="flex items-center gap-2 text-accent">
            <Phone className="h-4 w-4 shrink-0" aria-hidden />
            {order.customerPhone}
          </a>
        )}
        {order.address && (
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span className="break-words">{order.address}</span>
          </p>
        )}
        {order.scheduledFor && (
          <p className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 shrink-0" aria-hidden />
            {new Date(order.scheduledFor).toLocaleString("es-MX", { weekday: "short", hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {order.fulfillmentMethod === "delivery" && <StatusBadge tone="info" label="A domicilio" dot={false} />}
        {order.fulfillmentMethod === "pickup" && <StatusBadge tone="info" label="Recoge en local" dot={false} />}
        <StatusBadge tone={order.paid ? "success" : "warning"} label={order.paid ? "Pagado" : "Sin pagar"} />
        {order.assignedName && <StatusBadge tone="neutral" label={order.assignedName} dot={false} />}
        {order.balanceDue !== null && order.balanceDue > 0 && (
          <span className="ml-auto text-base font-bold tabular-nums text-foreground">{formatCurrency(order.balanceDue)}</span>
        )}
      </div>

      {children && <div className="mt-4 flex flex-col gap-2">{children}</div>}
    </article>
  );
}
