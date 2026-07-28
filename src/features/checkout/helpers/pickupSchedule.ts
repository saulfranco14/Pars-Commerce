/**
 * Reglas de la hora de recolección. Puras, sin I/O, para que el formulario del
 * cliente y la validación del servidor apliquen EXACTAMENTE las mismas.
 *
 * Que estén juntas no es cosmético: si el navegador ofrece "en 2 horas" y el
 * servidor exige 3 de anticipación, el cliente elige un hueco que después le
 * rebotan sin entender por qué.
 */

import {
  DEFAULT_PICKUP_SCHEDULING,
  type PickupSchedulingConfig,
} from "@/features/checkout/interfaces/pickupSchedule";

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

/** Lee la config de `tenants.settings`, rellenando lo que falte. */
export function readPickupScheduling(
  settings: Record<string, unknown> | null | undefined,
): PickupSchedulingConfig {
  const raw = (settings?.pickup_scheduling ?? {}) as Partial<PickupSchedulingConfig>;
  return {
    enabled: raw.enabled ?? DEFAULT_PICKUP_SCHEDULING.enabled,
    // `??` y no `||`: un 0 explícito ("sin anticipación mínima") es una
    // respuesta válida y `||` lo tomaría por ausencia.
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
  | "too_far";

export type ScheduleValidation =
  | { ok: true; value: Date | null }
  | { ok: false; reason: ScheduleRejection; message: string };

/**
 * Valida la hora que eligió el cliente. `null`/vacío es válido y significa
 * "sin agendar": agendar es opcional aunque el negocio lo ofrezca.
 */
export function validateScheduledFor(
  raw: string | null | undefined,
  config: PickupSchedulingConfig,
  now: Date,
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

  // Un minuto de holgura: entre que el cliente toca "en 2 horas" y el servidor
  // recibe la petición pasan segundos, y sin el margen el propio preset del
  // negocio se cae por unos milisegundos.
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

  return { ok: true, value: when };
}

function formatLead(minutes: number): string {
  if (minutes < 60) return `${minutes} minutos`;
  const hours = Math.round(minutes / 60);
  return hours === 1 ? "1 hora" : `${hours} horas`;
}

export interface PickupPreset {
  /** Clave estable para el `key` de React y para las pruebas. */
  id: string;
  label: string;
  value: Date;
}

/**
 * Opciones rápidas de recolección. Se ofrecen primero porque casi siempre es
 * una de ellas; el selector exacto solo aparece si el cliente pide otra hora.
 *
 * Se descartan las que caigan fuera de la ventana del negocio, así que un
 * negocio con 4 horas de anticipación mínima simplemente no muestra "en 1
 * hora" en vez de mostrarla y rechazarla después.
 */
export function buildPickupPresets(
  config: PickupSchedulingConfig,
  now: Date,
): PickupPreset[] {
  const { earliest, latest } = scheduleBounds(config, now);

  const candidates: Array<{ id: string; label: string; value: Date }> = [
    { id: "1h", label: "En 1 hora", value: new Date(now.getTime() + 60 * MINUTE_MS) },
    { id: "2h", label: "En 2 horas", value: new Date(now.getTime() + 120 * MINUTE_MS) },
    { id: "4h", label: "En 4 horas", value: new Date(now.getTime() + 240 * MINUTE_MS) },
    { id: "manana", label: "Mañana a las 10:00", value: tomorrowAt(now, 10) },
  ];

  return candidates.filter(
    (c) => c.value >= earliest && c.value <= latest,
  );
}

function tomorrowAt(now: Date, hour: number): Date {
  const d = new Date(now);
  d.setDate(d.getDate() + 1);
  d.setHours(hour, 0, 0, 0);
  return d;
}

/**
 * Convierte un `Date` al formato que espera `<input type="datetime-local">`,
 * que es hora LOCAL sin zona. `toISOString()` daría UTC y el input mostraría
 * una hora corrida — en México, seis adelante.
 */
export function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

/** Cómo se le lee al cliente la hora que eligió. */
export function formatPickupTime(date: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
