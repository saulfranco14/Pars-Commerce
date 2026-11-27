import { mutate } from "swr";
import { exportStudioScene } from "../helpers/canvas";
import { reflowStudioScene } from "../helpers/scene";
import { STUDIO_SURFACES } from "../constants/studio";
import {
  applyPlacements,
  createVersion,
  loadDesign,
  loadStaleAds,
  saveDesign,
  uploadStudioAsset,
} from "./studioClientService";
import type { StudioSurface } from "../interfaces/studio";

/** How often the dashboard asks whether a published ad needs drawing again. */
const CHECK_EVERY_MS = 60_000;
const running = new Map<string, Promise<boolean>>(),
  lastCheck = new Map<string, number>(),
  blocked = new Set<string>(),
  /* Ads that could not be redrawn (no catalog permission, an expired promotion) wait for a reload. */
  gaveUp = new Set<string>();

/**
 * Takes the product's new name and price into the ad, keeping its image, and
 * publishes it again where it was. A new image only comes from the merchant
 * asking the AI again. Several callers for one ad share the same run.
 */
export function refreshStudioAd(
  tenantId: string,
  designId: string,
  surfaces: StudioSurface[],
): Promise<boolean> {
  const current = running.get(designId);
  if (current) return current;
  const task = redraw(tenantId, designId, surfaces).finally(() =>
    running.delete(designId),
  );
  running.set(designId, task);
  return task;
}

export const isStudioAdRefreshing = (designId: string) =>
  running.has(designId);

async function redraw(
  tenantId: string,
  designId: string,
  surfaces: StudioSurface[],
): Promise<boolean> {
  const detail = await loadDesign(tenantId, designId);
  let design = detail.design;
  if (detail.stale) {
    if (!detail.source) return false;
    design = await saveDesign(designId, {
      tenant_id: tenantId,
      revision: design.revision,
      scene: design.draft_scene,
      title: design.title,
      copy: design.copy,
      destination_url: design.destination_url,
      refresh_source: true,
    });
  }
  if (!surfaces.length || design.status === "archived") return true;
  const version = await createVersion(tenantId, designId, design.revision);
  if (version.is_preparation) return false;
  // Making the version can import the catalog photo as a new asset.
  const { assets } = await loadDesign(tenantId, designId),
    targets: Array<{ surface: StudioSurface; render_id: string }> = [];
  for (const surface of surfaces) {
    const scene = reflowStudioScene(
        version.scene_json,
        STUDIO_SURFACES[surface].format,
      ),
      blob = await exportStudioScene(scene, assets, tenantId),
      stored = await uploadStudioAsset({
        tenantId,
        designId,
        file: blob,
        kind: "render",
        versionId: version.id,
        surface,
        format: scene.format,
      });
    if (stored.renderId)
      targets.push({ surface, render_id: stored.renderId });
  }
  if (!targets.length) return false;
  const result = await applyPlacements({
    tenant_id: tenantId,
    idempotency_key: crypto.randomUUID(),
    version_id: version.id,
    title: design.title,
    alt_text: design.title,
    destination_url: design.destination_url,
    starts_at: new Date().toISOString(),
    ends_at: null,
    targets,
  });
  return result.results.some((r) => r.ok);
}

/** Refreshes the Studio lists that show where each ad is. */
export function revalidateStudioAds(tenantId: string) {
  void mutate(
    (key) =>
      Array.isArray(key) &&
      key[1] === tenantId &&
      ["studio-placements", "studio-stale", "studio-library"].includes(
        key[0] as string,
      ),
  );
}

/**
 * Redraws every published ad whose product changed. Runs from the dashboard at
 * most once a minute; `skip` is the ad open on screen, which its editor handles.
 */
export async function refreshStaleStudioAds(
  tenantId: string,
  skip?: string,
): Promise<number> {
  const now = Date.now();
  if (blocked.has(tenantId) || now - (lastCheck.get(tenantId) ?? 0) < CHECK_EVERY_MS)
    return 0;
  lastCheck.set(tenantId, now);
  let stale: Awaited<ReturnType<typeof loadStaleAds>>;
  try {
    stale = await loadStaleAds(tenantId);
  } catch {
    // Without Studio or without permission to publish there is nothing to keep fresh.
    blocked.add(tenantId);
    return 0;
  }
  let done = 0;
  for (const ad of stale) {
    if (ad.design_id === skip || gaveUp.has(ad.design_id)) continue;
    try {
      if (await refreshStudioAd(tenantId, ad.design_id, ad.surfaces)) done++;
      else gaveUp.add(ad.design_id);
    } catch (error) {
      gaveUp.add(ad.design_id);
      console.error("[studio] ad refresh failed", {
        designId: ad.design_id,
        message: error instanceof Error ? error.message : "unknown",
      });
    }
  }
  if (done) revalidateStudioAds(tenantId);
  return done;
}
