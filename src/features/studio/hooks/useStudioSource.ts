"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { useSchemaForm } from "@/lib/forms/useSchemaForm";
import { createDesign, loadSources } from "../services/studioClientService";
import { useStudioContext } from "../components/StudioProvider";
import type { FieldSchema } from "@/lib/forms/fieldSchema";
import type { StudioSourceType } from "../interfaces/studio";

const fields: FieldSchema[] = [
  {
    name: "title",
    label: "Nombre del diseño",
    type: "text",
    required: true,
    defaultValue: "Mi anuncio",
    yupString: (base) => base.max(120, "Usa hasta 120 caracteres."),
  },
];
export function useStudioSource(
  initialSource: StudioSourceType,
  initialId: string | null,
  quick = false,
) {
  const { tenantId, tenantSlug, refresh, summary } = useStudioContext(),
    router = useRouter();
  const [source, setSourceValue] = useState(initialSource),
    [sourceId, setSourceId] = useState<string | null>(initialId),
    [query, setQuery] = useState(""),
    [cursor, setCursor] = useState<string | undefined>();
  const key = useRef<string | null>(null);
  const sources = useSWR(
    source === "custom"
      ? null
      : ["studio-sources", tenantId, source, query, cursor],
    () => loadSources(tenantId, source, query, cursor),
  );
  const form = useSchemaForm<{ title: string }>(fields, async (values) => {
    if (source !== "custom" && !sourceId)
      throw new Error("Selecciona qué vas a anunciar.");
    key.current ??= crypto.randomUUID();
    const design = await createDesign({
      tenant_id: tenantId,
      source_type: source,
      source_id: sourceId,
      title: values.title,
      idempotency_key: key.current,
    });
    await refresh();
    router.push(
      `/dashboard/${tenantSlug}/studio/disenos/${design.id}${quick ? "?compartir=1" : ""}`,
    );
  });
  const started = useRef(false);
  useEffect(() => {
    if (
      quick &&
      initialId &&
      summary?.active &&
      summary.enabled &&
      !started.current
    ) {
      started.current = true;
      void form.submit({
        title:
          sources.data?.items.find((i) => i.id === initialId)?.name ??
          "Mi anuncio",
      });
    }
  }, [quick, initialId, summary?.active, summary?.enabled, form, sources.data]);
  function setSource(value: StudioSourceType) {
    setSourceValue(value);
    setSourceId(null);
    setCursor(undefined);
    key.current = null;
  }
  return {
    source,
    setSource,
    sourceId,
    setSourceId: (id: string | null) => {
      key.current = null;
      setSourceId(id);
    },
    query,
    setQuery,
    items: sources.data?.items ?? [],
    next: () => setCursor(sources.data?.nextCursor ?? undefined),
    hasNext: Boolean(sources.data?.nextCursor),
    isLoading: sources.isLoading,
    sourceError: sources.error,
    form,
  };
}
