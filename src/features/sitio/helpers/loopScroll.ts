/**
 * Infinite rail math. The rail renders its items three times; `origin` is where
 * the first copy starts and `setWidth` the width of one copy. Keeping the scroll
 * inside the middle copy lets the user swipe forever in either direction.
 */
export function wrapLoopScroll(left: number, origin: number, setWidth: number): number {
  if (setWidth <= 0) return left;
  const offset = left - origin;
  if (offset < setWidth * 0.5) return left + setWidth;
  if (offset >= setWidth * 1.5) return left - setWidth;
  return left;
}

/** Equivalent start so a smooth step of `delta` stays within the three copies; wrapping waits until it ends. */
export function alignLoopScrollForStep(left: number, origin: number, setWidth: number, delta: number): number {
  if (setWidth <= 0) return left;
  const idealStart = origin + setWidth - delta / 2;
  const copies = Math.round((idealStart - left) / setWidth);
  return left + copies * setWidth;
}

/** Scroll offset that centers an item inside the rail viewport. */
export function centeredScrollLeft(itemLeft: number, itemWidth: number, viewportWidth: number): number {
  return Math.max(0, itemLeft - (viewportWidth - itemWidth) / 2);
}
