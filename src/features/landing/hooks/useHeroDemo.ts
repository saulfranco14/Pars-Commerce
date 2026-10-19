"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";

import {
  HERO_BEATS,
  HERO_BEAT_MS,
  HERO_SCRIPT_ACTION_MS,
  HERO_STAFF_STEP_MS,
  HERO_START_KEY,
} from "@/features/landing/constants/heroDemo";
import {
  HERO_BEAT_SCRIPTS,
  HERO_SANDBOX_INITIAL,
} from "@/features/landing/constants/heroSandbox";
import { HERO_GUIDES } from "@/features/landing/constants/heroGuide";
import { buildHeroPanel } from "@/features/landing/helpers/heroPanel";
import { heroSandboxReducer, isBeatDone } from "@/features/landing/helpers/heroSandbox";

import type {
  HeroBeatKey,
  HeroPhoneControls,
  HeroSandboxAction,
  UseHeroDemoResult,
} from "@/features/landing/interfaces/heroDemo";

const START_INDEX = HERO_BEATS.findIndex((b) => b.key === HERO_START_KEY);
const START_SANDBOX = { ...HERO_SANDBOX_INITIAL, ...HERO_BEAT_SCRIPTS[HERO_START_KEY].before };

function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/**
 * Drives the two-device hero demo. Autoplay runs a script of the same actions a
 * visitor could take, so the moment they touch the phone it simply stops and
 * hands them the controls with the state as it is — nothing resets under them.
 */
export function useHeroDemo(): UseHeroDemoResult {
  const [index, setIndex] = useState(START_INDEX);
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(true);
  const [touched, setTouched] = useState(false);
  const [tapKey, setTapKey] = useState(0);
  const [sandbox, dispatch] = useReducer(heroSandboxReducer, START_SANDBOX);
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Beat whose script already ran (or that the visitor took over) — resuming must not replay it.
  const scriptedIndex = useRef<number | null>(null);

  const beat = HERO_BEATS[index];
  const nextIndex = (index + 1) % HERO_BEATS.length;

  const goTo = useCallback((i: number) => {
    setPlaying(false);
    setIndex(i);
  }, []);

  // Until the visitor acts, picking a module lands on its actionable start, not on autoplay's leftovers.
  const selectBeat = useCallback(
    (i: number) => {
      if (!touched) dispatch({ type: "apply", patch: HERO_BEAT_SCRIPTS[HERO_BEATS[i].key].before });
      goTo(i);
    },
    [touched, goTo],
  );

  const toggle = useCallback(() => {
    setPlaying((prev) => !prev);
  }, []);

  const act = useCallback((action: HeroSandboxAction) => {
    setPlaying(false);
    setTouched(true);
    dispatch(action);
  }, []);

  const goToBeat = useCallback(
    (key: HeroBeatKey) => {
      setTouched(true);
      goTo(HERO_BEATS.findIndex((b) => b.key === key));
    },
    [goTo],
  );

  const controls = useMemo<HeroPhoneControls>(
    () => ({
      act,
      goToBeat,
      next: () => goToBeat(HERO_BEATS[nextIndex].key),
      nextLabel: HERO_BEATS[nextIndex].label,
      restart: () => {
        dispatch({ type: "reset" });
        goToBeat("qr");
      },
    }),
    [act, goToBeat, nextIndex],
  );

  const panel = useMemo(
    () => buildHeroPanel(beat.panel.view, sandbox),
    [beat.panel.view, sandbox],
  );

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
    if (!playing) {
      scriptedIndex.current = index;
      return;
    }
    if (!visible || prefersReducedMotion()) return;

    const timers: number[] = [];
    if (scriptedIndex.current !== index) {
      const script = HERO_BEAT_SCRIPTS[HERO_BEATS[index].key];
      dispatch({ type: "apply", patch: script.before });
      timers.push(
        window.setTimeout(() => {
          scriptedIndex.current = index;
          dispatch({ type: "apply", patch: script.after });
          setTapKey((k) => k + 1);
        }, HERO_SCRIPT_ACTION_MS),
      );
    }
    timers.push(
      window.setTimeout(
        () => setIndex((prev) => (prev + 1) % HERO_BEATS.length),
        HERO_BEAT_MS,
      ),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [playing, visible, index]);

  // The visitor's own order advances as if staff were working it — they never touch fulfillment.
  useEffect(() => {
    if (playing || beat.key !== "ordenes") return;
    if (sandbox.order !== "received" && sandbox.order !== "in_progress") return;
    const timer = window.setTimeout(
      () => dispatch({ type: "advanceOrder" }),
      HERO_STAFF_STEP_MS,
    );
    return () => window.clearTimeout(timer);
  }, [playing, beat.key, sandbox.order]);

  return {
    index,
    beat,
    playing,
    touched,
    sandbox,
    panel,
    guide: HERO_GUIDES[beat.key],
    beatDone: isBeatDone(beat.key, sandbox),
    tapKey,
    controls,
    containerRef,
    goTo: selectBeat,
    toggle,
  };
}
