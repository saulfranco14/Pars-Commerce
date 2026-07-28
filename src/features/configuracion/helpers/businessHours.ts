/**
 * Horarios de atención. Puro, sin I/O.
 *
 * Todo se evalúa en hora de Ciudad de México y NUNCA con `getHours()`: estas
 * funciones corren también en el servidor, que va en UTC, y ahí `getHours()`
 * daría seis horas de más — lo bastante para leer el día equivocado de
 * madrugada.
 */

import {
  WEEKDAY_LABELS,
  type BusinessHours,
  type DayHours,
  type TimeRange,
  WEEKDAY_DISPLAY_ORDER,
  type Weekday,
} from "@/features/configuracion/interfaces/businessHours";

const MEXICO_TZ = "America/Mexico_City";
const MEXICO_OFFSET = "-06:00";
const DAY_MINUTES = 24 * 60;

const PARTS = new Intl.DateTimeFormat("en-CA", {
  timeZone: MEXICO_TZ,
  weekday: "short",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const WEEKDAY_INDEX: Record<string, Weekday> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

export interface MexicoMoment {
  weekday: Weekday;
  /** Minutos desde la medianoche local. */
  minutes: number;
  /** `YYYY-MM-DD` local. */
  dateStr: string;
}

/** Qué día y qué hora es en México en ese instante. */
export function mexicoMoment(date: Date): MexicoMoment {
  const parts = PARTS.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    weekday: WEEKDAY_INDEX[get("weekday")] ?? 0,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
    dateStr: `${get("year")}-${get("month")}-${get("day")}`,
  };
}

/** Instante absoluto de una hora de pared mexicana. */
export function mexicoDateAt(dateStr: string, minutes: number): Date {
  const h = String(Math.floor(minutes / 60) % 24).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return new Date(`${dateStr}T${h}:${m}:00${MEXICO_OFFSET}`);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00${MEXICO_OFFSET}`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toLocaleDateString("en-CA", { timeZone: MEXICO_TZ });
}

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

export function toHHmm(minutes: number): string {
  const h = String(Math.floor(minutes / 60) % 24).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}

/** `null` = el negocio todavía no dio de alta sus horarios. */
export function readBusinessHours(
  settings: Record<string, unknown> | null | undefined,
): BusinessHours | null {
  const raw = settings?.business_hours as Partial<BusinessHours> | undefined;
  if (!raw || (raw.mode !== "always" && raw.mode !== "weekly")) return null;
  if (raw.mode === "always") return { mode: "always", days: [] };
  if (!Array.isArray(raw.days) || raw.days.length !== 7) return null;
  return {
    mode: "weekly",
    days: raw.days.map((d) => ({
      closed: d?.closed ?? true,
      ranges: Array.isArray(d?.ranges) ? d.ranges : [],
    })),
  };
}

/**
 * Franjas que cubren un día, incluidas las que vienen de la noche anterior.
 * Un `close` menor que el `open` significa que la franja cruza la medianoche
 * (una taquería de 18:00 a 02:00), y esa cola pertenece al día siguiente.
 */
function activeRanges(
  hours: BusinessHours,
  weekday: Weekday,
): Array<{ from: number; to: number }> {
  const out: Array<{ from: number; to: number }> = [];

  const today = hours.days[weekday];
  if (today && !today.closed) {
    for (const r of today.ranges) {
      const from = toMinutes(r.open);
      const to = toMinutes(r.close);
      out.push({ from, to: to <= from ? DAY_MINUTES : to });
    }
  }

  const prev = hours.days[((weekday + 6) % 7) as Weekday];
  if (prev && !prev.closed) {
    for (const r of prev.ranges) {
      const from = toMinutes(r.open);
      const to = toMinutes(r.close);
      if (to <= from) out.push({ from: 0, to });
    }
  }

  return out;
}

export function isOpenAt(hours: BusinessHours, date: Date): boolean {
  if (hours.mode === "always") return true;
  const { weekday, minutes } = mexicoMoment(date);
  return activeRanges(hours, weekday).some(
    (r) => minutes >= r.from && minutes < r.to,
  );
}

/**
 * Cuándo vuelve a abrir a partir de `from`. Devuelve `from` si ya está
 * abierto. `null` si no abre en toda la semana siguiente — que es el caso de
 * un negocio con los siete días cerrados.
 */
export function nextOpening(hours: BusinessHours, from: Date): Date | null {
  if (hours.mode === "always") return from;
  if (isOpenAt(hours, from)) return from;

  const start = mexicoMoment(from);
  for (let offset = 0; offset <= 7; offset++) {
    const dateStr = addDays(start.dateStr, offset);
    const weekday = ((start.weekday + offset) % 7) as Weekday;
    const day = hours.days[weekday];
    if (!day || day.closed) continue;

    const opens = day.ranges
      .map((r) => toMinutes(r.open))
      .filter((m) => offset > 0 || m > start.minutes)
      .sort((a, b) => a - b);

    if (opens.length > 0) return mexicoDateAt(dateStr, opens[0]);
  }
  return null;
}

/** Resumen legible de un día: "9:00–14:00 y 16:00–20:00" o "Cerrado". */
export function describeDay(day: DayHours): string {
  if (day.closed || day.ranges.length === 0) return "Cerrado";
  return day.ranges.map((r) => `${r.open}–${r.close}`).join(" y ");
}

/**
 * Resumen de una semana, agrupando días seguidos con el mismo horario. Se
 * recorre de lunes a domingo, que es como se lee una semana aquí.
 */
export function describeWeek(hours: BusinessHours): string[] {
  if (hours.mode === "always") return ["Abierto las 24 horas, todos los días"];

  const order = WEEKDAY_DISPLAY_ORDER;
  const lines: string[] = [];
  let runStart = 0;
  for (let i = 1; i <= order.length; i++) {
    const same =
      i < order.length &&
      describeDay(hours.days[order[i]]) ===
        describeDay(hours.days[order[runStart]]);
    if (same) continue;
    const label =
      runStart === i - 1
        ? WEEKDAY_LABELS[order[runStart]]
        : `${WEEKDAY_LABELS[order[runStart]]} a ${WEEKDAY_LABELS[order[i - 1]]}`;
    lines.push(`${label}: ${describeDay(hours.days[order[runStart]])}`);
    runStart = i;
  }
  return lines;
}

/** Franja vacía lista para editar. */
export function emptyRange(): TimeRange {
  return { open: "09:00", close: "18:00" };
}
