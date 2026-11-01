"use client";

import { useCallback, useState } from "react";

import { questionKey } from "@/features/growth/helpers/questionKey";
import { askTlacoAi } from "@/features/growth/services/growthClient";

import type { AskTlacoInput, TlacoAnswer } from "@/features/growth/interfaces/tlacoAi";

// Answers already seen in this tab come back without a request; the server keeps the shared cache.
const seen = new Map<string, TlacoAnswer>();

/** One question at a time: the new answer replaces the last one, there is no thread. */
export function useAskTlaco() {
  const [answer, setAnswer] = useState<TlacoAnswer | null>(null);
  const [asking, setAsking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ask = useCallback(async (input: AskTlacoInput) => {
    const key = input.id ? `id:${input.id}` : questionKey(input.question);
    const known = key ? seen.get(key) : undefined;
    setError(null);
    if (known) {
      setAnswer({ ...known, question: input.question });
      return;
    }
    setAsking(input.question);
    try {
      const result = await askTlacoAi(input);
      if (key) seen.set(key, result);
      setAnswer(result);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "No pudimos preguntarle a Tlaco IA. Intenta de nuevo.");
    } finally {
      setAsking(null);
    }
  }, []);

  return { answer, asking, error, ask };
}
