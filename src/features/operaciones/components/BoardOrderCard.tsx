"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarClock, CheckCircle2, ChevronDown, Clock, ExternalLink, MapPin, Phone, User } from "lucide-react";

import { StatusBadge } from "@/components/admin/StatusBadge";
import { BoardItemRow } from "@/features/operaciones/components/BoardItemRow";

import { elapsedLabel, elapsedTone, minutesSince } from "@/features/operaciones/helpers/elapsed";
import { formatCurrency } from "@/features/qr/helpers/format";

import type { BoardOrderCardProps } from "@/features/operaciones/interfaces/boardComponents";

const TIMER_CLASSES = {
  neutral: "text-muted-foreground",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-red-600 dark:text-red-400",
};

const timeOf = (iso: string) => new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

export function BoardOrderCard({
  order,
  now,
  detailHref,
  showTimer = true,
  compact = false,
  canAdvanceItems = false,
  busyItemId = null,
  onAdvanceItem,
  children,
}: BoardOrderCardProps) {
  const [expanded, setExpanded] = useState(false);
  const open = !compact || expanded;
  const minutes = minutesSince(order.createdAt, now);
  const readyCount = order.items.filter((i) => i.status === "ready").length;
  const progress = order.items.length ? readyCount / order.items.length : 0;
  const itemsMoved = order.items.some((i) => i.status !== "received");

  return (
    <article className="rounded-xl border border-border bg-surface shadow-sm">
      <button
        type="button"
        onClick={() => compact && setExpanded((v) => !v)}
        aria-expanded={compact ? open : undefined}
        className={`flex w-full items-start justify-between gap-3 p-4 text-left ${compact ? "cursor-pointer" : "cursor-default"}`}
      >
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-mono text-sm font-bold text-foreground">
            #{order.number}
            <span className="truncate font-sans text-sm font-semibold">· {order.originLabel}</span>
          </p>
          {order.assignedName && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              Atiende: <span className="font-semibold text-foreground">{order.assignedName}</span>
            </p>
          )}
          {order.items.length > 0 && (itemsMoved || compact) && (
            <div className="mt-1.5 flex items-center gap-2">
              <span className="h-1.5 w-20 overflow-hidden rounded-full bg-border-soft">
                <span className="block h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress * 100}%` }} />
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {readyCount} de {order.items.length} listos
              </span>
            </div>
          )}
        </div>
        <span className="flex shrink-0 items-center gap-2">
          {order.doneAt ? (
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              {timeOf(order.doneAt)}
            </span>
          ) : (
            showTimer && (
              <span className={`inline-flex items-center gap-1 text-sm font-semibold ${TIMER_CLASSES[elapsedTone(minutes)]}`}>
                <Clock className="h-4 w-4" aria-hidden />
                {elapsedLabel(minutes)}
              </span>
            )
          )}
          {compact && (
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
          )}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4">
          {order.items.length > 0 && (
            <ul className="divide-y divide-border-soft border-t border-border-soft">
              {order.items.map((item) => (
                <BoardItemRow
                  key={item.id}
                  item={item}
                  canAdvance={canAdvanceItems && Boolean(onAdvanceItem) && order.items.length > 1}
                  busy={busyItemId === item.id}
                  onAdvance={(status) => onAdvanceItem?.(item.id, status)}
                />
              ))}
            </ul>
          )}

          <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
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
                <span className="wrap-break-word">{order.address}</span>
              </p>
            )}
            {order.scheduledFor && (
              <p className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 shrink-0" aria-hidden />
                {new Date(order.scheduledFor).toLocaleString("es-MX", { weekday: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
            {order.doneBy && <p className="text-xs">Lo terminó {order.doneBy}</p>}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {order.fulfillmentMethod === "delivery" && <StatusBadge tone="info" label="A domicilio" dot={false} />}
            {order.fulfillmentMethod === "pickup" && <StatusBadge tone="info" label="Recoge en local" dot={false} />}
            <StatusBadge tone={order.paid ? "success" : "warning"} label={order.paid ? "Pagado" : "Sin pagar"} />
            {order.balanceDue !== null && order.balanceDue > 0 && (
              <span className="ml-auto text-base font-bold tabular-nums text-foreground">{formatCurrency(order.balanceDue)}</span>
            )}
          </div>

          {detailHref && (
            <Link href={detailHref} className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-1.5 text-sm font-semibold text-accent">
              <ExternalLink className="h-4 w-4" aria-hidden />
              Ver pedido completo
            </Link>
          )}
        </div>
      )}

      {children && <div className="flex flex-col gap-2 px-4 pb-4">{children}</div>}
    </article>
  );
}
