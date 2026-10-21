"use client";

import { CalendarX2, Copy, ExternalLink, MessageCircle, RotateCcw, XCircle } from "lucide-react";

import { AdminListCard } from "@/components/admin/AdminListCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ActionsMenu, type ActionsMenuItem } from "@/components/ui/ActionsMenu";

import { formatCurrency } from "@/features/qr/helpers/format";
import {
  formatPlanDate,
  PLAN_SUBSCRIPTION_STATUS_META,
  planPriceLabel,
  planReminderHref,
} from "@/features/suscripciones/helpers/planSubscriptionView";

import type { PlanSubscriptionCardProps } from "@/features/suscripciones/interfaces/planSubscription";

export function PlanSubscriptionCard({ row, origin, busy, onCopyLink, onCancelNow, onCancelAtEnd, onResume }: PlanSubscriptionCardProps) {
  const meta = PLAN_SUBSCRIPTION_STATUS_META[row.status];
  const due = row.due_period;
  const reminder = planReminderHref(row, origin);
  const planUrl = `${origin}/plan/${row.public_token}`;
  const running = row.status === "active" || row.status === "past_due" || row.status === "pending_setup";

  const items: ActionsMenuItem[] = [
    { label: "Abrir enlace del cliente", icon: ExternalLink, onClick: () => window.open(planUrl, "_blank", "noopener") },
    { label: "Copiar enlace del cliente", icon: Copy, onClick: () => onCopyLink(planUrl) },
    ...(running && row.status !== "pending_setup"
      ? [
          row.cancel_at_period_end
            ? { label: "Seguir renovando", icon: RotateCcw, onClick: onResume, disabled: busy }
            : { label: "Cancelar al terminar el periodo", icon: CalendarX2, onClick: onCancelAtEnd, disabled: busy },
        ]
      : []),
    ...(running ? [{ label: "Cancelar ahora", icon: XCircle, onClick: onCancelNow, danger: true, disabled: busy }] : []),
  ];

  return (
    <AdminListCard
      title={row.customer_name}
      meta={
        <span className="flex flex-col gap-0.5">
          <span className="font-semibold text-foreground">{row.plan.name}</span>
          <span>
            {planPriceLabel(row.plan)}
            {row.current_period_end && running ? ` · periodo ${row.current_period_number} hasta el ${formatPlanDate(row.current_period_end)}` : ""}
          </span>
          {row.cancel_at_period_end ? <span className="font-medium text-amber-700 dark:text-amber-300">Se cancela al terminar el periodo</span> : null}
        </span>
      }
      badge={<StatusBadge tone={meta.tone} label={meta.label} />}
      body={
        due ? (
          <p className="rounded-lg bg-border-soft/60 px-3 py-2 text-sm text-foreground">
            Periodo {due.period_number} · <strong>{formatCurrency(due.amount)}</strong> ·{" "}
            {due.status === "overdue" ? "venció" : "vence"} el {formatPlanDate(due.due_at)}
          </p>
        ) : null
      }
      actions={
        <div className="flex w-full items-center justify-between gap-2">
          {reminder ? (
            <a
              href={reminder}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-accent hover:bg-accent/10"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              Recordar por WhatsApp
            </a>
          ) : (
            <span />
          )}
          <ActionsMenu items={items} aria-label={`Acciones de la suscripción de ${row.customer_name}`} />
        </div>
      }
    />
  );
}
