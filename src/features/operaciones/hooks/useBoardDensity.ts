"use client";

import { useEffect, useState } from "react";

import type { StationKey } from "@/features/operaciones/constants/stations";

export type BoardDensity = "detailed" | "compact";

/** Per-device, per-station preference: a long queue reads better as one line per order. */
export function useBoardDensity(station: StationKey, fallback: BoardDensity) {
  const storageKey = `tlaco_board_density_${station}`;
  const [density, setDensity] = useState<BoardDensity>(fallback);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      setDensity(stored === "compact" || stored === "detailed" ? stored : fallback);
    } catch {
      setDensity(fallback);
    }
  }, [storageKey, fallback]);

  function toggle() {
    const next: BoardDensity = density === "compact" ? "detailed" : "compact";
    setDensity(next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      /* storage blocked: the choice lasts this visit */
    }
  }

  return { compact: density === "compact", toggle };
}
