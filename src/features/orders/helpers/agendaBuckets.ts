// Buckets scheduled orders by Mexico calendar day, not by hour difference:
// 23:00 and 01:00 are two hours apart but different days at the counter.

import { mexicoMoment } from "@/features/configuracion/helpers/businessHours";

import type {
  AgendaBucket,
  AgendaBucketKey,
  AgendaCounts,
} from "@/features/orders/interfaces/agenda";
import type { OrderListItem } from "@/types/orders";

/** Statuses where nobody is waiting at the counter any more. */
const CLOSED_STATUSES = ["cancelled", "completed"];

/** Calendar days apart, counted in the business timezone. */
function daysApart(target: Date, now: Date): number {
  const a = Date.parse(`${mexicoMoment(target).dateStr}T00:00:00Z`);
  const b = Date.parse(`${mexicoMoment(now).dateStr}T00:00:00Z`);
  return Math.round((a - b) / 86_400_000);
}

export function bucketOf(
  order: OrderListItem,
  now: Date,
): AgendaBucketKey | null {
  if (!order.scheduled_for) return null;
  const when = new Date(order.scheduled_for);
  if (Number.isNaN(when.getTime())) return null;

  const diff = daysApart(when, now);
  if (diff > 1) return "despues";
  if (diff === 1) return "manana";

  // Today but past due — the only bucket that demands action now.
  if (diff === 0) {
    const late = when.getTime() < now.getTime();
    return late && !CLOSED_STATUSES.includes(order.status) ? "atrasados" : "hoy";
  }

  // Earlier days: late unless already closed.
  return CLOSED_STATUSES.includes(order.status) ? "despues" : "atrasados";
}

const LABELS: Record<AgendaBucketKey, string> = {
  atrasados: "Atrasados",
  hoy: "Hoy",
  manana: "Mañana",
  despues: "Después",
};

const ORDER: AgendaBucketKey[] = ["atrasados", "hoy", "manana", "despues"];

/** Non-empty buckets, in order of urgency. */
export function groupAgenda(
  orders: OrderListItem[],
  now: Date,
): AgendaBucket[] {
  const byKey = new Map<AgendaBucketKey, OrderListItem[]>();
  for (const order of orders) {
    const key = bucketOf(order, now);
    if (!key) continue;
    const list = byKey.get(key);
    if (list) list.push(order);
    else byKey.set(key, [order]);
  }

  return ORDER.filter((key) => (byKey.get(key)?.length ?? 0) > 0).map((key) => ({
    key,
    label: LABELS[key],
    orders: byKey.get(key) ?? [],
  }));
}

export function countAgenda(
  orders: OrderListItem[],
  now: Date,
): AgendaCounts {
  const counts: AgendaCounts = {
    atrasados: 0,
    hoy: 0,
    manana: 0,
    despues: 0,
  };
  for (const order of orders) {
    const key = bucketOf(order, now);
    if (key) counts[key] += 1;
  }
  return counts;
}

// Always the business timezone; unpinned it would follow the process (UTC).
const MEXICO_TZ = "America/Mexico_City";

export function formatAgendaTime(iso: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: MEXICO_TZ,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Full day and time, for buckets spanning several days. */
export function formatAgendaDateTime(iso: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: MEXICO_TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
