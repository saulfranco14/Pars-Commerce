const ALLOWED_MAP_HOSTS = new Set(["www.google.com", "google.com", "maps.google.com"]);

/**
 * Merchants paste Google's "embed a map" snippet. Only the iframe URL is kept,
 * and only for Google Maps, so a pasted <script> never reaches the shopper.
 */
export function extractMapEmbedSrc(snippet: string | null | undefined): string | null {
  if (!snippet) return null;
  const raw = snippet.match(/src\s*=\s*["']([^"']+)["']/i)?.[1] ?? snippet.trim();
  try {
    const url = new URL(raw.replace(/&amp;/g, "&"));
    if (url.protocol !== "https:" || !ALLOWED_MAP_HOSTS.has(url.hostname)) return null;
    if (!url.pathname.startsWith("/maps")) return null;
    return url.toString();
  } catch {
    return null;
  }
}
