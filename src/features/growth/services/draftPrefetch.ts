import { createWhatsappDraft } from "@/features/growth/services/growthClient";

import type { WhatsappDraft } from "@/features/growth/interfaces/whatsapp";

const pending = new Map<string, Promise<WhatsappDraft>>();

/** Builds the next card's message while the operator works the current one, so it opens at once. */
export function prefetchWhatsappDraft(leadId: string): void {
  if (pending.has(leadId)) return;
  const request = createWhatsappDraft(leadId, {});
  request.catch(() => pending.delete(leadId));
  pending.set(leadId, request);
}

/** The prefetched draft, used once; null when none was started. */
export function takePrefetchedDraft(leadId: string): Promise<WhatsappDraft> | null {
  const request = pending.get(leadId) ?? null;
  pending.delete(leadId);
  return request;
}
