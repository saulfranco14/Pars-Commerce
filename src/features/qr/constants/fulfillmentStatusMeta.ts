import type { StatusTone } from "@/components/admin/StatusBadge";

export interface FulfillmentStatusMeta {
  label: string;
  tone: StatusTone;
}

/**
 * Single source of truth for how a fulfillment_status (received |
 * in_progress | ready) renders as a label + StatusBadge tone — used at
 * every level of the cascade (item, device, order, table-list summary).
 */
export const FULFILLMENT_STATUS_META: Record<string, FulfillmentStatusMeta> = {
  received: { label: "Recibido", tone: "neutral" },
  in_progress: { label: "En proceso", tone: "warning" },
  ready: { label: "Listo", tone: "success" },
};

export function getFulfillmentStatusMeta(
  status: string | null | undefined,
): FulfillmentStatusMeta {
  return FULFILLMENT_STATUS_META[status ?? "received"] ?? FULFILLMENT_STATUS_META.received;
}
