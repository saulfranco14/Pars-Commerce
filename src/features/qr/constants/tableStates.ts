export const TABLE_STATES = [
  "free",
  "ordering",
  "pending_payment",
  "partial_payment",
  "paid",
] as const;

export type TableState = (typeof TABLE_STATES)[number];
