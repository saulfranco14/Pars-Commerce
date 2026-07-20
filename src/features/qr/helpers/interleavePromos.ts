/**
 * Pure helper: interleave promo banners between menu products (Rappi pattern).
 *
 * Placement is pseudo-random but STABLE — derived from each promo's id, never
 * Math.random — so banners don't jump position on re-render. At most one banner
 * per `gap` products, and every promo is placed once (extra promos beyond the
 * available slots are dropped rather than clustered).
 *
 * Returns a flat list of tagged entries the renderer maps over. Generic over
 * the product type so it works for both grouped sections and the flat search
 * list. No React.
 */

interface HasId {
  id: string;
}

export type InterleavedEntry<P, B> =
  | { kind: "product"; item: P }
  | { kind: "promo"; item: B };

/** Small deterministic hash of a string → non-negative int. */
function seedFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function interleavePromos<P, B extends HasId>(
  products: P[],
  promos: B[],
  gap = 4,
): InterleavedEntry<P, B>[] {
  if (promos.length === 0 || products.length === 0) {
    return products.map((item) => ({ kind: "product", item }));
  }

  // Each promo claims a slot index within the product list, stable per id.
  // A slot is the position AFTER which the banner appears. Spread them out on
  // a `gap` grid and resolve collisions by nudging forward.
  const slotCount = Math.floor(products.length / gap);
  if (slotCount === 0) {
    // Very short menu: one banner at the end.
    return [
      ...products.map<InterleavedEntry<P, B>>((item) => ({
        kind: "product",
        item,
      })),
      { kind: "promo", item: promos[0] },
    ];
  }

  const usedSlots = new Set<number>();
  const promoBySlot = new Map<number, B>();
  for (const promo of promos) {
    let slot = seedFromId(promo.id) % slotCount;
    while (usedSlots.has(slot) && usedSlots.size < slotCount) {
      slot = (slot + 1) % slotCount;
    }
    if (usedSlots.has(slot)) break; // all slots full → drop extras
    usedSlots.add(slot);
    promoBySlot.set(slot, promo);
  }

  const out: InterleavedEntry<P, B>[] = [];
  products.forEach((item, i) => {
    out.push({ kind: "product", item });
    // A banner sits after the last product of its slot's window.
    const slot = Math.floor(i / gap);
    const isSlotBoundary = (i + 1) % gap === 0;
    if (isSlotBoundary && promoBySlot.has(slot)) {
      out.push({ kind: "promo", item: promoBySlot.get(slot)! });
    }
  });
  return out;
}
