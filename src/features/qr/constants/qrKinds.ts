export const QR_KINDS = ["payment", "table"] as const;

export type QrKind = (typeof QR_KINDS)[number];
