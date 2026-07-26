"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STEP_MS = 4200;

interface UseMesasDemoOptions {
  /** Total number of steps in the demo. */
  count: number;
}

interface UseMesasDemoResult {
  index: number;
  /** True while the demo is advancing on its own. */
  playing: boolean;
  /** Attach to the section so autoplay only runs while it is on screen. */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Advance one step (wraps). Stops autoplay — the visitor is driving now. */
  next: () => void;
  /** Jump to a specific step. Stops autoplay. */
  goTo: (i: number) => void;
  /** Back to step 0 and resume autoplay. */
  restart: () => void;
}

/**
 * Drives the interactive mesas demo. Autoplays so the value is visible without
 * any interaction, then hands control over permanently the moment the visitor
 * taps — nothing is worse than a carousel that yanks the screen away mid-read.
 *
 * Autoplay is suppressed when the section is off screen and when the user has
 * `prefers-reduced-motion: reduce`.
 */
export function useMesasDemo({ count }: UseMesasDemoOptions): UseMesasDemoResult {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const takeControl = useCallback((updater: (prev: number) => number) => {
    setPlaying(false);
    setIndex(updater);
  }, []);

  const next = useCallback(
    () => takeControl((prev) => (prev + 1) % count),
    [takeControl, count],
  );

  const goTo = useCallback((i: number) => takeControl(() => i), [takeControl]);

  const restart = useCallback(() => {
    setIndex(0);
    setPlaying(true);
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || !visible) return;
    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) return;

    const timer = window.setTimeout(
      () => setIndex((prev) => (prev + 1) % count),
      STEP_MS,
    );
    return () => window.clearTimeout(timer);
  }, [playing, visible, index, count]);

  return { index, playing, containerRef, next, goTo, restart };
}
