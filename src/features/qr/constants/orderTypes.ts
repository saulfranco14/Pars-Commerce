export const ORDER_TYPES = ["dine_in", "takeaway", "qr_payment"] as const;

export type OrderType = (typeof ORDER_TYPES)[number];
