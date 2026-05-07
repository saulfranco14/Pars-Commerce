export function frequencyToDate(
  baseDate: Date,
  step: number,
  type: "weeks" | "months",
): Date {
  const next = new Date(baseDate);
  if (type === "weeks") {
    next.setDate(next.getDate() + step * 7);
    return next;
  }
  next.setMonth(next.getMonth() + step);
  return next;
}
