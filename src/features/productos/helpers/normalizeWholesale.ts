const hasWholesaleField = (v: unknown) =>
  v !== undefined && v !== null && v !== "";

/**
 * Mayoreo is optional: incomplete pairs are dropped instead of blocking save.
 * Wholesale pricing applies only when both min quantity and unit price are set.
 */
export function normalizeWholesaleForProduct(
  wholesale_min_quantity?: number | null,
  wholesale_price?: number | null,
): {
  wholesale_min_quantity: number | null;
  wholesale_price: number | null;
} {
  const hasMin = hasWholesaleField(wholesale_min_quantity);
  const hasPrice = hasWholesaleField(wholesale_price);

  if (!hasMin || !hasPrice) {
    return { wholesale_min_quantity: null, wholesale_price: null };
  }

  const wmq = Math.floor(Number(wholesale_min_quantity));
  const wp = Number(wholesale_price);

  if (Number.isNaN(wmq) || wmq < 1 || Number.isNaN(wp) || wp < 0) {
    return { wholesale_min_quantity: null, wholesale_price: null };
  }

  return { wholesale_min_quantity: wmq, wholesale_price: wp };
}
