"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import { swrFetcher } from "@/lib/swrFetcher";
import { archivePlan, plansListKey, updatePlan } from "@/features/planes/services/plansClientService";

import type { OfferPlan, OfferPlanStatus } from "@/features/planes/interfaces/offerPlan";

export function usePlansList(tenantId: string | null) {
  const { data, isLoading, error, mutate } = useSWR<OfferPlan[]>(tenantId ? plansListKey(tenantId) : null, swrFetcher);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  const plans = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const counts = useMemo(() => {
    const result: Record<OfferPlanStatus, number> = { active: 0, paused: 0, draft: 0, archived: 0 };
    for (const plan of plans) result[plan.status] += 1;
    return result;
  }, [plans]);
  const subscribers = plans.reduce((sum, plan) => sum + (plan.active_count ?? 0), 0);

  // Stable so Toast's auto-dismiss timer isn't reset on every render.
  const clearNotice = useCallback(() => setNotice(null), []);

  async function run(id: string, action: () => Promise<unknown>, success: string) {
    setBusyId(id);
    try {
      await action();
      setNotice({ tone: "success", message: success });
      await mutate();
    } catch (cause) {
      setNotice({ tone: "error", message: cause instanceof Error ? cause.message : "No pudimos completar la acción." });
    } finally {
      setBusyId(null);
    }
  }

  return {
    plans,
    counts,
    subscribers,
    isLoading,
    loadError: error as Error | undefined,
    busyId,
    notice,
    clearNotice,
    pause: (id: string) => run(id, () => updatePlan(id, { status: "paused" }), "Plan pausado; ya no se puede contratar."),
    activate: (id: string) => run(id, () => updatePlan(id, { status: "active" }), "Plan activo en tu tienda."),
    archive: (id: string) => run(id, () => archivePlan(id), "Plan archivado. Quienes ya están suscritos lo conservan."),
  };
}
