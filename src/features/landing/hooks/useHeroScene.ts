"use client";

import { useEffect, useRef, useState } from "react";

import { HERO_SCENE_DURATION_MS, HERO_SCENES } from "@/features/landing/constants/heroScenes";

import type { HeroSceneSelection } from "@/features/landing/interfaces/heroScene";

/**
 * Replays the order → payment → panel sequence every few seconds. Without a
 * campaign it also moves to the next business type; with one it stays on it.
 */
export function useHeroScene(initial: HeroSceneSelection) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tick, setTick] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(media.matches);
    const updatePage = () => setPageVisible(document.visibilityState === "visible");
    updateMotion();
    updatePage();
    media.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updatePage);
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), {
      threshold: 0.2,
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      media.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updatePage);
      observer.disconnect();
    };
  }, []);

  const running = !paused && !reducedMotion && onScreen && pageVisible;

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setTick((t) => t + 1), HERO_SCENE_DURATION_MS);
    return () => window.clearInterval(timer);
  }, [running]);

  const index = initial.fromCampaign
    ? initial.index
    : (initial.index + tick) % HERO_SCENES.length;

  return {
    containerRef,
    index,
    scene: HERO_SCENES[index],
    replayKey: `${index}-${tick}`,
    paused,
    reducedMotion,
    toggle: () => setPaused((p) => !p),
  };
}
