"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "tlaco_board_density";

export type BoardDensity = "detailed" | "compact";

/** Per-device preference: a long queue reads better as one line per order. */
export function useBoardDensity() {
  const [density, setDensity] = useState<BoardDensity>("detailed");

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "compact") setDensity("compact");
    } catch {
      /* storage blocked: keep the default */
    }
  }, []);

  function toggle() {
    const next: BoardDensity = density === "compact" ? "detailed" : "compact";
    setDensity(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage blocked: the choice lasts this visit */
    }
  }

  return { compact: density === "compact", toggle };
}
