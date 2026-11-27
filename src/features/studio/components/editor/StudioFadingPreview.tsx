"use client";
import { useStudioSwapFade } from "../../hooks/useStudioSwapFade";
import { StudioScenePreview } from "./StudioScenePreview";
import { studioPhotoKey } from "../../helpers/sceneStyle";
import type { StudioScenePreviewProps } from "../../interfaces/ui";

/** The preview fades briefly when its photo changes; the canvas stays mounted. */
export function StudioFadingPreview(props: StudioScenePreviewProps) {
  const ref = useStudioSwapFade<HTMLSpanElement>(studioPhotoKey(props.scene));
  return (
    <span ref={ref} className="pointer-events-none block">
      <StudioScenePreview {...props} />
    </span>
  );
}
