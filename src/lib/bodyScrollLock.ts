let locks = 0;
let restoreTo = "";

/**
 * Locks page scroll while any sheet, dialog or overlay is open. A shared count
 * means they can open and close in any order; restoring each one's "previous"
 * value left the page stuck without scroll when two overlapped.
 */
export function lockBodyScroll(): () => void {
  if (typeof document === "undefined") return () => {};
  if (locks === 0) {
    const current = document.body.style.overflow;
    // A value left behind by the old per-component locks is not something to restore.
    restoreTo = current === "hidden" ? "" : current;
    document.body.style.overflow = "hidden";
  }
  locks += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks = Math.max(0, locks - 1);
    if (locks === 0) document.body.style.overflow = restoreTo;
  };
}
