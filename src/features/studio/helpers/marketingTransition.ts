"use client";

import { flushSync } from "react-dom";

let active: ViewTransition | undefined;
let latest = 0;

/** Manual preview changes only; autoplay must not repeatedly transition the page. */
export function studioViewTransition(update: () => void) {
  const revision = ++latest;
  if (
    typeof document === "undefined" ||
    !document.startViewTransition ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    update();
    return;
  }
  // A quick second click should apply normally, not overlap captures or reorder updates.
  if (active) {
    active.skipTransition();
    update();
    return;
  }
  const transition = document.startViewTransition(() => {
    if (revision === latest) flushSync(update);
  });
  active = transition;
  void transition.ready.catch(() => undefined);
  void transition.finished
    .catch(() => undefined)
    .finally(() => {
      if (active === transition) active = undefined;
    });
}
