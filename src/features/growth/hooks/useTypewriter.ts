"use client";

import { useEffect, useState } from "react";

const STEP = 4;
const TICK_MS = 18;
// Text already typed once in this tab shows whole when the card mounts again.
const revealed = new Set<string>();

/** Reveals freshly written AI text a few letters at a time; saved text and reduced motion show it whole. */
export function useTypewriter(text: string, animate: boolean): { shown: string; done: boolean } {
  const [length, setLength] = useState(text.length);

  useEffect(() => {
    if (!animate || revealed.has(text) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLength(text.length);
      return;
    }
    setLength(0);
    const timer = window.setInterval(() => {
      setLength((current) => {
        if (current + STEP < text.length) return current + STEP;
        window.clearInterval(timer);
        revealed.add(text);
        return text.length;
      });
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [text, animate]);

  return { shown: text.slice(0, length), done: length >= text.length };
}
