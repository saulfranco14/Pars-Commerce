"use client";
import { useEffect, useRef, useState } from "react";
import type { FocusEvent } from "react";

export function useStudioShowcase(
  count: number,
  steps = 3,
  duration = 6500,
  pauseOnHover = true,
) {
  const container = useRef<HTMLDivElement>(null);
  const [manual, setManual] = useState(false);
  const [position, setPosition] = useState({ index: 0, step: 0 });
  const [requestedPlayback, setRequestedPlayback] = useState<boolean | null>(
    null,
  );
  const [reducedMotion, setReducedMotion] = useState(true);
  const [visible, setVisible] = useState(false);
  const [documentVisible, setDocumentVisible] = useState(true);
  const [interacting, setInteracting] = useState(false);
  const timing = useRef({ position, remaining: duration });
  const enabled = requestedPlayback ?? !reducedMotion;
  const running = enabled && visible && documentVisible && !interacting;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(media.matches);
    const updateVisibility = () =>
      setDocumentVisible(document.visibilityState === "visible");
    updateMotion();
    updateVisibility();
    media.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.15 },
    );
    if (container.current) observer.observe(container.current);
    return () => {
      media.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (timing.current.position !== position) {
      timing.current = { position, remaining: duration };
    }
    if (!running) return;
    const started = performance.now();
    const timer = window.setTimeout(
      () =>
        setPosition((current) =>
          current.step + 1 < steps
            ? { ...current, step: current.step + 1 }
            : { index: (current.index + 1) % count, step: 0 },
        ),
      timing.current.remaining,
    );
    return () => {
      window.clearTimeout(timer);
      timing.current.remaining = Math.max(
        0,
        timing.current.remaining - (performance.now() - started),
      );
    };
  }, [running, position, count, steps, duration]);

  function choose(index: number, step = 0) {
    setManual(true);
    setRequestedPlayback(false);
    setPosition({ index: ((index % count) + count) % count, step });
  }
  function goToStep(step: number) {
    choose(position.index, step);
  }
  function toggle() {
    setManual(false);
    setRequestedPlayback(!enabled);
    setInteracting(false);
  }
  function onBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget))
      setInteracting(false);
  }
  return {
    container,
    ...position,
    enabled,
    running,
    duration,
    reducedMotion,
    manual,
    choose,
    goToStep,
    toggle,
    pause: () => setRequestedPlayback(false),
    interaction: {
      onMouseEnter: () => {
        if (pauseOnHover) setInteracting(true);
      },
      onMouseLeave: () => {
        if (!container.current?.contains(document.activeElement))
          setInteracting(false);
      },
      onFocusCapture: () => setInteracting(true),
      onBlurCapture: onBlur,
    },
  };
}
