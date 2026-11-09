"use client";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { useStudioContext } from "../components/StudioProvider";
import { useSchemaForm } from "@/lib/forms/useSchemaForm";
import {
  cancelJob,
  loadDesignJobs,
  loadJob,
  quoteGeneration,
  startGeneration,
} from "../services/studioClientService";
import type {
  StudioAiOperation,
  StudioJob,
  StudioQuality,
  StudioQuote,
} from "../interfaces/studio";
import type { FieldSchema } from "@/lib/forms/fieldSchema";
import type { StudioNode } from "../interfaces/scene";

const fields: FieldSchema[] = [
  {
    name: "instructions",
    label: "¿Qué quieres mejorar?",
    type: "text",
    required: true,
    defaultValue:
      "Mejora la iluminación y usa un fondo limpio, conservando el producto.",
    yupString: (base) => base.max(1000, "Usa hasta 1000 caracteres."),
  },
  {
    name: "operation",
    label: "Acción",
    type: "text",
    defaultValue: "improve_photo",
  },
  { name: "quality", label: "Calidad", type: "text", defaultValue: "economy" },
];
export function useStudioAi(input: {
  tenantId: string;
  designId: string;
  image: StudioNode | undefined;
  available: number;
  ensureAsset: (node: StudioNode) => Promise<string>;
}) {
  const { refresh } = useStudioContext(),
    terminalRefresh = useRef<string | null>(null);
  const [inputImage, setInputImage] = useState<StudioNode | null>(null),
    [open, setOpen] = useState(false),
    [quote, setQuote] = useState<StudioQuote | null>(null),
    [jobId, setJobId] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  const discovery = useSWR(
    ["studio-design-jobs", input.tenantId, input.designId],
    () => loadDesignJobs(input.tenantId, input.designId),
  );
  const activeId = jobId ?? discovery.data?.[0]?.id;
  const job = useSWR(
    activeId ? ["studio-job", input.tenantId, activeId] : null,
    () => loadJob(input.tenantId, activeId!),
    {
      refreshInterval: (data: StudioJob | undefined) =>
        data && ["succeeded", "failed", "cancelled"].includes(data.status)
          ? 0
          : data && Date.now() - new Date(data.created_at).getTime() > 180_000
            ? 10_000
            : data && Date.now() - new Date(data.created_at).getTime() > 60_000
              ? 5000
              : 2500,
    },
  );
  useEffect(() => {
    if (
      !job.data ||
      !["succeeded", "failed", "cancelled"].includes(job.data.status)
    )
      return;
    const key = `${job.data.id}:${job.data.status}`;
    if (terminalRefresh.current !== key) {
      terminalRefresh.current = key;
      void refresh();
    }
  }, [job.data, refresh]);
  const form = useSchemaForm<{
    instructions: string;
    operation: StudioAiOperation;
    quality: StudioQuality;
  }>(fields, async (values) => {
    if (!input.image)
      throw new Error("Sube o selecciona una fotografía antes de usar IA.");
    const original = { ...input.image };
    const asset = await input.ensureAsset(original);
    const result = await quoteGeneration({
      tenant_id: input.tenantId,
      design_id: input.designId,
      asset_id: asset,
      operation: values.operation,
      quality: values.quality,
      instructions: values.instructions,
    });
    if (result.cost > input.available)
      throw new Error(
        `Necesitas ${result.cost} Tlacos para esta propuesta. Tu saldo disponible es ${input.available}. Puedes recargar y conservar el diseño.`,
      );
    setInputImage({ ...original, assetId: asset, imageUrl: undefined });
    form.reset(values);
    setQuote(result);
  });
  async function confirm() {
    if (!quote || busy) return;
    if (quote.cost > input.available) {
      setError(
        "El saldo disponible cambió. Revisa tu monedero antes de confirmar otra propuesta.",
      );
      setQuote(null);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await startGeneration(
        input.tenantId,
        quote.id,
        crypto.randomUUID(),
      );
      setJobId(result.id);
      setQuote(null);
      setOpen(false);
      await Promise.all([discovery.mutate(), refresh()]);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No pudimos iniciar la generación.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function cancel() {
    if (!activeId) return;
    try {
      await cancelJob(input.tenantId, activeId);
      await job.mutate();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "El trabajo ya está en proceso.",
      );
    }
  }
  return {
    inputImage,
    open,
    setOpen,
    quote,
    setQuote,
    form,
    job: job.data,
    busy,
    error,
    confirm,
    cancel,
  };
}
