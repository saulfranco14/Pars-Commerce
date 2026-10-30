import { useState } from "react";
import useSWR from "swr";

import { importsKey, previewImport, startImport, uploadCsv } from "@/features/growth/services/growthClient";
import { swrFetcher } from "@/lib/swrFetcher";

import type { CsvImportResult, GrowthImport, ImportInput, ImportPreview } from "@/features/growth/interfaces/importJob";

/** Import screen: preview a DENUE choice, start it, follow its progress, or upload a list. */
export function useImports() {
  const list = useSWR<GrowthImport[]>(importsKey, swrFetcher, {
    refreshInterval: (data) => (data?.some((job) => job.status === "queued" || job.status === "running") ? 5_000 : 0),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [csvResult, setCsvResult] = useState<CsvImportResult | null>(null);

  async function run<T>(action: () => Promise<T>): Promise<T | null> {
    setBusy(true);
    setError(null);
    try {
      return await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos completar la importación.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  return {
    jobs: list.data ?? [],
    loading: list.isLoading,
    busy,
    error,
    preview,
    csvResult,
    clearPreview: () => setPreview(null),
    loadPreview: async (input: ImportInput) => setPreview(await run(() => previewImport(input))),
    start: async (input: ImportInput) => {
      const job = await run(() => startImport(input));
      if (job) {
        setPreview(null);
        await list.mutate();
      }
      return Boolean(job);
    },
    upload: async (csv: string, assignTo: string | null) => {
      const result = await run(() => uploadCsv({ csv, assignTo }));
      setCsvResult(result);
      if (result) await list.mutate();
    },
  };
}
