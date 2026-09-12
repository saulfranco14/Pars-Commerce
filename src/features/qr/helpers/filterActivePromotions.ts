/**
 * Pure helper: keep only promotions active at a given instant (valid_from ≤ now
 * ≤ valid_until, treating null bounds as open). Same rule the storefront uses
 * (sitio/[slug]/promociones) — centralized here so the QR resolve and any other
 * caller share one implementation. No React, no I/O.
 */

interface DateBounded {
  valid_from?: string | null;
  valid_until?: string | null;
}

export function filterActivePromotions<T extends DateBounded>(
  promotions: T[],
  nowMs: number,
): T[] {
  return promotions.filter((p) => {
    const from = p.valid_from ? new Date(p.valid_from).getTime() : null;
    const until = p.valid_until ? new Date(p.valid_until).getTime() : null;
    if (from !== null && from > nowMs) return false;
    if (until !== null && until < nowMs) return false;
    return true;
  });
}
