"use client";
import { useState } from "react";
import { useStudioContext } from "../components/StudioProvider";
import { suggestCopy } from "../services/studioClientService";
import type { StudioCopyIdeas } from "../helpers/aiPrompt";

/** Free phrase ideas for the open design; asked for only when the person taps Sugerir. */
export function useStudioCopyIdeas(designId: string) {
  const { tenantId } = useStudioContext(),
    [ideas, setIdeas] = useState<StudioCopyIdeas | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  async function suggest() {
    setBusy(true);
    setError(null);
    try {
      setIdeas(await suggestCopy(tenantId, designId));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No pudimos sugerir frases ahora.",
      );
    } finally {
      setBusy(false);
    }
  }
  return { ideas, busy, error, suggest };
}
