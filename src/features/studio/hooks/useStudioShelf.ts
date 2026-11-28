"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { useStudioContext } from "../components/StudioProvider";
import { createDesign, loadShelf } from "../services/studioClientService";
import { trackStudioFunnel } from "../services/studioAnalyticsClient";
import { endStudioCreating, startStudioCreating } from "./useStudioCreating";
import type { StudioShelfItem } from "../interfaces/studio";

/** The catalog Studio opens on; one tap on Crear makes the ad and opens it. */
export function useStudioShelf() {
  const { tenantId, tenantSlug, refresh } = useStudioContext(),
    router = useRouter(),
    shelf = useSWR(["studio-shelf", tenantId], () => loadShelf(tenantId)),
    [query, setQuery] = useState(""),
    [creating, setCreating] = useState<string | null>(null),
    [error, setError] = useState<string | null>(null);
  const items = useMemo(() => {
    const all = shelf.data?.items ?? [],
      q = query.trim().toLocaleLowerCase("es");
    return q
      ? all.filter((i) => i.name.toLocaleLowerCase("es").includes(q))
      : all;
  }, [shelf.data, query]);

  async function create(item: StudioShelfItem, ai: boolean) {
    if (creating) return;
    setCreating(item.id);
    setError(null);
    startStudioCreating(item.name);
    trackStudioFunnel("studio_create", {
      type: item.type,
      kind: item.kind,
      gaps: item.gaps.join(",") || "none",
      ai,
    });
    try {
      const design = await createDesign({
        tenant_id: tenantId,
        source_type: item.type,
        source_id: item.id,
        title: item.name,
        idempotency_key: crypto.randomUUID(),
      });
      void refresh();
      router.push(
        `/dashboard/${tenantSlug}/studio/disenos/${design.id}${ai ? "?ia=1" : ""}`,
      );
    } catch (e) {
      endStudioCreating();
      setError(e instanceof Error ? e.message : "No pudimos crear el anuncio.");
      setCreating(null);
    }
  }

  return {
    items,
    total: shelf.data?.items.length ?? 0,
    withAd: shelf.data?.items.filter((i) => i.ad).length ?? 0,
    isLoading: shelf.isLoading,
    loadError: shelf.error ? "No pudimos cargar tu catálogo." : null,
    query,
    setQuery,
    create,
    creating,
    error,
    clearError: () => setError(null),
  };
}
