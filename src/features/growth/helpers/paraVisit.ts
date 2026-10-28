import { PARA_OBJECTION_LABEL, PARA_VISIT_DAYS_ACCEPTED, PARA_VISIT_DAYS_SHOWN, PARA_VISIT_SLOT_LABEL } from "@/features/growth/constants/para";

import type { ParaObjection, ParaVisitDay, ParaVisitRequest, ParaVisitSlot } from "@/features/growth/interfaces/para";

const DAY_MS = 86_400_000;

function todayIn(timeZone: string, now: Date): Date {
  const local = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  return new Date(`${local}T00:00:00Z`);
}

/** Calendar days after today in the business's zone, Sundays out. Dates are handled as UTC midnights. */
function upcomingDays(now: Date, timeZone: string, count: number, includeToday: boolean): Date[] {
  const days: Date[] = [];
  for (let offset = includeToday ? 0 : 1; days.length < count; offset += 1) {
    const day = new Date(todayIn(timeZone, now).getTime() + offset * DAY_MS);
    if (day.getUTCDay() !== 0) days.push(day);
  }
  return days;
}

function label(day: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("es-MX", { timeZone: "UTC", ...options }).format(day).replace(".", "");
}

export function visitDayOptions(now: Date, timeZone: string, count = PARA_VISIT_DAYS_SHOWN): ParaVisitDay[] {
  return upcomingDays(now, timeZone, count, false).map((day) => {
    const weekday = label(day, { weekday: "short" });
    return { value: day.toISOString().slice(0, 10), label: `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${day.getUTCDate()}` };
  });
}

/** "jueves 30 de octubre", for the alert and the confirmation. */
export function visitDayLong(value: string): string {
  return label(new Date(`${value}T00:00:00Z`), { weekday: "long", day: "numeric", month: "long" }).replace(",", "");
}

export function parseVisitRequest(raw: unknown, now: Date, timeZone: string): ParaVisitRequest | null {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const slot = source.slot as ParaVisitSlot;
  if (typeof slot !== "string" || !Object.hasOwn(PARA_VISIT_SLOT_LABEL, slot)) return null;
  const allowed = upcomingDays(now, timeZone, PARA_VISIT_DAYS_ACCEPTED, true).map((day) => day.toISOString().slice(0, 10));
  return typeof source.day === "string" && allowed.includes(source.day) ? { day: source.day, slot } : null;
}

export function parseObjection(raw: unknown): ParaObjection | null {
  const reason = (raw as { reason?: unknown } | null)?.reason;
  return typeof reason === "string" && Object.hasOwn(PARA_OBJECTION_LABEL, reason) ? (reason as ParaObjection) : null;
}
