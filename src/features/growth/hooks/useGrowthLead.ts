import { useCallback, useState } from "react";
import useSWR from "swr";

import { leadKey, patchLead } from "@/features/growth/services/growthClient";
import { swrFetcher } from "@/lib/swrFetcher";

import type { LeadDetail, LeadOutcome } from "@/features/growth/interfaces/lead";

export function useGrowthLead(id: string) {
  const { data, error, isLoading, mutate } = useSWR<LeadDetail>(leadKey(id), swrFetcher);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const clearNotice = useCallback(() => setNotice(null), []);

  async function run(action: () => Promise<unknown>, success: string): Promise<boolean> {
    setBusy(true);
    try {
      await action();
      setNotice({ tone: "success", message: success });
      await mutate();
      return true;
    } catch (err) {
      setNotice({ tone: "error", message: err instanceof Error ? err.message : "No pudimos guardar el cambio." });
      return false;
    } finally {
      setBusy(false);
    }
  }

  return {
    detail: data,
    error,
    isLoading,
    busy,
    notice,
    clearNotice,
    markOutcome: (outcome: LeadOutcome, reason?: string) => run(() => patchLead(id, { outcome, reason }), "Listo, quedó registrado."),
    snooze: (days: number | null) => run(() => patchLead(id, { snoozeDays: days }), days ? `Pausado ${days} días.` : "Reactivado."),
    updatePhone: (phone: string) => run(() => patchLead(id, { phone }), "Teléfono actualizado. Vuelve a la fila de WhatsApp."),
  };
}
