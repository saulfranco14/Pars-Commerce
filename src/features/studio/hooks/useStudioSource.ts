"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { useSchemaForm } from "@/lib/forms/useSchemaForm";
import {
  createDesign,
  loadIdeas,
  loadSources,
} from "../services/studioClientService";
import { useStudioContext } from "../components/StudioProvider";
import type { FieldSchema } from "@/lib/forms/fieldSchema";
import type { StudioIdea, StudioSourceType } from "../interfaces/studio";

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
    [cursor, setCursor] = useState<string | undefined>(),
    [startingIdea, setStartingIdea] = useState<StudioIdea["key"] | null>(null),
    [ideaError, setIdeaError] = useState<string | null>(null);
  const key = useRef<string | null>(null);
  const sources = useSWR(
    source === "custom"
      ? null
      : ["studio-sources", tenantId, source, query, cursor],
    () => loadSources(tenantId, source, query, cursor),
  );
  const ideas = useSWR(quick ? null : ["studio-ideas", tenantId], () =>
    loadIdeas(tenantId),
  );
  async function create(
    type: StudioSourceType,
    id: string | null,
    title: string,
    idempotencyKey: string,
    open = quick,
  ) {
    const design = await createDesign({
      tenant_id: tenantId,
      source_type: type,
      source_id: id,
      title,
      idempotency_key: idempotencyKey,
    });
    await refresh();
    router.push(
      `/dashboard/${tenantSlug}/studio/disenos/${design.id}${open ? "?compartir=1" : ""}`,
    );
  }
  const form = useSchemaForm<{ title: string }>(fields, async (values) => {
    if (source !== "custom" && !sourceId)
      throw new Error("Selecciona qué vas a anunciar.");
    key.current ??= crypto.randomUUID();
    await create(source, sourceId, values.title, key.current);
  });
  async function startIdea(idea: StudioIdea) {
    if (startingIdea) return;
    setStartingIdea(idea.key);
    setIdeaError(null);
    try {
      await create(
        idea.sourceType,
        idea.sourceId,
        idea.title,
        crypto.randomUUID(),
        false,
      );
    } catch (e) {
      setIdeaError(
        e instanceof Error ? e.message : "No pudimos preparar esta idea.",
      );
      setStartingIdea(null);
    }
  }
  const started = useRef(false);
  useEffect(() => {
    if (quick && initialId && summary?.enabled && !started.current) {
      started.current = true;
      void form.submit({
        title:
          sources.data?.items.find((i) => i.id === initialId)?.name ??
          "Mi anuncio",
      });
    }
  }, [quick, initialId, summary?.enabled, form, sources.data]);
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
    ideas: ideas.data ?? [],
    ideasLoading: ideas.isLoading,
    startIdea,
    startingIdea,
    ideaError,
    busy: form.submitting || Boolean(startingIdea),
    form,
  };
}
