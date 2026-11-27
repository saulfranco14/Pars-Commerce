import type {
  StudioShelfGap,
  StudioShelfItem,
  StudioSource,
} from "../interfaces/studio";

export function studioShelfGaps(item: {
  imageUrl: string | null;
  priceLabel: string;
  description: string | null;
  /** Promotions and plans already say what they include through their items. */
  hasItems?: boolean;
}): StudioShelfGap[] {
  const gaps: StudioShelfGap[] = [];
  if (!item.imageUrl) gaps.push("photo");
  if (!item.priceLabel) gaps.push("price");
  if (!item.description?.trim() && !item.hasItems) gaps.push("description");
  return gaps;
}

/** Complete items first, so the merchant starts with the ones that come out best. */
export function sortStudioShelf(items: StudioShelfItem[]): StudioShelfItem[] {
  return [...items].sort(
    (a, b) =>
      Number(a.state !== "active") - Number(b.state !== "active") ||
      a.gaps.length - b.gaps.length ||
      a.name.localeCompare(b.name, "es"),
  );
}

/** Same rule the server uses for a draft version: not active, not started or already over. */
export function studioSourceIsDraft(
  source: Pick<StudioSource, "type" | "status" | "validFrom" | "validUntil">,
  now: Date = new Date(),
): boolean {
  if (source.type === "custom") return false;
  return (
    source.status !== "active" ||
    (source.validFrom !== null && new Date(source.validFrom) > now) ||
    (source.validUntil !== null && new Date(source.validUntil) <= now)
  );
}
