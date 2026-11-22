import { track } from "@vercel/analytics";

import { getAcquisitionProps } from "@/lib/acquisition";

export type HomeEvent = "home_view" | "home_cta_click" | "home_how_click";

export function trackHomeEvent(name: HomeEvent, props: Record<string, string>): void {
  try {
    track(name, { ...props, ...getAcquisitionProps() });
  } catch {
    /* Analytics must not block the page. */
  }
}
