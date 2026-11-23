"use client";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/Skeleton";
import type { StudioScenePreviewProps } from "../../interfaces/ui";

const StudioCanvas = dynamic(() => import("./StudioCanvas"), {
  ssr: false,
  loading: () => <Skeleton className="aspect-square w-full rounded-lg" />,
});
const noop = () => {};

export function StudioScenePreview({
  scene,
  assets,
  tenantId,
}: StudioScenePreviewProps) {
  return (
    <StudioCanvas
      preview
      readOnly
      scene={scene}
      selectedId={null}
      assets={assets}
      tenantId={tenantId}
      onSelect={noop}
      onChange={noop}
    />
  );
}
