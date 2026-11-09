"use client";
import { useEffect, useState } from "react";
import { publicArtworkEligible } from "../services/studioPublicClient";
import type { StudioArtwork } from "../interfaces/studio";
export function useStudioArtwork(artwork: StudioArtwork) {
  const [eligible, setEligible] = useState(true);
  useEffect(() => {
    let cancelled = false;
    setEligible(!artwork.expiresAt || new Date(artwork.expiresAt) > new Date());
    async function check() {
      if (artwork.expiresAt && new Date(artwork.expiresAt) <= new Date()) {
        setEligible(false);
        return;
      }
      const result = await publicArtworkEligible(artwork.url);
      if (!cancelled) setEligible(result);
    }
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void check();
    }, 30_000);
    const expiry = artwork.expiresAt
      ? setTimeout(
          () => void check(),
          Math.min(
            2_147_483_647,
            Math.max(0, new Date(artwork.expiresAt).getTime() - Date.now()),
          ),
        )
      : undefined;
    const visible = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      cancelled = true;
      clearInterval(timer);
      if (expiry) clearTimeout(expiry);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [artwork.url, artwork.expiresAt]);
  return { eligible, failed: () => setEligible(false) };
}
