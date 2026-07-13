/** Turns a display name into a URL-safe slug: lowercase, spaces to hyphens, strips anything else. */
export function deriveSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}
