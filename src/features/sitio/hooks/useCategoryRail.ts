"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import {
  alignLoopScrollForStep,
  centeredScrollLeft,
  nearestLoopPosition,
  wrapLoopScroll,
} from "@/features/sitio/helpers/loopScroll";

export const RAIL_COPIES = 3;
export const RAIL_MIDDLE_COPY = 1;
const SMOOTH_SETTLE_MS = 500;

interface LoopMetrics {
  origin: number;
  setWidth: number;
}

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Single-row category rail that loops forever once its chips no longer fit. */
export function useCategoryRail(activeKey: string, itemCount: number) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const settling = useRef(false);
  const placedFor = useRef<boolean | null>(null);
  const [looping, setLooping] = useState(false);

  const measure = useCallback((): LoopMetrics | null => {
    const starts = scrollerRef.current?.querySelectorAll<HTMLElement>("[data-copy-start]");
    if (!starts || starts.length < 2) return null;
    return { origin: starts[0].offsetLeft, setWidth: starts[1].offsetLeft - starts[0].offsetLeft };
  }, []);

  const wrap = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !looping || settling.current) return;
    // Keyboard focus must stay visible; wrapping would slide the focused chip out of view.
    const focused = document.activeElement;
    if (focused && scroller.contains(focused) && focused.matches(":focus-visible")) return;
    const metrics = measure();
    if (!metrics) return;
    const next = wrapLoopScroll(scroller.scrollLeft, metrics.origin, metrics.setWidth);
    if (next !== scroller.scrollLeft) scroller.scrollLeft = next;
  }, [looping, measure]);

  const smoothScrollTo = useCallback(
    (left: number) => {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      const reduceMotion = prefersReducedMotion();
      settling.current = true;
      scroller.scrollTo({ left, behavior: reduceMotion ? "auto" : "smooth" });
      window.setTimeout(() => {
        settling.current = false;
        wrap();
      }, reduceMotion ? 0 : SMOOTH_SETTLE_MS);
    },
    [wrap],
  );

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const check = () => {
      const style = getComputedStyle(scroller);
      const metrics = looping ? measure() : null;
      // Compare the width of one copy, padding included, so toggling copies never flips the decision.
      const contentWidth = metrics
        ? metrics.setWidth - parseFloat(style.columnGap || "0") + parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
        : scroller.scrollWidth;
      setLooping(contentWidth > scroller.clientWidth + 1);
    };
    check();
    const observer = new ResizeObserver(check);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [looping, measure, itemCount]);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    const copy = looping ? RAIL_MIDDLE_COPY : 0;
    const active = scroller?.querySelector<HTMLElement>(`[data-copy="${copy}"][data-active="true"]`);
    if (!scroller || !active) return;
    // "Todas" opens at the start of the row instead of mid-loop, so the previous lap's tail isn't the first thing seen.
    const target = active.hasAttribute("data-copy-start")
      ? active.offsetLeft - parseFloat(getComputedStyle(scroller).paddingLeft)
      : centeredScrollLeft(active.offsetLeft, active.offsetWidth, scroller.clientWidth);
    const firstPlacement = placedFor.current !== looping;
    placedFor.current = looping;
    if (firstPlacement) {
      scroller.scrollLeft = target;
      return;
    }
    const metrics = looping ? measure() : null;
    const maxLeft = scroller.scrollWidth - scroller.clientWidth;
    smoothScrollTo(metrics ? nearestLoopPosition(target, scroller.scrollLeft, metrics.setWidth, maxLeft) : target);
  }, [looping, activeKey, measure, smoothScrollTo]);

  const step = useCallback(
    (direction: 1 | -1) => {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      const delta = direction * scroller.clientWidth * 0.7;
      const metrics = looping ? measure() : null;
      if (metrics) scroller.scrollLeft = alignLoopScrollForStep(scroller.scrollLeft, metrics.origin, metrics.setWidth, delta);
      smoothScrollTo(scroller.scrollLeft + delta);
    },
    [looping, measure, smoothScrollTo],
  );

  return { scrollerRef, looping, copies: looping ? RAIL_COPIES : 1, onScroll: wrap, step };
}
