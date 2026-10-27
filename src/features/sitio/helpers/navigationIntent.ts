/**
 * Path + query a click will navigate to inside this app, or null when the click
 * opens elsewhere (new tab, other origin, same page, hash jump) and no feedback should show.
 */
export function internalNavigationTarget(href: string, currentHref: string, opensElsewhere: boolean): string | null {
  if (opensElsewhere || !href) return null;
  let next: URL;
  let current: URL;
  try {
    current = new URL(currentHref);
    next = new URL(href, current);
  } catch {
    return null;
  }
  if (next.origin !== current.origin || !/^https?:$/.test(next.protocol)) return null;
  const target = `${next.pathname}${next.search}`;
  return target === `${current.pathname}${current.search}` ? null : target;
}
