"use client";
import { useEffect, useState } from "react";

/** Natural size of the photo on the ad, to warn when it is too small to look sharp. */
export function useStudioImageSize(url: string | null) {
  const [size, setSize] = useState<{
    url: string;
    width: number;
    height: number;
  } | null>(null);
  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    const image = new window.Image();
    image.onload = () => {
      if (!cancelled)
        setSize({
          url,
          width: image.naturalWidth,
          height: image.naturalHeight,
        });
    };
    image.src = url;
    return () => {
      cancelled = true;
    };
  }, [url]);
  return size && size.url === url ? size : null;
}
