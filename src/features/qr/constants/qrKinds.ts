/** Kinds a user can create from the QR config UI. */
export const QR_KINDS = ["payment", "table"] as const;

/**
 * All QR kinds that exist in the DB. `order` is minted by the staff-order flow
 * (single-use ticket), never created from the config UI — so it's not in
 * QR_KINDS but is a valid `kind` value.
 */
export type QrKind = (typeof QR_KINDS)[number] | "order";
