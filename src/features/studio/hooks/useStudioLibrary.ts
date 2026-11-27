"use client";
import { useCallback, useState } from "react";
import useSWRInfinite from "swr/infinite";
import { useStudioContext } from "../components/StudioProvider";
import {
  downloadStudioBlob,
  duplicateDesign,
  loadLibrary,
  loadRenders,
  saveDesign,
} from "../services/studioClientService";
import type { StudioDesign } from "../interfaces/studio";

export function useStudioLibrary() {
  const { tenantId, refresh } = useStudioContext();
  const [query, setQuery] = useState(""),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  const {
    data,
    isLoading,
    mutate,
    size,
    setSize,
    error: loadError,
  } = useSWRInfinite(
    (index, previous: { nextCursor: string | null } | null) =>
      index > 0 && !previous?.nextCursor
        ? null
        : [
            "studio-library",
            tenantId,
            query,
            status,
            index === 0 ? "" : (previous?.nextCursor ?? ""),
          ],
    ([, tenant, q, s, cursor]: string[]) =>
      loadLibrary(tenant, q, s, cursor || undefined),
  );
  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await Promise.all([mutate(), refresh()]);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No pudimos completar la acción.",
      );
    } finally {
      setBusy(false);
    }
  }
  function duplicate(design: StudioDesign) {
    return run(() => duplicateDesign(tenantId, design.id));
  }
  function archive(design: StudioDesign) {
    return run(() =>
      saveDesign(design.id, {
        tenant_id: tenantId,
        revision: design.revision,
        scene: design.draft_scene,
        title: design.title,
        copy: design.copy,
        destination_url: design.destination_url,
        status: "archived",
      }),
    );
  }
  function download(design: StudioDesign) {
    return run(async () => {
      const renders = await loadRenders(tenantId, design.id);
      const render = renders.find((r) => r.surface === "social") ?? renders[0];
      if (!render)
        throw new Error("Abre el diseño y prepara su primera exportación.");
      const blob = await downloadStudioBlob(render.url);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${design.title}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }
  return {
    refresh: useCallback(() => mutate(), [mutate]),
    items: data?.flatMap((page) => page.items) ?? [],
    isLoading,
    error: error ?? loadError?.message,
    busy,
    query,
    setQuery,
    status,
    setStatus,
    duplicate,
    archive,
    download,
    hasMore: Boolean(data?.at(-1)?.nextCursor),
    loadMore: () => setSize(size + 1),
  };
}
