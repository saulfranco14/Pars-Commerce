import { formatInterval } from "@/lib/offers/planPeriods";

import type { StatusTone } from "@/components/admin/StatusBadge";
import type {
  PlanPeriod,
  PlanSnapshot,
  PlanSubscriptionRow,
  PlanSubscriptionStatus,
  PlanSubscriptionTab,
} from "@/features/suscripciones/interfaces/planSubscription";

export const PLAN_SUBSCRIPTION_TABS: ReadonlyArray<{ value: PlanSubscriptionTab; label: string }> = [
  { value: "por_cobrar", label: "Por cobrar" },
  { value: "activas", label: "Activas" },
  { value: "vencidas", label: "Vencidas" },
  { value: "pendientes", label: "Primer pago" },
  { value: "terminadas", label: "Terminadas" },
];

export const PLAN_SUBSCRIPTION_STATUS_META: Record<PlanSubscriptionStatus, { label: string; tone: StatusTone }> = {
  pending_setup: { label: "Primer pago pendiente", tone: "warning" },
  active: { label: "Activa", tone: "success" },
  past_due: { label: "Vencida", tone: "danger" },
  paused: { label: "Pausada", tone: "neutral" },
  completed: { label: "Completada", tone: "neutral" },
  cancelled: { label: "Cancelada", tone: "neutral" },
};

/** The period that still has to be paid: the newest pending or overdue one. */
export function duePeriod(periods: PlanPeriod[]): PlanPeriod | null {
  return (
    [...periods]
      .filter((period) => period.status === "pending" || period.status === "overdue")
      .sort((a, b) => b.period_number - a.period_number)[0] ?? null
  );
}

export function planSubscriptionTab(row: Pick<PlanSubscriptionRow, "status" | "due_period">): PlanSubscriptionTab {
  if (row.status === "cancelled" || row.status === "completed") return "terminadas";
  if (row.status === "pending_setup") return "pendientes";
  if (row.status === "past_due") return "vencidas";
  if (row.due_period) return "por_cobrar";
  return "activas";
}

export function planPriceLabel(plan: Pick<PlanSnapshot, "price" | "interval_unit" | "interval_count">): string {
  return `$${Number(plan.price).toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} / ${formatInterval({
    unit: plan.interval_unit,
    count: plan.interval_count,
  })}`;
}

export function formatPlanDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", timeZone: "America/Mexico_City" });
}

/** WhatsApp text the business sends to remind a customer of a period to pay. */
export function planReminderMessage(params: {
  customerName: string;
  planName: string;
  period: Pick<PlanPeriod, "period_number" | "amount" | "due_at">;
  payUrl: string;
}): string {
  const firstName = params.customerName.trim().split(/\s+/)[0] || "Hola";
  const amount = `$${Number(params.period.amount).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
  return [
    `Hola ${firstName}, tu ${params.planName} del periodo ${params.period.period_number} ya está listo.`,
    `Total: ${amount}, vence el ${formatPlanDate(params.period.due_at)}.`,
    `Puedes pagarlo aquí: ${params.payUrl}`,
  ].join("\n");
}
