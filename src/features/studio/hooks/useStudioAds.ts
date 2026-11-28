"use client";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { useStudioContext } from "../components/StudioProvider";
import { useStudioLibrary } from "./useStudioLibrary";
import { loadPlacements, loadStaleAds } from "../services/studioClientService";
import { studioAdStateOf } from "../helpers/adState";
import type { STUDIO_AD_FILTERS } from "../constants/studio";

export type StudioAdFilter = (typeof STUDIO_AD_FILTERS)[number]["id"];
/** Pause after the last keystroke before searching. */
const SEARCH_DELAY_MS = 300;

/** Every ad with where it stands, searchable and filterable. */
export function useStudioAds() {
  const { tenantId, summary } = useStudioContext(),
    canPublish = Boolean(
      summary?.publishEnabled && summary.permissions.includes("studio.publish"),
    ),
    library = useStudioLibrary(),
    placements = useSWR(
      canPublish ? ["studio-placements", tenantId] : null,
      () => loadPlacements(tenantId),
    ),
    stale = useSWR(canPublish ? ["studio-stale", tenantId] : null, () =>
      loadStaleAds(tenantId),
    ),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState<StudioAdFilter>("all");
  const { setQuery } = library,
    memoryKey = `studio-ads:${tenantId}`;
  // Back from an ad, the list keeps the search and filter it had.
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(memoryKey) ?? "null");
      if (typeof saved?.search === "string") setSearch(saved.search);
      // «Actualizando» is over by the time they come back.
      if (typeof saved?.filter === "string" && saved.filter !== "updating")
        setFilter(saved.filter);
    } catch {
      /* storage blocked */
    }
  }, [memoryKey]);
  useEffect(() => {
    try {
      sessionStorage.setItem(memoryKey, JSON.stringify({ search, filter }));
    } catch {
      /* storage blocked */
    }
  }, [memoryKey, search, filter]);
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [search, setQuery]);

  const live = useMemo(
      () =>
        new Set(
          (placements.data ?? [])
            .filter((p) => p.is_active)
            .map((p) => p.design_id),
        ),
      [placements.data],
    ),
    updating = useMemo(
      () => new Set((stale.data ?? []).map((s) => s.design_id)),
      [stale.data],
    ),
    all = library.items.map((design) => ({
      design,
      state: studioAdStateOf(design, live, updating),
    }));

  return {
    canPublish,
    search,
    setSearch,
    filter,
    setFilter,
    hasUpdating: updating.size > 0,
    items: filter === "all" ? all : all.filter((a) => a.state === filter),
    all,
    library,
    refresh: () => {
      void placements.mutate();
      void stale.mutate();
      void library.refresh();
    },
  };
}
