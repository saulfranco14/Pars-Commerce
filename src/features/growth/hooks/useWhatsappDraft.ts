import { useCallback, useEffect, useState } from "react";

import { buildWaLink } from "@/features/growth/helpers/buildWaLink";
import { createWhatsappDraft } from "@/features/growth/services/growthClient";
import { rememberWhatsappOpened, wasWhatsappOpened } from "@/features/growth/services/whatsappOpened";

import type { TemplateVariant } from "@/features/growth/interfaces/template";
import type { SentWhatsapp, WhatsappDraft, WhatsappStep } from "@/features/growth/interfaces/whatsapp";

/**
 * Loads the suggested message; the operator can edit it, and WhatsApp opens with exactly that text.
 * Picking another step or variant re-renders it with the lead's same "Para ti" link.
 */
export function useWhatsappDraft(leadId: string) {
  const [draft, setDraft] = useState<WhatsappDraft | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState(() => wasWhatsappOpened(leadId));

  const load = useCallback(async (selection: { step?: WhatsappStep; variant?: TemplateVariant } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const next = await createWhatsappDraft(leadId, selection);
      setDraft(next);
      setText(next.body);
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
    opened,
    markOpened: () => {
      rememberWhatsappOpened(leadId);
      setOpened(true);
    },
    /** What was really sent, for the conversation and so the next step never repeats it. */
    sent: (): SentWhatsapp | undefined =>
      draft ? { body: text.trim(), templateId: draft.templateId, step: draft.step, variant: draft.variant, edited } : undefined,
    selectStep: (step: WhatsappStep) => load({ step }),
    selectVariant: (variant: TemplateVariant) => load({ step: draft?.step, variant }),
    resetText: () => draft && setText(draft.body),
    reload: () => {
      setOpened(false);
      return load();
    },
  };
}
