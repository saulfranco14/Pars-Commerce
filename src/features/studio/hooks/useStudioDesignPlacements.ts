"use client";
import { useState } from "react";
import useSWR from "swr";
import { useStudioContext } from "../components/StudioProvider";
import {
  loadPlacements,
  removePlacement,
} from "../services/studioClientService";

/** Where this ad is live right now, and a way to take it down from the ad itself. */
export function useStudioDesignPlacements(designId: string) {
  const { tenantId, summary } = useStudioContext(),
    canPublish = Boolean(summary?.permissions.includes("studio.publish")),
    placements = useSWR(
      canPublish ? ["studio-placements", tenantId] : null,
      () => loadPlacements(tenantId),
    ),
    [retiring, setRetiring] = useState(false),
    [error, setError] = useState<string | null>(null);
  const live = (placements.data ?? []).filter(
    (p) => p.design_id === designId && p.is_active,
  );
  async function retireAll() {
    setRetiring(true);
    setError(null);
    try {
      for (const placement of live)
        await removePlacement(tenantId, placement.id);
      await placements.mutate();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos retirarlo.");
      return false;
    } finally {
      setRetiring(false);
    }
  }
  return {
    live,
    retireAll,
    retiring,
    error,
    refresh: () => void placements.mutate(),
  };
}
