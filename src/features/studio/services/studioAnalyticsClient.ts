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
