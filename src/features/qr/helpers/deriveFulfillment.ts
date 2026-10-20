import type { FulfillmentStatus } from "@/features/qr/services/tableFulfillmentService";

/** Order summary from its product lines: all ready → ready, any started → in progress. */
export function deriveFulfillment(lineStatuses: readonly string[]): FulfillmentStatus | null {
  if (lineStatuses.length === 0) return null;
  if (lineStatuses.every((s) => s === "ready")) return "ready";
  if (lineStatuses.some((s) => s === "in_progress" || s === "ready")) return "in_progress";
  return "received";
}
