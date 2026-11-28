import type { CalendarDate, UpcomingDate } from "@/features/ventas/interfaces/weekReport";

const DAY_MS = 86_400_000;

function iso(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function toUtc(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function addDays(date: string, days: number): string {
  return new Date(toUtc(date) + days * DAY_MS).toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / DAY_MS);
}

/** 0 = Sunday … 6 = Saturday */
export function weekdayOf(date: string): number {
  return new Date(toUtc(date)).getUTCDay();
}

/** The nth given weekday of a month (1-based), e.g. the third Monday of November. */
function nthWeekday(year: number, month: number, weekday: number, n: number): string {
  const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  return iso(year, month, 1 + ((weekday - first + 7) % 7) + (n - 1) * 7);
}

/** Western Easter Sunday (anonymous Gregorian algorithm). */
function easter(year: number): string {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return iso(year, month, day);
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Dates that move sales in Mexico: official holidays, long weekends, celebrations and paydays. */
export function commercialDates(year: number): CalendarDate[] {
  const dates: CalendarDate[] = [];
  const add = (date: string, label: string, upcoming = true) => dates.push({ date, label, upcoming });
  add(iso(year, 1, 1), "Año Nuevo");
  add(iso(year, 1, 6), "Día de Reyes");
  add(nthWeekday(year, 2, 1, 1), "Puente del Día de la Constitución");
  add(iso(year, 2, 14), "Día del Amor y la Amistad");
  add(nthWeekday(year, 3, 1, 3), "Puente del natalicio de Benito Juárez");
  add(addDays(easter(year), -3), "Jueves Santo");
  add(addDays(easter(year), -2), "Viernes Santo");
  add(iso(year, 4, 30), "Día del Niño");
  add(iso(year, 5, 1), "Día del Trabajo");
  add(iso(year, 5, 10), "Día de las Madres");
  add(nthWeekday(year, 6, 0, 3), "Día del Padre");
  add(iso(year, 9, 15), "Noche del Grito");
  add(iso(year, 9, 16), "Día de la Independencia");
  add(iso(year, 10, 31), "Halloween");
  add(iso(year, 11, 1), "Día de Muertos");
  add(iso(year, 11, 2), "Día de Muertos");
  add(nthWeekday(year, 11, 1, 3), "Puente de la Revolución");
  add(iso(year, 12, 12), "Día de la Virgen de Guadalupe");
  for (let day = 16; day <= 24; day++) add(iso(year, 12, day), "Posadas");
  add(iso(year, 12, 24), "Nochebuena");
  add(iso(year, 12, 25), "Navidad");
  add(iso(year, 12, 31), "Fin de año");
  for (let month = 1; month <= 12; month++) {
    add(iso(year, month, 15), "Quincena", false);
    add(iso(year, month, lastDayOfMonth(year, month)), "Quincena", false);
  }
  return dates;
}

/** Labels the calendar has for a day, without repeats. */
export function datesOn(date: string): string[] {
  const year = Number(date.slice(0, 4));
  return [...new Set(commercialDates(year).filter((entry) => entry.date === date).map((entry) => entry.label))];
}

/** The next celebration within `horizon` days, with consecutive days of the same name joined (posadas). */
export function upcomingDate(today: string, horizon = 45): UpcomingDate | null {
  const year = Number(today.slice(0, 4));
  const pool = [...commercialDates(year), ...commercialDates(year + 1)]
    .filter((entry) => entry.upcoming)
    .sort((a, b) => a.date.localeCompare(b.date));
  const first = pool.find((entry) => daysBetween(today, entry.date) >= 1 && daysBetween(today, entry.date) <= horizon);
  if (!first) return null;
  let end = first.date;
  while (pool.some((entry) => entry.label === first.label && entry.date === addDays(end, 1))) end = addDays(end, 1);
  return { label: first.label, start: first.date, end, inDays: daysBetween(today, first.date) };
}
