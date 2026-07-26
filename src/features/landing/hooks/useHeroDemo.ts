"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { HERO_BEATS, HERO_BEAT_MS } from "@/features/landing/constants/heroDemo";

interface UseHeroDemoResult {
  index: number;
  playing: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  goTo: (i: number) => void;
  toggle: () => void;
}

/**
 * Drives the two-device hero demo. Loops forever so the hero is never a dead
 * screenshot, but yields to the visitor the instant they touch the rail — and
 * pauses when scrolled out of view or when the OS asks for reduced motion (the
 * static first beat still reads as a normal hero mockup).
 */
export function useHeroDemo(): UseHeroDemoResult {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const goTo = useCallback((i: number) => {
    setPlaying(false);
    setIndex(i);
  }, []);

  const toggle = useCallback(() => {
    setPlaying((prev) => !prev);
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || !visible) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setTimeout(
      () => setIndex((prev) => (prev + 1) % HERO_BEATS.length),
      HERO_BEAT_MS,
    );
    return () => window.clearTimeout(timer);
  }, [playing, visible, index]);

  return { index, playing, containerRef, goTo, toggle };
}
