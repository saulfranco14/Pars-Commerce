import { addDays, datesOn, upcomingDate } from "@/features/ventas/helpers/commercialCalendar";

import type { LowDay, WeekDay, WeekReport } from "@/features/ventas/interfaces/weekReport";

/** Below this share of the same weekday last week, a day is marked as low. */
const LOW_SHARE = 0.6;
/** A drop from a tiny amount is noise, not a low day. */
const MIN_COMPARABLE = 100;

/**
 * Last 7 days against the 7 before, day by day against the same weekday.
 * `totals` maps a Mexico City date (YYYY-MM-DD) to what was sold that day.
 */
export function buildWeekReport(
  totals: Record<string, number>,
  today: string,
  context: { giroLabel: string; place: string | null },
): WeekReport {
  const days: WeekDay[] = Array.from({ length: 14 }, (_, index) => {
    const date = addDays(today, index - 13);
    return { date, total: totals[date] ?? 0, previous: totals[addDays(date, -7)] ?? 0 };
  });
  const week = days.slice(7);
  const total = week.reduce((sum, day) => sum + day.total, 0);
  const previousTotal = days.slice(0, 7).reduce((sum, day) => sum + day.total, 0);
  const lowDays: LowDay[] = week
    // Today is still open, so it is never called low.
    .filter((day) => day.date !== today && day.previous >= MIN_COMPARABLE && day.total < day.previous * LOW_SHARE)
    .map((day) => ({ ...day, coincides: datesOn(day.date) }));
  return {
    days,
    total,
    previousTotal,
    change: previousTotal > 0 ? Math.round(((total - previousTotal) / previousTotal) * 100) : null,
    lowDays,
    upcoming: upcomingDate(today),
    ...context,
  };
}
