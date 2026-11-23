"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStudioContext } from "../components/StudioProvider";
import {
  createDesign,
  generateImage,
  importImage,
  importSourceImage,
  saveDesign,
} from "../services/studioClientService";
import { setStudioBackdrop } from "../helpers/sceneStyle";
import type { StudioImage, StudioSourceType } from "../interfaces/studio";

export type StudioReuseMode = "as_is" | "with_product";

/** Turns one of the business's images into a new ad for another product, promotion or plan. */
export function useStudioReuse() {
  const { tenantId, tenantSlug, refresh } = useStudioContext(),
    router = useRouter(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  async function reuse(
    image: StudioImage,
    target: { type: StudioSourceType; id: string; name: string },
    mode: StudioReuseMode,
  ) {
    setBusy(true);
    setError(null);
    try {
      const design = await createDesign({
        tenant_id: tenantId,
        source_type: target.type,
        source_id: target.id,
        title: target.name,
        idempotency_key: crypto.randomUUID(),
      });
      const scene = await importImage(tenantId, design.id, image.id);
      let picture = scene.assetId;
      if (mode === "with_product") {
        const photo = await importSourceImage(tenantId, design.id, 0);
        const job = await generateImage({
          tenantId,
          designId: design.id,
          assetId: photo.assetId,
          referenceAssetId: scene.assetId,
          operation: "variation",
          quality: "economy",
          scene: "local",
          wish: "",
        });
        if (job.status !== "succeeded" || !job.result_asset_id)
          throw new Error(
            "No pudimos poner tu producto en esa escena. No se cobró; usa la imagen tal cual o intenta de nuevo.",
          );
        picture = job.result_asset_id;
      }
      await saveDesign(design.id, {
        tenant_id: tenantId,
        revision: design.revision,
        scene: setStudioBackdrop(design.draft_scene, picture),
        title: design.title,
        copy: design.copy,
        destination_url: design.destination_url,
      });
      await refresh();
      router.push(`/dashboard/${tenantSlug}/studio/disenos/${design.id}`);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No pudimos usar esta imagen ahora.",
      );
      setBusy(false);
    }
  }
  return { reuse, busy, error };
}
