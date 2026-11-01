"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";

import { buildTodayPlan } from "@/features/growth/helpers/todayPlan";
import { mexicoDayKey } from "@/features/growth/helpers/leadPipeline";
import { fetchTodayPlanText } from "@/features/growth/services/growthClient";

import type { TodayFacts, TodayPlanText } from "@/features/growth/interfaces/tlacoAi";

const STORAGE_KEY = "tlaco_ai_today";

function readSaved(key: string): TodayPlanText | null {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as { key: string; text: TodayPlanText } | null;
    return saved?.key === key ? saved.text : null;
  } catch {
    return null;
  }
}

function save(key: string, text: TodayPlanText) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ key, text }));
  } catch {
    // Without storage the plan is just written again next time.
  }
}

/** The day's plan: steps from the rules right away, Tlaco IA's text once a day (again only when the plan really changes). */export function useTodayPlan(facts: TodayFacts | null) {
  const plan = useMemo(() => (facts ? buildTodayPlan(facts) : null), [facts]);
  const [round, setRound] = useState(0);
  const cacheKey = plan ? `${mexicoDayKey(new Date())}|${plan.signature}` : null;

  const { data, error, isLoading } = useSWR(
    cacheKey && facts ? ["tlaco-ai-today", cacheKey, round] : null,
    async () => {
      const saved = round === 0 && cacheKey ? readSaved(cacheKey) : null;
      if (saved) return { value: saved, fresh: false };
      const text = await fetchTodayPlanText(facts as TodayFacts);
      // Only Tlaco IA's own words are kept for the day; the rules' text means «try the AI again next time».
      if (cacheKey && text.source === "ai") save(cacheKey, text);
      return { value: text, fresh: true };
    },
    { revalidateOnFocus: false, revalidateIfStale: false, shouldRetryOnError: false },
  );

  const text: TodayPlanText | null = data?.value ?? (error && plan ? { text: plan.text, source: "rules" } : null);
  return { plan, text, fresh: Boolean(data?.fresh), writing: isLoading, again: () => setRound((value) => value + 1) };
}
