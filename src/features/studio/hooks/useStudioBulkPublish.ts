"use client";
import { useState } from "react";
import { useStudioContext } from "../components/StudioProvider";
import {
  applyPlacements,
  createVersion,
  loadDesign,
  uploadStudioAsset,
} from "../services/studioClientService";
import { trackStudioFunnel } from "../services/studioAnalyticsClient";
import { exportStudioScene } from "../helpers/canvas";
import { reflowStudioScene } from "../helpers/scene";
import type { StudioDesign } from "../interfaces/studio";

const SURFACE = "product_campaign" as const;

/**
 * Puts finished product ads in the store in one go, after the merchant sees
 * the list: each one is drawn square for its product and published there.
 */
export function useStudioBulkPublish(onDone: () => void) {
  const { tenantId } = useStudioContext(),
    [progress, setProgress] = useState<{ done: number; total: number } | null>(
      null,
    ),
    [error, setError] = useState<string | null>(null);

  async function publishOne(design: StudioDesign) {
    const detail = await loadDesign(tenantId, design.id),
      version = await createVersion(
        tenantId,
        design.id,
        detail.design.revision,
      );
    if (version.is_preparation) return false;
    const scene = reflowStudioScene(version.scene_json, "square"),
      blob = await exportStudioScene(scene, detail.assets, tenantId),
      render = await uploadStudioAsset({
        tenantId,
        designId: design.id,
        file: blob,
        kind: "render",
        versionId: version.id,
        surface: SURFACE,
        format: "square",
      });
    if (!render.renderId) return false;
    const result = await applyPlacements({
      tenant_id: tenantId,
      idempotency_key: crypto.randomUUID(),
      version_id: version.id,
      title: design.title,
      alt_text: design.title,
      destination_url: detail.design.destination_url,
      starts_at: new Date().toISOString(),
      ends_at: null,
      targets: [{ surface: SURFACE, render_id: render.renderId }],
    });
    return result.results.every((r) => r.ok);
  }

  async function publish(designs: StudioDesign[]) {
    setError(null);
    setProgress({ done: 0, total: designs.length });
    let failed = 0;
    for (const [i, design] of designs.entries()) {
      try {
        if (!(await publishOne(design))) failed++;
      } catch {
        failed++;
      }
      setProgress({ done: i + 1, total: designs.length });
    }
    trackStudioFunnel("studio_shared", {
      channel: "store_bulk",
      count: designs.length - failed,
    });
    if (failed)
      setError(
        failed === 1
          ? "Uno no se pudo publicar. Ábrelo y publícalo desde Compartir."
          : `${failed} no se pudieron publicar. Ábrelos y publícalos desde Compartir.`,
      );
    setProgress(null);
    onDone();
  }

  return { publish, progress, error, clearError: () => setError(null) };
}
