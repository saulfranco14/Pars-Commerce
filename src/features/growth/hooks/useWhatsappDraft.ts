import { useCallback, useEffect, useState } from "react";

import { createWhatsappDraft } from "@/features/growth/services/growthClient";
import { rememberWhatsappOpened, wasWhatsappOpened } from "@/features/growth/services/whatsappOpened";

import type { TemplateVariant } from "@/features/growth/interfaces/template";
import type { WhatsappDraft, WhatsappStep } from "@/features/growth/interfaces/whatsapp";

/** Loads the suggested message first; picking a step or variant re-renders it with a fresh link. */
export function useWhatsappDraft(leadId: string) {
  const [draft, setDraft] = useState<WhatsappDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState(() => wasWhatsappOpened(leadId));

  const load = useCallback(async (selection: { step?: WhatsappStep; variant?: TemplateVariant } = {}) => {
    setLoading(true);
    setError(null);
    try {
      setDraft(await createWhatsappDraft(leadId, selection));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos armar el mensaje.");
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    draft,
    loading,
    error,
    opened,
    markOpened: () => {
      rememberWhatsappOpened(leadId);
      setOpened(true);
    },
    selectStep: (step: WhatsappStep) => load({ step }),
    selectVariant: (variant: TemplateVariant) => load({ step: draft?.step, variant }),
    reload: () => {
      setOpened(false);
      return load();
    },
  };
}
