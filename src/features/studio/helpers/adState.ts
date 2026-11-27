import { STUDIO_SHARE_MAX } from "../constants/studio";
import type { StudioAdStatus } from "../constants/studio";
import type {
  StudioDesign,
  StudioDesignDetail,
  StudioVersion,
} from "../interfaces/studio";

/**
 * The saved version that still matches the ad as it is: nothing was edited
 * after it and the product did not change. Its stored image can be shared
 * again without drawing or uploading anything.
 */
export function reusableStudioVersion(
  detail: Pick<StudioDesignDetail, "design" | "versions" | "stale">,
): StudioVersion | null {
  const { design } = detail;
  if (detail.stale || design.status !== "ready" || !design.active_version_id)
    return null;
  const version = detail.versions.find(
    (v) => v.id === design.active_version_id,
  );
  if (!version || version.source_hash !== design.source_hash) return null;
  return new Date(version.created_at) >= new Date(design.updated_at)
    ? version
    : null;
}

/** «hoy», «ayer», «hace 3 días»: when the ad last went out. */
export function studioSharedAgo(iso: string, now = new Date()): string {
  const day = (d: Date) =>
      Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000,
    days = Math.round(day(now) - day(new Date(iso)));
  if (days <= 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 30) return `hace ${days} días`;
  const months = Math.round(days / 30);
  return months === 1 ? "hace un mes" : `hace ${months} meses`;
}

/** Where an ad stands for the merchant: live, ready, unfinished or being redrawn. */
export function studioAdStateOf(
  design: Pick<StudioDesign, "id" | "status">,
  live: ReadonlySet<string>,
  updating: ReadonlySet<string>,
): StudioAdStatus {
  if (updating.has(design.id)) return "updating";
  if (live.has(design.id)) return "live";
  return design.status === "ready" ? "ready" : "unfinished";
}

/** A draft or an ad with an old price never goes out in a group share. */
export const canShareStudioAd = (state: StudioAdStatus) =>
  state === "live" || state === "ready";

/** Adds or removes an ad from a group share, up to the share limit. */
export function toggleStudioPick(
  picked: readonly string[],
  id: string,
  max = STUDIO_SHARE_MAX,
): string[] {
  if (picked.includes(id)) return picked.filter((p) => p !== id);
  return picked.length >= max ? [...picked] : [...picked, id];
}

/** The one message that goes with a group share. */
export function studioGroupMessage(names: string[], storeUrl: string): string {
  const list =
    names.length <= 1
      ? (names[0] ?? "")
      : `${names.slice(0, -1).join(", ")} y ${names.at(-1)}`;
  return [list && `${list}.`, storeUrl && `Pide en ${storeUrl}`]
    .filter(Boolean)
    .join(" ");
}
