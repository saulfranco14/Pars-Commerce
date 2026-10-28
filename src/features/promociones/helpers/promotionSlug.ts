import { slugify } from "@/lib/slugify";

export function slugifyPromotionName(name: string): string {
  return slugify(name).slice(0, 80);
}

/** First free slug given the ones already taken: "pack", "pack-2", "pack-3"… */
export function nextFreeSlug(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  const root = base || "promocion";
  if (!used.has(root)) return root;
  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const candidate = `${root}-${suffix}`;
    if (!used.has(candidate)) return candidate;
  }
  return `${root}-${Date.now()}`;
}
