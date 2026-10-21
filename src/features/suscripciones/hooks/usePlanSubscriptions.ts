"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import { swrFetcher } from "@/lib/swrFetcher";
import { PLAN_SUBSCRIPTION_TABS, planSubscriptionTab } from "@/features/suscripciones/helpers/planSubscriptionView";
import {
  planSubscriptionsKey,
  updatePlanSubscription,
  type PlanSubscriptionAction,
} from "@/features/suscripciones/services/planSubscriptionsClient";

import type { PlanSubscriptionDetail, PlanSubscriptionTab } from "@/features/suscripciones/interfaces/planSubscription";

const SUCCESS: Record<PlanSubscriptionAction, string> = {
  cancel_now: "Suscripción cancelada.",
  cancel_period_end: "Se cancelará al terminar el periodo pagado.",
  resume: "La suscripción seguirá renovándose.",
};

export function usePlanSubscriptions(tenantId: string | null) {
  const { data, isLoading, error, mutate } = useSWR<PlanSubscriptionDetail[]>(
    tenantId ? planSubscriptionsKey(tenantId) : null,
    swrFetcher,
    { revalidateOnFocus: false },
  );
  const [tab, setTab] = useState<PlanSubscriptionTab>("por_cobrar");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  const rows = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const counts = useMemo(() => {
    const result = Object.fromEntries(PLAN_SUBSCRIPTION_TABS.map((entry) => [entry.value, 0])) as Record<PlanSubscriptionTab, number>;
    for (const row of rows) result[planSubscriptionTab(row)] += 1;
    return result;
  }, [rows]);
  const tabs = PLAN_SUBSCRIPTION_TABS.map((entry) => ({ value: entry.value, label: `${entry.label} ${counts[entry.value]}` }));
  const visible = rows.filter((row) => planSubscriptionTab(row) === tab);
  const toCollect = rows.reduce((sum, row) => sum + (row.due_period?.amount ?? 0), 0);

  // Stable so Toast's auto-dismiss timer isn't reset on every render.
  const clearNotice = useCallback(() => setNotice(null), []);

  async function act(subscriptionId: string, action: PlanSubscriptionAction) {
    if (!tenantId) return;
    setBusyId(subscriptionId);
    try {
      await updatePlanSubscription(tenantId, subscriptionId, action);
      setNotice({ tone: "success", message: SUCCESS[action] });
      await mutate();
    } catch (cause) {
      setNotice({ tone: "error", message: cause instanceof Error ? cause.message : "No pudimos completar la acción." });
    } finally {
      setBusyId(null);
    }
  }

  return {
    rows: visible,
    hasAny: rows.length > 0,
    counts,
    tabs,
    tab,
    setTab: (value: string) => setTab(value as PlanSubscriptionTab),
    toCollect,
    isLoading,
    loadError: error as Error | undefined,
    busyId,
    notice,
    clearNotice,
    act,
  };
}
