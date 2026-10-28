import type { MouseEvent } from "react";

/** Phones open wa.me in the same tab: a new tab is where the operator would land coming back from WhatsApp. */
export function sameTabOnPhones(event: MouseEvent<HTMLAnchorElement>): void {
  if (!window.matchMedia("(pointer: coarse)").matches) return;
  event.preventDefault();
  window.location.href = event.currentTarget.href;
}
