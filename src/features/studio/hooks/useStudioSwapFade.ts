"use client";
import { useEffect, useRef } from "react";

const SWAP_MS = 150;

/** A short fade when the photo changes, without remounting the canvas behind it. */
export function useStudioSwapFade<T extends HTMLElement>(key: string | null) {
  const ref = useRef<T>(null),
    previous = useRef(key);
  useEffect(() => {
    if (previous.current === key) return;
    previous.current = key;
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.animate([{ opacity: 0.55 }, { opacity: 1 }], {
      duration: SWAP_MS,
      easing: "ease-out",
    });
  }, [key]);
  return ref;
}
