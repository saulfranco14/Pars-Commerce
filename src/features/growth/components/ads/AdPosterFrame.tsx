"use client";

import { useElementWidth } from "@/hooks/useElementWidth";
import { AdPoster } from "@/features/growth/components/ads/AdPoster";

import { AD_HEIGHT, AD_WIDTH } from "@/features/growth/constants/prospectAds";
import { formatAdPrice } from "@/features/growth/helpers/prospectAds";
import { studioPosterFont } from "@/features/studio/constants/studioFont";

import type { AdContent } from "@/features/growth/interfaces/prospectAds";

/** The ad at whatever width its box has, drawn with the same markup as the downloaded PNG. */
export function AdPosterFrame({ ad, mark, className = "" }: { ad: AdContent; mark: boolean; className?: string }) {
  const { ref, width } = useElementWidth<HTMLDivElement>();
  return (
    <div
      ref={ref}
      role="img"
      aria-label={[ad.eyebrow, ad.headline, ad.price ? formatAdPrice(ad.price) : null].filter(Boolean).join(", ")}
      className={`relative w-full overflow-hidden ${className}`}
      style={{ aspectRatio: `${AD_WIDTH} / ${AD_HEIGHT}` }}
    >
      {width ? <AdPoster ad={ad} width={width} mark={mark} fontFamily={studioPosterFont.style.fontFamily} /> : null}
    </div>
  );
}
