"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import { swrFetcher } from "@/lib/swrFetcher";
import { offerDisplayStatus, type OfferDisplayStatus } from "@/features/promociones/helpers/offerStatus";
import {
  archivePromotion,
  duplicatePromotion,
  promotionsListKey,
  updatePromotion,
  type PromotionListItem,
} from "@/features/promociones/services/promotionsClientService";

export type OfferFilter = "all" | OfferDisplayStatus;

export interface OfferListEntry {
  promotion: PromotionListItem;
  status: OfferDisplayStatus;
}

const FILTER_LABELS: Record<OfferFilter, string> = {
  all: "Todas",
  active: "Activas",
  scheduled: "Programadas",
  paused: "Pausadas",
  expired: "Vencidas",
  draft: "Borradores",
  archived: "Archivadas",
};

const FILTER_ORDER: OfferFilter[] = ["all", "active", "scheduled", "paused", "expired", "draft"];

export function useOffersList(tenantId: string | null) {
  const { data, isLoading, error, mutate } = useSWR<PromotionListItem[]>(
    tenantId ? promotionsListKey(tenantId) : null,
    swrFetcher,
  );
  const [filter, setFilter] = useState<OfferFilter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  const entries = useMemo<OfferListEntry[]>(() => {
    const now = new Date();
    return (Array.isArray(data) ? data : []).map((promotion) => ({ promotion, status: offerDisplayStatus(promotion, now) }));
  }, [data]);

  const counts = useMemo(() => {
    const result: Record<OfferFilter, number> = { all: entries.length, active: 0, scheduled: 0, paused: 0, expired: 0, draft: 0, archived: 0 };
    for (const entry of entries) result[entry.status] += 1;
    return result;
  }, [entries]);

  const tabs = FILTER_ORDER.filter((key) => key === "all" || counts[key] > 0).map((key) => ({
    value: key,
    label: `${FILTER_LABELS[key]} ${counts[key]}`,
  }));

  // Stable so Toast's auto-dismiss timer isn't reset on every render.
  const clearNotice = useCallback(() => setNotice(null), []);

  const visible = filter === "all" ? entries : entries.filter((entry) => entry.status === filter);

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
    entries: visible,
    hasAny: entries.length > 0,
    counts,
    tabs,
    filter,
    setFilter: (value: string) => setFilter(value as OfferFilter),
    isLoading,
    loadError: error as Error | undefined,
    busyId,
    notice,
    clearNotice,
    pause: (id: string) => run(id, () => updatePromotion(id, { status: "paused" }), "Promoción pausada; ya no se ve en tu tienda."),
    activate: (id: string) => run(id, () => updatePromotion(id, { status: "active" }), "Promoción activa en tu tienda."),
    archive: (id: string) => run(id, () => archivePromotion(id), "Promoción archivada."),
    duplicate: async (id: string): Promise<string | null> => {
      if (!tenantId) return null;
      let createdId: string | null = null;
      await run(id, async () => {
        createdId = (await duplicatePromotion(tenantId, id)).id;
      }, "Copia creada como borrador.");
      return createdId;
    },
  };
}
