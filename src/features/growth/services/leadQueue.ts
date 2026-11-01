import type { LeadQueue, LeadQueueItem } from "@/features/growth/interfaces/leadQueue";

const KEY = "tlaco_growth_queue";
const MAX_ITEMS = 300;

/** «Empezar»: the list being worked, so each prospect page can offer «Siguiente» without going back. */
export function startQueue(label: string, items: LeadQueueItem[]): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ label, items: items.slice(0, MAX_ITEMS) }));
  } catch {
    // Storage blocked: the prospect page just has no «Siguiente».
  }
}

export function readQueue(): LeadQueue | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) ?? "null") as LeadQueue | null;
    return saved && Array.isArray(saved.items) ? saved : null;
  } catch {
    return null;
  }
}

export function endQueue(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Nothing to clean.
  }
}
