export function getPeriodDates(period: string): {
  dateFrom: string;
  dateTo: string;
} {
  const to = new Date();
  const toStr = to.toISOString().slice(0, 10);
  if (period === "today") return { dateFrom: toStr, dateTo: toStr };
  const from = new Date();
  if (period === "week") from.setDate(from.getDate() - 7);
  else if (period === "fortnight") from.setDate(from.getDate() - 15);
  else from.setDate(from.getDate() - 30);
  return { dateFrom: from.toISOString().slice(0, 10), dateTo: toStr };
}
