import { studioAdStateOf } from "./adState";
import type {
  StudioDesign,
  StudioShelfAd,
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

/**
 * The newest ad of each catalog item and where it stands. Only the newest
 * placement per ad and place counts, the same rule as the stale check.
 */
export function studioShelfAds(
  designs: Array<
    Pick<
      StudioDesign,
      "id" | "source_id" | "status" | "updated_at" | "draft_scene"
    >
  >,
  placements: Array<{
    design_id: string;
    surface: string;
    is_active: boolean;
    disabled_reason: string | null;
    created_at: string;
  }>,
): Map<string, StudioShelfAd> {
  const newest = new Map<string, (typeof placements)[number]>();
  for (const p of [...placements].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  )) {
    const key = `${p.design_id}:${p.surface}`;
    if (!newest.has(key)) newest.set(key, p);
  }
  const live = new Set<string>(),
    updating = new Set<string>();
  for (const p of newest.values()) {
    if (p.is_active) live.add(p.design_id);
    else if (p.disabled_reason === "source_changed") updating.add(p.design_id);
  }
  const ads = new Map<string, StudioShelfAd>();
  for (const design of [...designs].sort((a, b) =>
    b.updated_at.localeCompare(a.updated_at),
  )) {
    if (
      !design.source_id ||
      design.status === "archived" ||
      ads.has(design.source_id)
    )
      continue;
    ads.set(design.source_id, {
      designId: design.id,
      state: studioAdStateOf(design, live, updating),
      scene: design.draft_scene,
    });
  }
  return ads;
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
