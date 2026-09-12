import { Clock, PackageCheck, Receipt, type LucideIcon } from "lucide-react";

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

/**
 * Los tres pasos en orden, con su ícono. Estaba copiado en el seguimiento del
 * cliente y en el del dashboard; el orden y las etiquetas tienen que ser los
 * mismos en los dos o el cliente y el personal leen cosas distintas del mismo
 * pedido. Copy e íconos neutrales: el QR lo usa cualquier rubro.
 */
export const FULFILLMENT_STEPS: {
  status: string;
  label: string;
  icon: LucideIcon;
}[] = [
  { status: "received", label: "Recibido", icon: Receipt },
  { status: "in_progress", label: "En proceso", icon: Clock },
  { status: "ready", label: "Listo", icon: PackageCheck },
];

/** Índice del paso actual. Un valor desconocido cae en el primero. */
export function fulfillmentStepIndex(status: string | null | undefined): number {
  const i = FULFILLMENT_STEPS.findIndex((s) => s.status === status);
  return i < 0 ? 0 : i;
}
