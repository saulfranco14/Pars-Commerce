/**
 * Calendar math for subscription and membership periods. Months clamp to the
 * last day (Jan 31 + 1 month = Feb 28/29), matching Postgres interval math so
 * the dashboard, the customer page and SQL agree on every due date.
 */

export type IntervalUnit = "week" | "month";

export interface PlanInterval {
  unit: IntervalUnit;
  count: number;
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

export function addInterval(start: Date, interval: PlanInterval, times = 1): Date {
  const steps = interval.count * times;
  if (interval.unit === "week") {
    return new Date(start.getTime() + steps * 7 * 24 * 60 * 60 * 1000);
  }
  const year = start.getUTCFullYear();
  const targetMonth = start.getUTCMonth() + steps;
  const targetYear = year + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const day = Math.min(start.getUTCDate(), daysInMonth(targetYear, normalizedMonth));
  return new Date(
    Date.UTC(
      targetYear,
      normalizedMonth,
      day,
      start.getUTCHours(),
      start.getUTCMinutes(),
      start.getUTCSeconds(),
      start.getUTCMilliseconds(),
    ),
  );
}

/** Bounds of period `n` (1-based) for a plan that started at `anchor`. */
export function periodBounds(anchor: Date, interval: PlanInterval, periodNumber: number): { start: Date; end: Date } {
  const start = addInterval(anchor, interval, periodNumber - 1);
  return { start, end: addInterval(anchor, interval, periodNumber) };
}

/** The moment the next period's order should exist so the customer can pay on time. */
export function renewalIssueDate(periodEnd: Date, leadDays: number): Date {
  return new Date(periodEnd.getTime() - leadDays * 24 * 60 * 60 * 1000);
}

export function formatInterval(interval: PlanInterval): string {
  if (interval.unit === "week") {
    return interval.count === 1 ? "semana" : interval.count === 2 ? "2 semanas" : `${interval.count} semanas`;
  }
  return interval.count === 1 ? "mes" : `${interval.count} meses`;
}
