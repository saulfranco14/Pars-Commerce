"use client";

import { useState } from "react";
import useSWR from "swr";

import { adBackgroundsKey, generateAdBackgrounds, reviewAdBackground } from "@/features/growth/services/adsClient";
import { swrFetcher } from "@/lib/swrFetcher";

import type { AdBackground, AdBackgroundKind } from "@/features/growth/interfaces/prospectAds";

type Notice = { tone: "success" | "error"; message: string } | null;

/** The background library of one giro: generate a batch, approve or discard each image. */
export function useAdBackgrounds(giro: string) {
  const { data, error, isLoading, mutate } = useSWR<AdBackground[]>(adBackgroundsKey(giro), swrFetcher);
  const [generating, setGenerating] = useState<AdBackgroundKind | null>(null);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  async function generate(kind: AdBackgroundKind) {
    setGenerating(kind);
    setNotice(null);
    try {
      const result = await generateAdBackgrounds(giro, kind);
      setNotice({ tone: "success", message: result.failed ? `Listas ${result.created}; ${result.failed} no salieron.` : `Listas ${result.created}. Revísalas abajo.` });
      await mutate();
    } catch (err) {
      setNotice({ tone: "error", message: err instanceof Error ? err.message : "No pudimos hacer las imágenes." });
    } finally {
      setGenerating(null);
    }
  }

  async function review(id: string, status: "approved" | "rejected") {
    setReviewing(id);
    try {
      await reviewAdBackground(id, status);
      await mutate((rows) => (status === "rejected" ? rows?.filter((row) => row.id !== id) : rows?.map((row) => (row.id === id ? { ...row, status } : row))), { revalidate: false });
    } catch (err) {
      setNotice({ tone: "error", message: err instanceof Error ? err.message : "No pudimos guardar tu revisión." });
    } finally {
      setReviewing(null);
    }
  }

  const rows = data ?? [];
  return {
    error,
    isLoading,
    notice,
    clearNotice: () => setNotice(null),
    generating,
    reviewing,
    generate,
    review,
    byKind: (kind: AdBackgroundKind) => rows.filter((row) => row.kind === kind),
    approvedCount: (kind: AdBackgroundKind) => rows.filter((row) => row.kind === kind && row.status === "approved").length,
  };
}
