/** 0 = domingo … 6 = sábado, igual que `Date.getDay()`. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Franja horaria en formato "HH:mm". */
export interface TimeRange {
  open: string;
  close: string;
}

export interface DayHours {
  closed: boolean;
  /** Varias franjas permiten el horario partido (9-14 y 16-20). */
  ranges: TimeRange[];
}

export interface BusinessHours {
  /** `always` = 24/7, sin franjas que revisar. */
  mode: "always" | "weekly";
  /** Siempre 7 entradas, indexadas por `Weekday`. */
  days: DayHours[];
}

/** Indexado por `Weekday` (0 = domingo), igual que `Date.getDay()`. */
export const WEEKDAY_LABELS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;

/**
 * Orden en que se leen y editan los días. Empieza en lunes porque así se lee
 * una semana aquí; el índice 0 del array sigue siendo domingo porque es lo que
 * devuelve `Date.getDay()`.
 */
export const WEEKDAY_DISPLAY_ORDER: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 0];

/** Punto de partida al configurar: lunes a sábado de 9 a 18, domingo cerrado. */
export const SUGGESTED_BUSINESS_HOURS: BusinessHours = {
  mode: "weekly",
  days: [
    { closed: true, ranges: [] },
    { closed: false, ranges: [{ open: "09:00", close: "18:00" }] },
    { closed: false, ranges: [{ open: "09:00", close: "18:00" }] },
    { closed: false, ranges: [{ open: "09:00", close: "18:00" }] },
    { closed: false, ranges: [{ open: "09:00", close: "18:00" }] },
    { closed: false, ranges: [{ open: "09:00", close: "18:00" }] },
    { closed: false, ranges: [{ open: "09:00", close: "14:00" }] },
  ],
};
