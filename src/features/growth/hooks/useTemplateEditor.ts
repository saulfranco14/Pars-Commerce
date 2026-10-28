import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import { validateTemplate } from "@/features/growth/helpers/validateTemplate";
import { TEMPLATE_STEPS } from "@/features/growth/constants/templateVariables";
import { previewTemplate, saveTemplate, setTemplateStatus, templatesKey } from "@/features/growth/services/growthClient";
import { swrFetcher } from "@/lib/swrFetcher";

import type { GrowthTemplate, TemplateChannel, TemplatePreview, TemplateStep, TemplateVariant } from "@/features/growth/interfaces/template";

interface Selection {
  channel: TemplateChannel;
  giro: string;
  step: TemplateStep;
  variant: TemplateVariant;
}

const sameSlot = (template: GrowthTemplate, selection: Selection) =>
  template.channel === selection.channel && (template.giro ?? "") === selection.giro && template.step === selection.step && template.variant === selection.variant;

export function useTemplateEditor() {
  const { data, error, isLoading, mutate } = useSWR<GrowthTemplate[]>(templatesKey, swrFetcher);
  const [selection, setSelection] = useState<Selection>({ channel: "whatsapp", giro: "", step: "m1", variant: "A" });
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [preview, setPreview] = useState<TemplatePreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const clearNotice = useCallback(() => setNotice(null), []);

  const templates = useMemo(() => data ?? [], [data]);
  const versions = useMemo(() => templates.filter((template) => sameSlot(template, selection)), [templates, selection]);
  const live = versions.find((template) => template.status !== "archived") ?? null;
  // A giro without its own version inherits the generic one.
  const inherited = !live && selection.giro
    ? templates.find((template) => sameSlot(template, { ...selection, giro: "" }) && template.status !== "archived") ?? null
    : null;
  const source = live ?? inherited;

  useEffect(() => {
    setSubject(source?.subject ?? "");
    setBody(source?.body ?? "");
    setPreview(null);
  }, [source?.id, source?.subject, source?.body]);

  const draft = { ...selection, giro: selection.giro || null, subject: selection.channel === "email" ? subject : null, body };
  const errors = body ? validateTemplate(draft) : [];
  const dirty = body !== (source?.body ?? "") || (selection.channel === "email" && subject !== (source?.subject ?? ""));

  function select(patch: Partial<Selection>) {
    setSelection((current) => {
      const next = { ...current, ...patch };
      if (patch.channel && !TEMPLATE_STEPS[patch.channel].some((step) => step.value === next.step)) next.step = TEMPLATE_STEPS[patch.channel][0].value;
      return next;
    });
  }

  function insertVariable(key: string) {
    setBody((current) => `${current}${current.endsWith(" ") || !current ? "" : " "}{${key}}`);
  }

  async function runPreview() {
    try {
      setPreview(await previewTemplate(draft));
    } catch (err) {
      setNotice({ tone: "error", message: err instanceof Error ? err.message : "No pudimos generar la vista previa." });
    }
  }

  async function save() {
    if (errors.length) return;
    setBusy(true);
    try {
      const saved = await saveTemplate(draft);
      setNotice({ tone: "success", message: `Guardado como versión ${saved.version}. Aplica a lo que salga desde ahora.` });
      await mutate();
    } catch (err) {
      setNotice({ tone: "error", message: err instanceof Error ? err.message : "No pudimos guardar el mensaje." });
    } finally {
      setBusy(false);
    }
  }

  async function toggleLive() {
    if (!live) return;
    setBusy(true);
    try {
      await setTemplateStatus(live.id, live.status === "active" ? "paused" : "active");
      setNotice({ tone: "success", message: live.status === "active" ? "Variante pausada." : "Variante activa." });
      await mutate();
    } catch (err) {
      setNotice({ tone: "error", message: err instanceof Error ? err.message : "No pudimos cambiar el estado." });
    } finally {
      setBusy(false);
    }
  }

  return {
    error, isLoading, selection, select, subject, setSubject, body, setBody, insertVariable,
    versions, live, inherited, errors, dirty, preview, runPreview, save, toggleLive, busy, notice, clearNotice,
  };
}
