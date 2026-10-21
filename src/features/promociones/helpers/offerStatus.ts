import type { StatusTone } from "@/components/admin/StatusBadge";

export type OfferDisplayStatus = "active" | "scheduled" | "expired" | "paused" | "draft" | "archived";

/** What the merchant sees: the stored status refined by the validity dates. */
export function offerDisplayStatus(
  offer: { status?: string | null; valid_from?: string | null; valid_until?: string | null },
  now: Date = new Date(),
): OfferDisplayStatus {
  const status = offer.status ?? "active";
  if (status === "draft" || status === "paused" || status === "archived") return status;
  if (offer.valid_until && new Date(offer.valid_until) < now) return "expired";
  if (offer.valid_from && new Date(offer.valid_from) > now) return "scheduled";
  return "active";
}

export const OFFER_STATUS_META: Record<OfferDisplayStatus, { label: string; tone: StatusTone }> = {
  active: { label: "Activa", tone: "success" },
  scheduled: { label: "Programada", tone: "info" },
  expired: { label: "Vencida", tone: "neutral" },
  paused: { label: "Pausada", tone: "warning" },
  draft: { label: "Borrador", tone: "neutral" },
  archived: { label: "Archivada", tone: "neutral" },
};
