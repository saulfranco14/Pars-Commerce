/**
 * What is still owed: total minus what was already paid. Never read `balance_due`
 * for this: some ways of adding products updated the total and left it stale.
 */
export function orderAmountDue(order: { total: number | string | null; paid_total?: number | string | null }): number {
  const owed = Number(order.total ?? 0) - Number(order.paid_total ?? 0);
  return Math.max(0, Math.round(owed * 100) / 100);
}
