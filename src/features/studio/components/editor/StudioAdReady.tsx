"use client";
import { StudioScenePreview } from "./StudioScenePreview";
import { STUDIO_FORMATS } from "../../constants/studio";
import type { StudioAdReadyProps } from "../../interfaces/ui";

/** Tallest the finished ad gets, as a share of the screen height. */
const MAX_VH = 58;

/** A finished ad on its own, big, ready to go out again. */
export function StudioAdReady({ scene, assets, tenantId }: StudioAdReadyProps) {
  const format = STUDIO_FORMATS[scene.format],
    ratio = format.width / format.height;
  return (
    <div
      className="pointer-events-none mx-auto overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5"
      style={{ width: `min(100%, calc(${MAX_VH}vh * ${ratio}))` }}
    >
      <StudioScenePreview scene={scene} assets={assets} tenantId={tenantId} />
    </div>
  );
}
