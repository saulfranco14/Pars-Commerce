/**
 * Agrupa los pedidos agendados en Atrasados / Hoy / Mañana / Después.
 *
 * Puro y sin I/O para poder razonarlo y probarlo sin montar la pantalla. Las
 * comparaciones son por DÍA CALENDARIO local, no por diferencia de horas: un
 * pedido a las 23:00 y otro a la 01:00 están separados por dos horas pero son
 * "hoy" y "mañana" para quien atiende el mostrador.
 */

import type {
  AgendaBucket,
  AgendaBucketKey,
  AgendaCounts,
} from "@/features/orders/interfaces/agenda";
import type { OrderListItem } from "@/types/orders";

/** Estados en los que el pedido ya no espera a nadie en el mostrador. */
const CLOSED_STATUSES = ["cancelled", "completed"];

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function daysApart(target: Date, now: Date): number {
  const ms = startOfDay(target).getTime() - startOfDay(now).getTime();
  return Math.round(ms / 86_400_000);
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

  // Hoy pero ya pasó la hora: se separa aparte porque es el único grupo que
  // exige hacer algo ya. Un pedido cancelado o entregado no está atrasado.
  if (diff === 0) {
    const late = when.getTime() < now.getTime();
    return late && !CLOSED_STATUSES.includes(order.status) ? "atrasados" : "hoy";
  }

  // Días anteriores: atrasado, salvo que ya se haya cerrado.
  return CLOSED_STATUSES.includes(order.status) ? "despues" : "atrasados";
}

const LABELS: Record<AgendaBucketKey, string> = {
  atrasados: "Atrasados",
  hoy: "Hoy",
  manana: "Mañana",
  despues: "Después",
};

const ORDER: AgendaBucketKey[] = ["atrasados", "hoy", "manana", "despues"];

/** Los grupos con al menos un pedido, en orden de urgencia. */
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

/** La hora de recolección, como se lee en la agenda. */
export function formatAgendaTime(iso: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Día y hora completos, para los grupos que abarcan varios días. */
export function formatAgendaDateTime(iso: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
