import type { ValidityPreset } from "@/features/promociones/interfaces/offerTemplate";

export const VALIDITY_OPTIONS: { value: ValidityPreset; label: string }[] = [
  { value: "none", label: "Sin fecha" },
  { value: "weekend", label: "Este fin de semana" },
  { value: "week", label: "7 días" },
  { value: "month", label: "Este mes" },
  { value: "custom", label: "Elegir fechas" },
];

function toDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** `yyyy-mm-dd` start and end (inclusive) for a quick validity choice, in local time. */
export function validityRange(preset: ValidityPreset, today: Date = new Date()): { from: string; until: string } {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  switch (preset) {
    case "weekend": {
      // Friday to Sunday of this week; from today when the weekend already started.
      const day = start.getDay();
      const daysToFriday = day === 0 ? -2 : day === 6 ? -1 : 5 - day;
      const friday = new Date(start);
      friday.setDate(start.getDate() + daysToFriday);
      const sunday = new Date(friday);
      sunday.setDate(friday.getDate() + 2);
      return { from: toDateInput(friday < start ? start : friday), until: toDateInput(sunday) };
    }
    case "week": {
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { from: toDateInput(start), until: toDateInput(end) };
    }
    case "month": {
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      return { from: toDateInput(start), until: toDateInput(end) };
    }
    default:
      return { from: "", until: "" };
  }
}

/** Date inputs are days; the end of the last day is when the promotion stops. */
export function toValidityTimestamps(from: string, until: string): { valid_from: string | null; valid_until: string | null } {
  return {
    valid_from: from ? new Date(`${from}T00:00:00`).toISOString() : null,
    valid_until: until ? new Date(`${until}T23:59:59`).toISOString() : null,
  };
}

export function fromValidityTimestamp(value: string | null | undefined): string {
  return value ? toDateInput(new Date(value)) : "";
}
