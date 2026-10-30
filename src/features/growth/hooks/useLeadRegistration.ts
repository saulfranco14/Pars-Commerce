import { useCallback, useState } from "react";

import { fetchClaimLink, registerLead } from "@/features/growth/services/growthClient";

import type { LeadRegistrationInput, LeadRegistrationResult } from "@/features/growth/interfaces/lead";

/** Both ways to register a prospect's business: by email invitation, or on the owner's own phone. */
export function useLeadRegistration(leadId: string) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LeadRegistrationResult | null>(null);
  const [claimUrl, setClaimUrl] = useState<string | null>(null);

  const reset = useCallback(() => {
    setError(null);
    setResult(null);
  }, []);

  return {
    busy,
    error,
    result,
    claimUrl,
    reset,
    register: async (input: LeadRegistrationInput): Promise<boolean> => {
      setBusy(true);
      setError(null);
      try {
        setResult(await registerLead(leadId, input));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "No pudimos dar de alta el negocio.");
        return false;
      } finally {
        setBusy(false);
      }
    },
    loadClaimLink: useCallback(async () => {
      setError(null);
      try {
        setClaimUrl((await fetchClaimLink(leadId)).url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No pudimos preparar el enlace.");
      }
    }, [leadId]),
  };
}
