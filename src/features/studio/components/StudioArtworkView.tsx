"use client";
import Image from "next/image";
import type { ReactNode } from "react";
import { useStudioArtwork } from "../hooks/useStudioArtwork";
import type { StudioArtwork } from "../interfaces/studio";
export function StudioArtworkView({
  artwork,
  mode = "campaign",
  fallback = null,
}: {
  artwork: StudioArtwork;
  mode?: "campaign" | "embedded";
  fallback?: ReactNode;
}) {
  const { eligible, failed } = useStudioArtwork(artwork);
  if (!eligible) return fallback;
  const image = (
    <Image
      src={artwork.url}
      alt={artwork.alt}
      width={artwork.width}
      height={artwork.height}
      unoptimized
      onError={failed}
      className="h-auto w-full object-contain"
    />
  );
  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      data-studio-placement={artwork.placementId}
    >
      {artwork.href && mode === "campaign" ? (
        <a
          href={artwork.href}
          className="block focus-visible:ring-2 focus-visible:ring-accent"
        >
          {image}
        </a>
      ) : (
        image
      )}
    </div>
  );
}
