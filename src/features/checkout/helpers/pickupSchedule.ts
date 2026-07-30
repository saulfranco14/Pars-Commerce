// Shared by the browser form and the server validation: if one offers a slot
// the other rejects, the customer can't tell why.

import {
  DEFAULT_PICKUP_SCHEDULING,
  type PickupSchedulingConfig,
} from "@/features/checkout/interfaces/pickupSchedule";
import {
  isOpenAt,
  mexicoMoment,
  nextOpening,
} from "@/features/configuracion/helpers/businessHours";

import type { BusinessHours } from "@/features/configuracion/interfaces/businessHours";

const MEXICO_TZ = "America/Mexico_City";
const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

export function readPickupScheduling(
  settings: Record<string, unknown> | null | undefined,
): PickupSchedulingConfig {
  const raw = (settings?.pickup_scheduling ?? {}) as Partial<PickupSchedulingConfig>;
  return {
    enabled: raw.enabled ?? DEFAULT_PICKUP_SCHEDULING.enabled,
    // `??` not `||`: an explicit 0 lead time is a valid answer.
    minLeadMinutes: raw.minLeadMinutes ?? DEFAULT_PICKUP_SCHEDULING.minLeadMinutes,
    maxDaysAhead: raw.maxDaysAhead ?? DEFAULT_PICKUP_SCHEDULING.maxDaysAhead,
  };
}

export interface ScheduleBounds {
  earliest: Date;
  latest: Date;
}

export function scheduleBounds(
  config: PickupSchedulingConfig,
  now: Date,
): ScheduleBounds {
  return {
    earliest: new Date(now.getTime() + config.minLeadMinutes * MINUTE_MS),
    latest: new Date(now.getTime() + config.maxDaysAhead * DAY_MS),
  };
}

export type ScheduleRejection =
  | "disabled"
  | "invalid"
  | "too_soon"
  | "too_far"
  | "closed";

export type ScheduleValidation =
  | { ok: true; value: Date | null }
  | { ok: false; reason: ScheduleRejection; message: string };

// Empty is valid and means "not scheduled".
export function validateScheduledFor(
  raw: string | null | undefined,
  config: PickupSchedulingConfig,
  now: Date,
  /** `null` = no hours registered; no time-of-day restriction. */
  hours: BusinessHours | null = null,
): ScheduleValidation {
  if (!raw) return { ok: true, value: null };

  if (!config.enabled) {
    return {
      ok: false,
      reason: "disabled",
      message: "Este negocio no está agendando recolecciones.",
    };
  }

  const when = new Date(raw);
  if (Number.isNaN(when.getTime())) {
    return {
      ok: false,
      reason: "invalid",
      message: "La fecha de recolección no es válida.",
    };
  }

  const { earliest, latest } = scheduleBounds(config, now);

  // One minute of slack so the business's own preset survives the round-trip.
  if (when.getTime() < earliest.getTime() - MINUTE_MS) {
    return {
      ok: false,
      reason: "too_soon",
      message: `Necesitamos al menos ${formatLead(config.minLeadMinutes)} para tenerlo listo.`,
    };
  }

  if (when.getTime() > latest.getTime()) {
    return {
      ok: false,
      reason: "too_far",
      message: `Solo puedes agendar hasta ${config.maxDaysAhead} días adelante.`,
    };
  }

  if (hours && !isOpenAt(hours, when)) {
    const reopens = nextOpening(hours, when);
    return {
      ok: false,
      reason: "closed",
      message: reopens
        ? `El negocio está cerrado a esa hora. Abre el ${formatPickupTime(reopens)}.`
        : "El negocio está cerrado a esa hora.",
    };
  }

  return { ok: true, value: when };
}

function formatLead(minutes: number): string {
  if (minutes < 60) return `${minutes} minutos`;
  const hours = Math.round(minutes / 60);
  return hours === 1 ? "1 hora" : `${hours} horas`;
}

export interface PickupPreset {
  id: string;
  label: string;
  value: Date;
}

// Presets outside the business window or opening hours are dropped: offering
// then rejecting them is worse than not offering them.
export function buildPickupPresets(
  config: PickupSchedulingConfig,
  now: Date,
  hours: BusinessHours | null = null,
): PickupPreset[] {
  const { earliest, latest } = scheduleBounds(config, now);

  const relative: PickupPreset[] = [
    { id: "1h", label: "En 1 hora", value: new Date(now.getTime() + 60 * MINUTE_MS) },
    { id: "2h", label: "En 2 horas", value: new Date(now.getTime() + 120 * MINUTE_MS) },
    { id: "4h", label: "En 4 horas", value: new Date(now.getTime() + 240 * MINUTE_MS) },
  ];

  const presets = relative.filter(
    (c) =>
      c.value >= earliest &&
      c.value <= latest &&
      (!hours || isOpenAt(hours, c.value)),
  );

  const reopening = openingPreset(config, now, hours, earliest, latest);
  if (reopening) presets.push(reopening);

  return presets;
}

// First opening slot after the minimum lead time.
function openingPreset(
  config: PickupSchedulingConfig,
  now: Date,
  hours: BusinessHours | null,
  earliest: Date,
  latest: Date,
): PickupPreset | null {
  if (!hours || hours.mode === "always") {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    return tomorrow >= earliest && tomorrow <= latest
      ? { id: "manana", label: "Mañana a las 10:00", value: tomorrow }
      : null;
  }

  const opens = nextOpening(hours, earliest);
  if (!opens || opens > latest) return null;

  // Mexico calendar day, not `toDateString()`: on a UTC server Monday night
  // already counts as Tuesday.
  const sameDay = mexicoMoment(opens).dateStr === mexicoMoment(now).dateStr;
  return {
    id: "abre",
    label: sameDay
      ? `Hoy al abrir (${formatClock(opens)})`
      : `${capitalize(formatWeekday(opens))} al abrir (${formatClock(opens)})`,
    value: opens,
  };
}

function formatClock(date: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: MEXICO_TZ,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatWeekday(date: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: MEXICO_TZ,
    weekday: "long",
  }).format(date);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// `datetime-local` wants LOCAL wall time; `toISOString()` would shift it.
export function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

// Pins the business timezone: this also renders server-side.
export function formatPickupTime(date: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: MEXICO_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
