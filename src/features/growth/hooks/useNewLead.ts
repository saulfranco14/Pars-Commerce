import { useCallback, useState } from "react";
import { useSWRConfig } from "swr";

import { createLead, isBoardKey, isLeadsListKey } from "@/features/growth/services/growthClient";

import type { ContactConflict, NewLeadInput } from "@/features/growth/interfaces/lead";

/** «Nuevo prospecto»: returns the new id, or keeps the conflict so the sheet can say who already works it. */
export function useNewLead() {
  const { mutate } = useSWRConfig();
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState<ContactConflict | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setConflict(null);
    setError(null);
  }, []);

  async function submit(input: NewLeadInput): Promise<string | null> {
    setBusy(true);
    reset();
    try {
      const result = await createLead(input);
      if (result.status === "conflict") {
        setConflict(result.conflict);
        return null;
      }
      if (result.status === "suppressed") {
        setError("Ese teléfono o correo pidió no recibir mensajes. No se puede volver a agregar.");
        return null;
      }
      await Promise.all([mutate(isLeadsListKey), mutate(isBoardKey)]);
      return result.leadId;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos guardar el prospecto.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  return { busy, conflict, error, submit, reset };
}
