import { track } from "@vercel/analytics";
import { getAcquisitionProps } from "@/lib/acquisition";

export function trackStudioEvent(
  event: string,
  properties: Record<string, string | number | boolean> = {},
): void {
  try {
    track(event, { ...getAcquisitionProps(), ...properties });
  } catch {
    /* Analytics must never interrupt a design or a payment. */
  }
}

/** Steps of the short path, so we see where people leave before redesigning again. */
export type StudioFunnelEvent =
  | "studio_create"
  | "studio_ad_ready"
  | "studio_ai_image_ready"
  | "studio_ai_image_undone"
  | "studio_change_opened"
  | "studio_design_changed"
  | "studio_photo_changed"
  | "studio_phrase_changed"
  | "studio_share_opened"
  | "studio_shared"
  | "studio_gap_answered";

export function trackStudioFunnel(
  event: StudioFunnelEvent,
  properties: Record<string, string | number | boolean> = {},
): void {
  trackStudioEvent(event, properties);
}
