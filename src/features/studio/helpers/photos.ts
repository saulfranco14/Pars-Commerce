function isOwnPhoto(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    return !new URL(url, "https://tlaco.app").pathname.startsWith("/catalog/");
  } catch {
    return false;
  }
}

/**
 * Starter-catalog pictures are shared category icons, not the product, so
 * Studio treats them as no photo. `fallback` is used only when `urls` has none.
 */
export function studioOwnPhotos(
  urls: (string | null | undefined)[],
  fallback: (string | null | undefined)[] = [],
): string[] {
  const own = urls.filter(isOwnPhoto);
  return own.length ? own : fallback.filter(isOwnPhoto);
}
