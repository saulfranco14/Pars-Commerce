export function studioNextPeriodEnd(
  startsAt: string,
  anchorDate?: string,
  nextPaymentDate?: string,
): string {
  const start = new Date(startsAt),
    providerNext = nextPaymentDate ? new Date(nextPaymentDate) : null;
  if (!Number.isFinite(start.getTime()))
    throw new Error("Invalid billing period");
  if (
    providerNext &&
    providerNext > start &&
    providerNext.getTime() - start.getTime() <= 35 * 86400_000
  )
    return providerNext.toISOString();
  const anchor = anchorDate ? new Date(anchorDate) : start,
    day = Number.isFinite(anchor.getTime())
      ? anchor.getUTCDate()
      : start.getUTCDate();
  const next = new Date(start);
  next.setUTCDate(1);
  next.setUTCMonth(next.getUTCMonth() + 1);
  const last = new Date(
    Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0),
  ).getUTCDate();
  next.setUTCDate(Math.min(day, last));
  return next.toISOString();
}
