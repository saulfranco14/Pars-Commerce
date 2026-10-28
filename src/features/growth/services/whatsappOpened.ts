const KEY = "tlaco_growth_wa_opened";
const TTL_MS = 2 * 3_600_000;

/** Phones often reload the tab after WhatsApp; this lets the card still ask "¿Cómo te fue?". */
export function rememberWhatsappOpened(leadId: string): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ leadId, at: Date.now() }));
  } catch {
    /* storage blocked: the operator just taps "Abrir WhatsApp" again */
  }
}

export function wasWhatsappOpened(leadId: string): boolean {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as { leadId?: string; at?: number } | null;
    return saved?.leadId === leadId && Date.now() - (saved.at ?? 0) < TTL_MS;
  } catch {
    return false;
  }
}

export function forgetWhatsappOpened(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to clean */
  }
}
