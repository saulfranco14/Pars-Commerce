export const DATE_MIN = "2026-01-01";

export function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function clampDate(value: string): string {
  if (!value) return value;
  const today = getTodayStr();
  if (value < DATE_MIN) return DATE_MIN;
  if (value > today) return today;
  return value;
}
