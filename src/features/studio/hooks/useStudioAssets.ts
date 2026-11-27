"use client";
import { useRef, useState } from "react";
import {
  importSourceImage,
  uploadStudioAsset,
} from "../services/studioClientService";
import { prepareStudioPhoto } from "../helpers/canvas";
import { createStudioNode } from "../helpers/scene";
import { arrangeStudioScene } from "../helpers/layout";
import type { StudioAsset, StudioDesignDetail } from "../interfaces/studio";
import type { StudioNode, StudioScene } from "../interfaces/scene";

export function useStudioAssets(
  detail: StudioDesignDetail,
  scene: StudioScene,
  setScene: (scene: StudioScene) => void,
) {
  const [localAssets, setAssets] = useState<StudioAsset[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  const currentScene = useRef(scene);
  currentScene.current = scene;
  const assets = [
    ...detail.assets,
    ...localAssets.filter(
      (asset) => !detail.assets.some((existing) => existing.id === asset.id),
    ),
  ];
  function select(assetId: string, targetId?: string) {
    if (!assets.some((asset) => asset.id === assetId)) return;
    const current = currentScene.current,
      target = current.nodes.find(
        (node) => node.id === targetId && node.kind === "image",
      );
    if (target)
      setScene({
        ...current,
        nodes: current.nodes.map((node) =>
          node.id === target.id
            ? { ...node, assetId, imageUrl: undefined }
            : node,
        ),
      });
    else
      setScene({
        ...current,
        nodes: [
          ...current.nodes,
          { ...createStudioNode("image"), assetId, y: 0.25, height: 0.45 },
        ],
      });
  }
  function register(
    id: string,
    url: string,
    kind: StudioAsset["kind"] = "original",
    extra: Partial<StudioAsset> = {},
  ) {
    setAssets((current) =>
      current.some((a) => a.id === id)
        ? current
        : [
            ...current,
            {
              id,
              design_id: detail.design.id,
              kind,
              status: "ready",
              width: null,
              height: null,
              mime_type: "image/png",
              source_asset_id: null,
              created_at: new Date().toISOString(),
              url,
              ...extra,
            },
          ],
    );
  }
  /** `replace` swaps the ad's current photo or logo instead of adding a new layer. */
  async function upload(
    file: File,
    kind: "image" | "logo" = "image",
    replace = false,
  ): Promise<string | null> {
    setBusy(true);
    setError(null);
    try {
      if (
        file.size > 12 * 1024 * 1024 ||
        !["image/jpeg", "image/png", "image/webp"].includes(file.type)
      )
        throw new Error("Sube JPG, PNG o WebP de hasta 12 MB.");
      const result = await uploadStudioAsset({
        tenantId: detail.design.tenant_id,
        designId: detail.design.id,
        file,
        kind: "original",
      });
      register(result.assetId, result.url);
      if (kind === "image" && replace) {
        const apply = await prepareStudioPhoto(result.assetId, result.url);
        setScene(apply(currentScene.current));
        return result.assetId;
      }
      const node = {
        ...createStudioNode(kind),
        assetId: result.assetId,
        x: kind === "logo" ? 0.75 : 0.08,
        y: kind === "logo" ? 0.03 : 0.25,
        width: kind === "logo" ? 0.16 : 0.84,
        height: kind === "logo" ? 0.12 : 0.45,
      };
      const current = currentScene.current,
        target = replace
          ? current.nodes.find((n) => n.kind === kind)
          : undefined;
      if (target)
        setScene({
          ...current,
          nodes: current.nodes.map((n) =>
            n === target
              ? {
                  ...n,
                  assetId: result.assetId,
                  imageUrl: undefined,
                  cropX: 0.5,
                  cropY: 0.5,
                  cropScale: 1,
                }
              : n,
          ),
        });
      else {
        const next = { ...current, nodes: [...current.nodes, node] };
        setScene(replace ? arrangeStudioScene(next) : next);
      }
      return result.assetId;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No pudimos subir la fotografía.",
      );
      return null;
    } finally {
      setBusy(false);
    }
  }
  async function ensureAsset(node: StudioNode): Promise<string> {
    if (node.assetId) return node.assetId;
    const index = detail.design.source_snapshot.imageUrls.indexOf(
      node.imageUrl ?? "",
    );
    if (index < 0)
      throw new Error("Selecciona una fotografía o sube una imagen.");
    const result = await importSourceImage(
      detail.design.tenant_id,
      detail.design.id,
      index,
    );
    register(result.assetId, result.url);
    return result.assetId;
  }
  return { assets, register, select, upload, ensureAsset, busy, error };
}
