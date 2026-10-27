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

/** Copy of `target` closest to where the rail already is, so a smooth recenter travels the short way. */
export function nearestLoopPosition(target: number, current: number, setWidth: number, maxLeft: number): number {
  if (setWidth <= 0) return target;
  const candidates = [target - setWidth, target, target + setWidth].filter((left) => left >= 0 && left <= maxLeft);
  if (candidates.length === 0) return Math.min(Math.max(target, 0), maxLeft);
  return candidates.reduce((best, left) => (Math.abs(left - current) < Math.abs(best - current) ? left : best));
}
