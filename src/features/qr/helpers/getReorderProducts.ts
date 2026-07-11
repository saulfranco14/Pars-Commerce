/**
 * Pure helper for the "Vuelve a pedir" rail: from the items a person's table
 * has already sent, resolve the unique menu products (most recently ordered
 * first) so the customer can repeat them in one tap. No React, no side effects.
 */

import type { MenuItem } from "@/features/qr/interfaces/tableCart";

/** Minimal shape of an already-sent item (structural — tracker items match). */
export interface OrderedItemRef {
  product_id: string | null;
}

const DEFAULT_LIMIT = 8;

export function getReorderProducts(
  orderedItems: OrderedItemRef[] | null,
  menu: MenuItem[],
  limit = DEFAULT_LIMIT,
): MenuItem[] {
  if (!orderedItems || orderedItems.length === 0) return [];

  // Walk newest→oldest (items arrive sorted by created_at asc) so the rail
  // leads with what was ordered last.
  const seen = new Set<string>();
  const ids: string[] = [];
  for (let i = orderedItems.length - 1; i >= 0; i--) {
    const pid = orderedItems[i].product_id;
    if (pid && !seen.has(pid)) {
      seen.add(pid);
      ids.push(pid);
    }
  }

  const byId = new Map(menu.map((m) => [m.id, m] as const));
  return ids
    .map((id) => byId.get(id))
    .filter((m): m is MenuItem => !!m)
    .slice(0, limit);
}
