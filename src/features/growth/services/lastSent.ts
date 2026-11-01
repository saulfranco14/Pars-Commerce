import type { LastSent } from "@/features/growth/interfaces/sweep";

const KEY = "tlaco_growth_last_sent";
const TTL_MS = 30 * 60_000;

/** Phones reload the tab after WhatsApp; this keeps «¿No se envió?» available for the last send. */
export function rememberLastSent(sent: LastSent): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...sent, at: Date.now() }));
  } catch {
    // Storage blocked: the correction is only offered until the page reloads.
  }
}

export function readLastSent(): LastSent | null {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as (LastSent & { at?: number }) | null;
    return saved?.leadId && Date.now() - (saved.at ?? 0) < TTL_MS ? { leadId: saved.leadId, name: saved.name } : null;
  } catch {
    return null;
  }
}

export function forgetLastSent(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to clean.
  }
}
