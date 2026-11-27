"use client";
import { useEffect, useRef, useState } from "react";
import { exportStudioScene } from "../helpers/canvas";
import { reflowStudioScene } from "../helpers/scene";
import type { StudioPreparedOutput } from "./useStudioOutput";
import type { StudioFormat } from "../interfaces/scene";
import type { StudioAsset } from "../interfaces/studio";

/**
 * Other sizes of the prepared ad, drawn on this device and kept per version:
 * the 9:16 for Estado is drawn as soon as the share sheet opens.
 */
export function useStudioSizes(
  image: StudioPreparedOutput | null,
  assets: StudioAsset[],
  tenantId: string,
  open: boolean,
) {
  const cache = useRef(new Map<string, Promise<Blob>>()),
    [story, setStory] = useState<Blob | null>(null);

  function render(format: StudioFormat): Promise<Blob> {
    if (!image)
      return Promise.reject(new Error("Tu imagen todavía no está lista."));
    if (format === image.scene.format) return Promise.resolve(image.blob);
    const key = `${image.version.id}:${format}`,
      cached = cache.current.get(key);
    if (cached) return cached;
    const task = exportStudioScene(
      reflowStudioScene(image.scene, format),
      assets,
      tenantId,
      image.version.is_preparation,
    );
    cache.current.set(key, task);
    task.catch(() => cache.current.delete(key));
    return task;
  }

  const versionId = image?.version.id ?? null;
  useEffect(() => {
    setStory(null);
    if (!open || !versionId) return;
    let active = true;
    void render("story")
      .then((blob) => active && setStory(blob))
      .catch(() => {});
    return () => {
      active = false;
    };
    // Draws the Estado size once per prepared version while the sheet is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, versionId]);

  return { render, story };
}
