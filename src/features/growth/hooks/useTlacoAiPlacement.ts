"use client";

import { useCallback, useEffect, useState } from "react";

import { mexicoDayKey } from "@/features/growth/helpers/leadPipeline";

import type { TlacoAiPlacement } from "@/features/growth/interfaces/tlacoAi";

const STORAGE_KEY = "tlaco_ai_card";

/** Where Tlaco IA sits today: its card, or only the floating button once closed. A new day brings the card back. */
export function useTlacoAiPlacement() {
  const [placement, setPlacement] = useState<TlacoAiPlacement>("card");

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as { day: string; placement: string } | null;
      // Any closed state, including the old «hidden», now means floating.
      if (saved?.day === mexicoDayKey(new Date()) && saved.placement !== "card") setPlacement("floating");
    } catch {
      // Unreadable storage: the card shows, which is the default anyway.
    }
  }, []);

  const float = useCallback(() => {
    setPlacement("floating");
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ day: mexicoDayKey(new Date()), placement: "floating" }));
    } catch {
      // Without storage the choice lasts until the page reloads.
    }
  }, []);

  return { placement, float };
}
