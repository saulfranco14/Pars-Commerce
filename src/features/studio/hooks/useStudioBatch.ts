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
import type { StudioBatchPhase, StudioBatchRow } from "../interfaces/ui";

type BatchItem = { id: string; name: string };

/** Loads up to the batch maximum of items, then creates ads in small chunks and runs their images one by one. */
export function useStudioBatch() {
  const { tenantId, refresh } = useStudioContext(),
    [sourceType, setSourceType] =
      useState<StudioBatchRequest["sourceType"]>("product"),
    [items, setItems] = useState<BatchItem[]>([]),
    [loading, setLoading] = useState(true),
    [selected, setSelected] = useState<string[]>([]),
    [phase, setPhase] = useState<StudioBatchPhase>("pick"),
    [runMode, setRunMode] = useState<StudioBatchRequest["mode"]>("shared"),
    [rows, setRows] = useState<StudioBatchRow[]>([]),
    [imageStartedAt, setImageStartedAt] = useState<number | null>(null),
    [error, setError] = useState<string | null>(null);
  const patch = (
    ids: string[],
    change: (row: StudioBatchRow) => Partial<StudioBatchRow> | null,
  ) =>
    setRows((current) =>
      current.map((row) => {
        if (!ids.includes(row.id)) return row;
        const next = change(row);
        return next ? { ...row, ...next } : row;
      }),
    );
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
      batchKey = crypto.randomUUID(),
      jobs: Array<{ jobId: string; rowId: string }> = [];
    setPhase("creating");
    setRunMode(options.mode);
    setError(null);
    setImageStartedAt(null);
    setRows(chosen.map((c) => ({ id: c.id, name: c.name, status: "waiting" })));
    try {
      for (let i = 0; i < chosen.length; i += STUDIO_BATCH_CHUNK) {
        const chunk = chosen.slice(i, i + STUDIO_BATCH_CHUNK),
          ids = chunk.map((c) => c.id);
        patch(ids, () => ({ status: "creating" }));
        const result = await createBatch({
          tenantId,
          batchKey,
          sourceType,
          items: chunk,
          ...options,
        });
        for (const design of result.designs) {
          const job = result.jobs.find((j) => j.designId === design.id);
          if (job) jobs.push({ jobId: job.id, rowId: design.sourceId });
          patch([design.sourceId], () => ({
            designId: design.id,
            status: job
              ? "queued"
              : options.mode === "shared"
                ? "done"
                : "failed",
          }));
        }
        for (const skip of result.skipped)
          patch([skip.id], () => ({ status: "failed", reason: skip.reason }));
        patch(ids, (row) =>
          row.status === "creating"
            ? { status: "failed", reason: "No se pudo crear." }
            : null,
        );
      }
      for (const { jobId, rowId } of jobs) {
        patch([rowId], () => ({ status: "image" }));
        setImageStartedAt(Date.now());
        const job = await runJob(tenantId, jobId, true).catch(() => null);
        patch([rowId], () =>
          job?.status === "succeeded"
            ? { status: "done", imageUrl: job.result_url ?? undefined }
            : job?.status === "failed" || job?.status === "cancelled"
              ? {
                  status: "failed",
                  reason: "No salió la imagen. No se cobró ningún Tlaco.",
                }
              : {
                  status: "later",
                  reason: "Se termina cuando vuelvas a Studio.",
                },
        );
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "La tanda se detuvo. Lo creado se conserva.",
      );
      setRows((current) =>
        current.map((row) =>
          row.status === "waiting" || row.status === "creating"
            ? { ...row, status: "failed", reason: "No se creó." }
            : row,
        ),
      );
    } finally {
      setImageStartedAt(null);
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
    runMode,
    rows,
    imageStartedAt,
    error,
    start,
    reset: () => setPhase("pick"),
  };
}
