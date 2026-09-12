/**
 * Shared formatters used across QR customer-facing screens.
 * Keep pure: no React, no side-effects.
 */

export function formatCurrency(value: number): string {
  return `$${Number(value).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
  })}`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * A "tanda" — a batch of items sent to the business in one round. Items whose
 * created_at falls within `windowMs` of the batch's first item belong to the
 * same tanda; a larger gap starts a new one. Mirrors how Uber/Rappi group a
 * running order into rounds so a growing bill reads as a timeline, not one
 * flat list.
 */
export interface ItemBatch<T> {
  /** ISO timestamp of the first item in the batch. */
  at: string | null;
  items: T[];
}

export function groupIntoBatches<T extends { created_at: string | null }>(
  items: T[],
  windowMs = 2 * 60 * 1000,
): ItemBatch<T>[] {
  const withTime = items.filter((i) => i.created_at);
  const withoutTime = items.filter((i) => !i.created_at);

  const sorted = [...withTime].sort(
    (a, b) =>
      new Date(a.created_at as string).getTime() -
      new Date(b.created_at as string).getTime(),
  );

  const batches: ItemBatch<T>[] = [];
  for (const item of sorted) {
    const t = new Date(item.created_at as string).getTime();
    const last = batches[batches.length - 1];
    const lastT = last?.at ? new Date(last.at).getTime() : null;
    if (last && lastT !== null && t - lastT <= windowMs) {
      last.items.push(item);
    } else {
      batches.push({ at: item.created_at, items: [item] });
    }
  }

  // Items without a timestamp (shouldn't normally happen) fall into one bucket.
  if (withoutTime.length > 0) {
    batches.push({ at: null, items: withoutTime });
  }
  return batches;
}

/** "hace un momento" / "hace 5 min" / "14:32" — compact relative time in es-MX. */
export function formatRelativeTime(iso: string | null, nowMs: number): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const diffMin = Math.floor((nowMs - then) / 60000);
  if (diffMin < 1) return "hace un momento";
  if (diffMin < 60) return `hace ${diffMin} min`;
  return new Date(iso).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
