import { slugify } from "@/lib/slugify";

const SLUG_MAX = 32;

/** Readable part of a «Para ti» link: the business name, cut at a word. */
export function leadLinkSlug(businessName: string): string {
  const slug = slugify(businessName);
  if (slug.length <= SLUG_MAX) return slug;
  const cut = slug.slice(0, SLUG_MAX);
  return cut.slice(0, cut.lastIndexOf("-") > SLUG_MAX / 2 ? cut.lastIndexOf("-") : SLUG_MAX).replace(/-+$/, "");
}

/** Old links are 43 random characters; new ones are `{slug}-{12 random}`. Both are hashed whole. */
export function isLeadLinkToken(token: string): boolean {
  return token.length >= 12 && token.length <= 100 && /^[A-Za-z0-9_-]+$/.test(token);
}
