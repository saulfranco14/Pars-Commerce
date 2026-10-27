import type { ParaLinkEvent } from "@/features/growth/interfaces/para";

const PROSPECT_KEY = "tlaco_prospect";

/** Beacons survive the page closing, which is when the time-on-page event fires. */
export function sendParaEvent(token: string, event: ParaLinkEvent, seconds?: number): void {
  const url = `/api/growth/para/${encodeURIComponent(token)}/event`;
  const body = JSON.stringify({ event, seconds });
  try {
    if (navigator.sendBeacon?.(url, new Blob([body], { type: "application/json" }))) return;
  } catch {
    // Fall through to fetch.
  }
  void fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => undefined);
}

/** Backup for attribution when the ?prospecto= query gets lost on the way to /registro. */
export function rememberProspect(token: string): void {
  try {
    window.localStorage.setItem(PROSPECT_KEY, JSON.stringify({ token, at: Date.now() }));
  } catch {
    // Private mode: the query string still carries the token.
  }
}

export function recallProspect(maxAgeDays = 30): string | null {
  try {
    const raw = window.localStorage.getItem(PROSPECT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: string; at?: number };
    if (!parsed.token || !parsed.at || Date.now() - parsed.at > maxAgeDays * 86_400_000) return null;
    return parsed.token;
  } catch {
    return null;
  }
}
