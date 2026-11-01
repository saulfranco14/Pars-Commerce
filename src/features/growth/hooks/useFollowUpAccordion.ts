"use client";

import { useCallback, useEffect, useState } from "react";

import { mexicoDayKey } from "@/features/growth/helpers/leadPipeline";

import type { AccordionOverrides } from "@/features/growth/interfaces/prospects";

const STORAGE_KEY = "tlaco_growth_groups";

function readOverrides(): AccordionOverrides {
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? "null") as { day: string; open: AccordionOverrides } | null;
    return stored?.day === mexicoDayKey(new Date()) ? stored.open : {};
  } catch {
    return {};
  }
}

/** Which follow-up groups are open: the urgent one by default, and what the person toggled for the rest of the day. */
export function useFollowUpAccordion() {
  const [overrides, setOverrides] = useState<AccordionOverrides>({});
  useEffect(() => setOverrides(readOverrides()), []);

  const isOpen = useCallback((key: string, byDefault: boolean) => overrides[key] ?? byDefault, [overrides]);
  const toggle = useCallback((key: string, current: boolean) => {
    setOverrides((previous) => {
      const next = { ...previous, [key]: !current };
      try {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ day: mexicoDayKey(new Date()), open: next }));
      } catch {
        // Private mode: the choice still lasts until the page reloads.
      }
      return next;
    });
  }, []);

  return { isOpen, toggle };
}
