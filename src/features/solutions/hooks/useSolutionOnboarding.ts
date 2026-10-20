"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  MAX_ONBOARDING_GOALS,
  ONBOARDING_STEP_COUNT,
  THEME_CHOICES,
} from "@/features/solutions/constants/solutionOnboarding";
import { trackSolutionEvent } from "@/features/solutions/helpers/trackSolutionEvent";
import { registrationIntentQuery } from "@/features/auth/registrationIntent";

import type { CatalogStartMode, RegistrationIntent } from "@/features/auth/registrationIntent";
import type { SolutionDefinition } from "@/features/solutions/solutionCatalog";

/** Three questions before signup; the answers travel to /registro as the registration intent. */
export function useSolutionOnboarding({
  solution,
  name,
  selectedTheme,
  onClose,
}: {
  solution: SolutionDefinition;
  name: string;
  selectedTheme: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [goals, setGoals] = useState<string[]>(["sell"]);
  const [catalogMode, setCatalogMode] = useState<CatalogStartMode>("starter");
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const isLastStep = step === ONBOARDING_STEP_COUNT - 1;
  const canContinue = step !== 0 || name.trim().length > 0;

  // Lock the page behind the full-screen wizard and let Escape close it.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  // Auto-focus only with a mouse: on phones it would pop the keyboard over the preview.
  useEffect(() => {
    if (step === 0 && window.matchMedia?.("(pointer: fine)").matches) nameInputRef.current?.focus();
  }, [step]);

  function toggleGoal(goal: string) {
    setGoals((current) => {
      if (current.includes(goal)) return current.filter((item) => item !== goal);
      if (current.length >= MAX_ONBOARDING_GOALS) return [current[1], goal];
      return [...current, goal];
    });
  }

  function back() {
    if (step === 0) onClose();
    else setStep((current) => current - 1);
  }

  function next() {
    if (!canContinue) return;
    if (!isLastStep) {
      trackSolutionEvent("solution_onboarding_step", { solution: solution.path, step: step + 1 });
      setStep((current) => current + 1);
      return;
    }
    const intent: RegistrationIntent = {
      plan: "free",
      giro: solution.catalog.businessType,
      solutionKey: solution.path,
      catalogKey: solution.catalog.key,
      businessName: name.trim() || solution.preset.defaultName,
      themeKey: THEME_CHOICES[selectedTheme].key,
      primaryGoals: goals,
      catalogStartMode: catalogMode,
      onboardingSessionId: `${solution.path}-${Date.now().toString(36)}`,
      assisted: catalogMode === "assisted",
    };
    trackSolutionEvent("solution_registration_started", { solution: solution.path, catalog_mode: catalogMode });
    router.push(`/registro?${registrationIntentQuery(intent)}`);
  }

  return {
    step,
    isLastStep,
    canContinue,
    goals,
    toggleGoal,
    catalogMode,
    setCatalogMode,
    nameInputRef,
    back,
    next,
  };
}
