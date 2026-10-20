"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { SOLUTION_CAPABILITIES } from "@/features/solutions/constants/solutionCapabilities";
import { THEME_CHOICES } from "@/features/solutions/constants/solutionOnboarding";
import { trackSolutionEvent } from "@/features/solutions/helpers/trackSolutionEvent";

import type { SolutionDefinition } from "@/features/solutions/solutionCatalog";
import type { CapabilityKey } from "@/features/solutions/interfaces/solutionExperience";

/** Page-level state: the business name/theme shared with the wizard, and the capability tour. */
export function useSolutionExperience(solution: SolutionDefinition, startOnboarding: boolean) {
  const router = useRouter();
  const [name, setName] = useState(solution.preset.defaultName);
  const [selectedTheme, setSelectedTheme] = useState(0);
  const [onboardingOpen, setOnboardingOpen] = useState(startOnboarding);
  const [activeCapability, setActiveCapability] = useState<CapabilityKey>("store");
  const [completed, setCompleted] = useState<Partial<Record<CapabilityKey, boolean>>>({});

  const capability =
    SOLUTION_CAPABILITIES.find((c) => c.key === activeCapability) ?? SOLUTION_CAPABILITIES[0];

  function openOnboarding() {
    setOnboardingOpen(true);
    router.replace(`/soluciones/${solution.path}?iniciar=1`, { scroll: false });
    trackSolutionEvent("solution_onboarding_started", { solution: solution.path });
  }

  // Stable identity: the wizard's Escape/scroll-lock effect depends on it.
  const closeOnboarding = useCallback(() => {
    setOnboardingOpen(false);
    router.replace(`/soluciones/${solution.path}`, { scroll: false });
  }, [router, solution.path]);

  function selectCapability(key: CapabilityKey) {
    setActiveCapability(key);
    trackSolutionEvent("solution_capability_viewed", { solution: solution.path, capability: key });
  }

  function runCapabilityAction() {
    setCompleted((current) => ({ ...current, [capability.key]: true }));
    trackSolutionEvent("solution_capability_tried", { solution: solution.path, capability: capability.key });
  }

  return {
    name,
    setName,
    selectedTheme,
    setSelectedTheme,
    themeColor: THEME_CHOICES[selectedTheme].color,
    onboardingOpen,
    openOnboarding,
    closeOnboarding,
    capability,
    capabilityDone: completed[capability.key] === true,
    selectCapability,
    runCapabilityAction,
  };
}
