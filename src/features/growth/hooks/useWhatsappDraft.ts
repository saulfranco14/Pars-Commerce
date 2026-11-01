import { useCallback, useEffect, useState } from "react";

import { buildWaLink } from "@/features/growth/helpers/buildWaLink";
import { takePrefetchedDraft } from "@/features/growth/services/draftPrefetch";
import { createWhatsappDraft, fetchAiDraft } from "@/features/growth/services/growthClient";
import { AI_TYPE_CHARS } from "@/features/growth/constants/aiWriting";

import type { TemplateVariant } from "@/features/growth/interfaces/template";
import type { SentWhatsapp, WhatsappDraft, WhatsappStep } from "@/features/growth/interfaces/whatsapp";

/** Reveals the AI's text a few characters per frame, as if it were being written; instant with reduced motion. */
function typeOut(body: string, setText: (text: string) => void): Promise<void> {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    setText(body);
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    let shown = 0;
    const step = () => {
      shown = Math.min(body.length, shown + AI_TYPE_CHARS);
      setText(body.slice(0, shown));
      if (shown < body.length) window.requestAnimationFrame(step);
      else resolve();
    };
    window.requestAnimationFrame(step);
  });
}

/**
 * Loads the suggested message; the operator can edit it, and WhatsApp opens with exactly that text.
 * Picking another step or variant re-renders it with the lead's same "Para ti" link.
 */
export function useWhatsappDraft(leadId: string) {
  const [draft, setDraft] = useState<WhatsappDraft | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiWritten, setAiWritten] = useState(false);

  const load = useCallback(async (selection: { step?: WhatsappStep; variant?: TemplateVariant } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const prefetched = !selection.step && !selection.variant ? takePrefetchedDraft(leadId) : null;
      const next = await (prefetched ?? createWhatsappDraft(leadId, selection));
      setDraft(next);
      setText(next.body);
      setAiWritten(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos armar el mensaje.");
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    void load();
  }, [load]);

  const edited = Boolean(draft) && text.trim() !== draft?.body.trim();

  return {
    draft,
    text,
    setText,
    edited,
    waLink: draft && text.trim() ? buildWaLink(draft.phone, text.trim()) : null,
    loading,
    error,
    /** What was really sent, for the conversation and so the next step never repeats it. */
    sent: (): SentWhatsapp | undefined =>
      draft ? { body: text.trim(), templateId: draft.templateId, step: draft.step, variant: draft.variant, edited } : undefined,
    selectStep: (step: WhatsappStep) => load({ step }),
    selectVariant: (variant: TemplateVariant) => load({ step: draft?.step, variant }),
    resetText: () => draft && setText(draft.body),
    reload: () => load(),
    aiBusy,
    aiWritten,
    /** Replaces the text with a different follow-up the AI writes from the lead's history. */
    writeWithAi: async () => {
      setAiBusy(true);
      setAiWritten(false);
      setError(null);
      try {
        const { body } = await fetchAiDraft(leadId);
        setAiWritten(true);
        await typeOut(body, setText);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No pudimos escribir el mensaje con IA.");
      } finally {
        setAiBusy(false);
      }
    },
  };
}
