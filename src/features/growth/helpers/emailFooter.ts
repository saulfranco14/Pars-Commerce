/** Fixed footer the owner can't edit away: opt-out link, postal address and privacy notice. */
export function emailFooter(input: { unsubscribeUrl: string; postalAddress: string | null; privacyUrl: string }): string {
  const address = input.postalAddress?.trim() ? ` · ${input.postalAddress.trim()}` : "";
  return [
    "",
    "—",
    `Si ya no desea recibir estos correos: ${input.unsubscribeUrl}`,
    `Tlaco${address} · Aviso de privacidad: ${input.privacyUrl}`,
  ].join("\n");
}

/** Gmail only stacks a follow-up in the thread when its subject is «Re:» + the first one. */
export function replySubject(firstSubject: string): string {
  return /^re:/i.test(firstSubject.trim()) ? firstSubject.trim() : `Re: ${firstSubject.trim()}`;
}

/** Days to wait after each step: d0 → d3 → d7 → final no-answer check. */
export const EMAIL_STEP_GAPS_DAYS = [3, 4, 4];
export const EMAIL_STEPS = ["d0", "d3", "d7"] as const;
