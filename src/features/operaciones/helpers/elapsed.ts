// Past these minutes a card turns amber, then red: the queue is falling behind.
export const LATE_AFTER_MIN = 10;
export const VERY_LATE_AFTER_MIN = 20;

export function minutesSince(iso: string, now: number): number {
  return Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60_000));
}

export function elapsedLabel(minutes: number): string {
  if (minutes < 1) return "Ahora";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours} h ${minutes % 60} min`;
}

export function elapsedTone(minutes: number): "neutral" | "warning" | "danger" {
  if (minutes >= VERY_LATE_AFTER_MIN) return "danger";
  if (minutes >= LATE_AFTER_MIN) return "warning";
  return "neutral";
}
