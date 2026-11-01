"use client";

import { useCallback, useEffect, useState } from "react";

import { mexicoDayKey } from "@/features/growth/helpers/leadPipeline";

import type { TlacoAiPlacement } from "@/features/growth/interfaces/tlacoAi";

const STORAGE_KEY = "tlaco_ai_card";

/** Where Tlaco IA sits today: its card, only the floating button («Entendido»), or nowhere (✕). A new day brings the card back. */
export function useTlacoAiPlacement() {
  const [placement, setPlacement] = useState<TlacoAiPlacement>("card");

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as { day: string; placement: TlacoAiPlacement } | null;
      if (saved?.day === mexicoDayKey(new Date())) setPlacement(saved.placement);
    } catch {
      // Unreadable storage: the card shows, which is the default anyway.
    }
  }, []);

  const place = useCallback((next: TlacoAiPlacement) => {
    setPlacement(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ day: mexicoDayKey(new Date()), placement: next }));
    } catch {
      // Without storage the choice lasts until the page reloads.
    }
  }, []);

  return { placement, float: () => place("floating"), hide: () => place("hidden") };
}
