"use client";
import { useEffect, useState } from "react";
import { useStudioContext } from "../components/StudioProvider";
import {
  createBatch,
  loadSources,
  runJob,
} from "../services/studioClientService";
import { STUDIO_BATCH_CHUNK, STUDIO_BATCH_MAX } from "../constants/studio";
import type { StudioBatchRequest } from "../interfaces/studio";

type BatchItem = { id: string; name: string };
type BatchPhase = "pick" | "creating" | "done";

/** Loads up to the batch maximum of items, then creates ads in small chunks and runs their images one by one. */
export function useStudioBatch() {
  const { tenantId, refresh } = useStudioContext(),
    [sourceType, setSourceType] =
      useState<StudioBatchRequest["sourceType"]>("product"),
    [items, setItems] = useState<BatchItem[]>([]),
    [loading, setLoading] = useState(true),
    [selected, setSelected] = useState<string[]>([]),
    [phase, setPhase] = useState<BatchPhase>("pick"),
    [progress, setProgress] = useState({ done: 0, total: 0 }),
    [created, setCreated] = useState(0),
    [skipped, setSkipped] = useState<Array<{ name: string; reason: string }>>(
      [],
    ),
    [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const all: BatchItem[] = [];
      let cursor: string | undefined;
      try {
        do {
          const page = await loadSources(tenantId, sourceType, "", cursor);
          all.push(...page.items);
          cursor = page.nextCursor ?? undefined;
        } while (cursor && all.length < STUDIO_BATCH_MAX * 2 && !cancelled);
      } catch {
        if (!cancelled) setError("No pudimos cargar tu catálogo.");
      }
      if (!cancelled) {
        setItems(all);
        setSelected([]);
        setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [tenantId, sourceType]);
  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((x) => x !== id)
        : current.length < STUDIO_BATCH_MAX
          ? [...current, id]
          : current,
    );
  }
  function selectAll() {
    setSelected(
      selected.length
        ? []
        : items.slice(0, STUDIO_BATCH_MAX).map((item) => item.id),
    );
  }
  async function start(
    options: Pick<
      StudioBatchRequest,
      "mode" | "assetId" | "template" | "scene" | "quality"
    >,
  ) {
    const chosen = items.filter((item) => selected.includes(item.id)),
      batchKey = crypto.randomUUID();
    setPhase("creating");
    setError(null);
    setSkipped([]);
    setCreated(0);
    setProgress({ done: 0, total: chosen.length });
    const jobs: string[] = [];
    try {
      for (let i = 0; i < chosen.length; i += STUDIO_BATCH_CHUNK) {
        const chunk = chosen.slice(i, i + STUDIO_BATCH_CHUNK);
        const result = await createBatch({
          tenantId,
          batchKey,
          sourceType,
          items: chunk,
          ...options,
        });
        jobs.push(...result.jobs.map((job) => job.id));
        setCreated((n) => n + result.designs.length);
        setSkipped((current) => [
          ...current,
          ...result.skipped.map((s) => ({
            name: chunk.find((c) => c.id === s.id)?.name ?? "",
            reason: s.reason,
          })),
        ]);
        if (options.mode === "shared")
          setProgress((p) => ({ ...p, done: p.done + chunk.length }));
      }
      if (options.mode === "each") {
        setProgress({ done: 0, total: jobs.length });
        for (const job of jobs) {
          await runJob(tenantId, job, true).catch(() => {});
          setProgress((p) => ({ ...p, done: p.done + 1 }));
        }
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "La tanda se detuvo. Lo creado se conserva.",
      );
    } finally {
      setPhase("done");
      void refresh();
    }
  }
  return {
    sourceType,
    setSourceType,
    items,
    loading,
    selected,
    toggle,
    selectAll,
    phase,
    progress,
    created,
    skipped,
    error,
    start,
    reset: () => setPhase("pick"),
  };
}
