"use client";

import { useState } from "react";
import useSWR from "swr";

import { buildWaLink } from "@/features/growth/helpers/buildWaLink";

import type { MiniAppClient } from "@/features/growth/services/miniAppClient";
import type { MiniAppRecentLead, ReplySuggestion } from "@/features/growth/interfaces/miniApp";

/** «Respuestas»: paste what a prospect answered, the AI reads it and leaves the reply ready to send. */
export function useMiniAppReplies(client: MiniAppClient) {
  const recent = useSWR<MiniAppRecentLead[]>("tg-recent", () => client.recent(), { revalidateOnFocus: false });
  const [leadId, setLeadId] = useState<string>("");
  const [text, setText] = useState("");
  const [result, setResult] = useState<ReplySuggestion | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    setBusy(true);
    setError(null);
    try {
      const suggestion = await client.reply(leadId, text);
      setResult(suggestion);
      setReply(suggestion.reply);
    } catch (err) {
      setError(err instanceof Error ? err.message : "La IA no pudo leerlo. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setResult(null);
    setText("");
    setReply("");
    void recent.mutate();
  }

  return {
    recent: recent.data ?? [],
    recentLoading: recent.isLoading,
    leadId,
    setLeadId,
    text,
    setText,
    result,
    reply,
    setReply,
    // The operator may have edited the AI's text: the chat opens with what is on screen.
    sendLink: result?.phone ? buildWaLink(result.phone, reply) : null,
    busy,
    error,
    analyze,
    reset,
  };
}
