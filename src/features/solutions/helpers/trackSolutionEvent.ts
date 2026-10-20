import { track } from "@vercel/analytics";

/** Analytics never blocks an interaction in the solution pages. */
export function trackSolutionEvent(
  name: string,
  properties: Record<string, string | number | boolean>,
): void {
  try {
    track(name, properties);
  } catch {
    /* best-effort */
  }
}
