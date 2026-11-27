"use client";
import { useRef } from "react";
import { importSourceImage } from "../services/studioClientService";
import { STUDIO_TEXT_ONLY_DESIGNS } from "../constants/designs";
import { prepareStudioPhoto } from "../helpers/canvas";
import { isStudioDesign } from "../helpers/layout";
import {
  applyStudioDesign,
  setStudioBackdrop,
  studioBackdrop,
} from "../helpers/sceneStyle";
import type { StudioImageTileItem, StudioPhotoInput } from "../interfaces/ui";
import type { StudioDesignId, StudioScene } from "../interfaces/scene";

/**
 * Only this ad's photos: the catalog ones, the merchant's uploads and what the
 * AI made here. A new photo lands together with its colors.
 */
export function useStudioPhotos({
  editor,
  asset,
  tenantId,
  designId,
}: StudioPhotoInput) {
  const scene = editor.scene,
    source = editor.source.current,
    latest = useRef(scene);
  latest.current = scene;
  const urlOf = (id: string) =>
    asset.assets.find((a) => a.id === id)?.url ??
    `/api/studio/assets/${id}/file?tenant_id=${tenantId}`;
  const byNewest = [...asset.assets]
    .filter((a) => a.status === "ready")
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const generated = byNewest.filter((a) => a.kind === "generated"),
    uploads = byNewest.filter((a) => a.kind === "original" && !a.fromCatalog),
    shown = studioBackdrop(scene),
    shownUrl = shown.assetId ? urlOf(shown.assetId) : shown.imageUrl,
    shownIsAi = generated.some((a) => a.id === shown.assetId),
    hasPhoto = Boolean(shownUrl);

  function show(picture: string | { imageUrl: string }, url: string) {
    return prepareStudioPhoto(picture, url).then((apply) =>
      editor.setScene(apply(latest.current)),
    );
  }

  function clear() {
    const now = latest.current,
      bare = setStudioBackdrop(now, null),
      keeps =
        !isStudioDesign(now.template) ||
        STUDIO_TEXT_ONLY_DESIGNS.includes(now.template as StudioDesignId);
    editor.setScene(keeps ? bare : applyStudioDesign(bare, source, "impact"));
  }

  /** The photo the AI starts from: the one on the ad, else the first catalog photo. */
  async function productPhoto(): Promise<string> {
    const current = studioBackdrop(latest.current);
    if (current.assetId && !generated.some((a) => a.id === current.assetId))
      return current.assetId;
    if (uploads[0]) return uploads[0].id;
    const index = Math.max(
      0,
      current.imageUrl ? source.imageUrls.indexOf(current.imageUrl) : 0,
    );
    if (!source.imageUrls[index])
      throw new Error("Toma o sube la foto de tu producto para usar la IA.");
    const imported = await importSourceImage(tenantId, designId, index);
    asset.register(imported.assetId, imported.url, "original", {
      fromCatalog: true,
    });
    return imported.assetId;
  }

  const tiles: StudioImageTileItem[] = [
    ...generated.map((a, i) => ({
      key: a.id,
      label: i === 0 ? "Con IA" : `IA ${generated.length - i}`,
      url: urlOf(a.id),
      badge: "Tuya" as const,
      selected: shown.assetId === a.id,
      onPick: () => void show(a.id, urlOf(a.id)),
    })),
    ...uploads.map((a, i) => ({
      key: a.id,
      label: i === 0 ? "Tu foto" : `Foto ${uploads.length - i}`,
      url: urlOf(a.id),
      selected: shown.assetId === a.id,
      onPick: () => void show(a.id, urlOf(a.id)),
    })),
    ...source.imageUrls.map((url, i) => ({
      key: `catalog-${i}`,
      label: i === 0 ? "Del catálogo" : `Catálogo ${i + 1}`,
      url,
      selected: shown.imageUrl === url,
      onPick: () => void show({ imageUrl: url }, url),
    })),
  ];

  return {
    tiles,
    show,
    clear,
    productPhoto,
    urlOf,
    shown,
    shownUrl,
    shownIsAi,
    hasPhoto,
    generated,
    uploads,
    latest: latest as { current: StudioScene },
  };
}
