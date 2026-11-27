"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Globe, Loader2 } from "lucide-react";
import { FormSheet } from "@/components/ui/FormSheet";
import { FormInput } from "@/components/ui/FormInput";
import { Notification } from "@/components/ui/Notification";
import { StudioPublishSteps } from "./StudioPublishSteps";
import { adminActionButtonPrimary } from "@/components/admin/actionButtonClasses";
import { useSchemaForm } from "@/lib/forms/useSchemaForm";
import {
  STUDIO_DEFAULT_SURFACE,
  STUDIO_RETIRED_SURFACES,
  STUDIO_SURFACES,
} from "../../constants/studio";
import { reflowStudioScene } from "../../helpers/scene";
import { exportStudioScene } from "../../helpers/canvas";
import {
  applyPlacements,
  uploadStudioAsset,
} from "../../services/studioClientService";
import type { StudioSurface } from "../../interfaces/studio";
import type {
  StudioPlacementSheetProps,
  StudioPublishPhase,
} from "../../interfaces/ui";
import type { FieldSchema } from "@/lib/forms/fieldSchema";

const FORM_ID = "studio-placement-form";

/** Local datetime value (yyyy-mm-ddThh:mm) for a datetime-local input. */
const localValue = (date: Date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

/** Tick the spaces and publish; files are prepared quietly and the steps show what is left. */
export function StudioPlacementSheet({
  open,
  onClose,
  output,
  tenantId,
  assets,
  title,
  destination,
  onSuccess,
}: StudioPlacementSheetProps) {
  const [selected, setSelected] = useState<StudioSurface[]>([]),
    [jobs, setJobs] = useState<
      Partial<Record<StudioSurface, StudioPublishPhase>>
    >({}),
    [publishing, setPublishing] = useState(false),
    [error, setError] = useState<string | null>(null),
    [results, setResults] = useState<
      Array<{ surface: string; ok: boolean; error?: string }>
    >([]);
  const source = output.version.source_snapshot,
    pending = useRef<Partial<Record<StudioSurface, Promise<string | null>>>>(
      {},
    ),
    request = useRef<{
      signature: string;
      key: string;
      startsAt: string;
    } | null>(null);
  const options = (
    Object.entries(STUDIO_SURFACES) as Array<
      [StudioSurface, (typeof STUDIO_SURFACES)[StudioSurface]]
    >
  ).filter(
    ([surface, s]) =>
      !STUDIO_RETIRED_SURFACES.includes(surface) &&
      s.sources.includes(source.type) &&
      (source.type !== "promotion" ||
        source.channels.includes(
          s.channel === "table_qr" ? "onsite" : "public_store",
        )),
  );
  const fields = useMemo<FieldSchema[]>(
    () => [
      {
        name: "alt",
        label: "Descripción de la imagen",
        type: "text",
        required: true,
        defaultValue: title,
        yupString: (b) => b.max(300),
      },
      {
        name: "start",
        label: "Inicio de publicación",
        type: "text",
        required: true,
        defaultValue: localValue(new Date()),
        yupString: (b) =>
          b.test(
            "valid-start",
            "Elige una fecha de inicio válida.",
            (value) => Boolean(value) && Number.isFinite(Date.parse(value!)),
          ),
      },
      {
        name: "end",
        label: "Fin de vigencia",
        type: "text",
        required: source.type === "custom",
        defaultValue: source.validUntil
          ? localValue(new Date(source.validUntil))
          : "",
      },
    ],
    [title, source.type, source.validUntil],
  );
  const form = useSchemaForm<{ alt: string; start: string; end: string }>(
    fields,
    async (values) => {
      setPublishing(true);
      const ids = await Promise.all(
        selected.map((surface) => pending.current[surface] ?? render(surface)),
      );
      if (ids.some((id) => !id)) {
        setPublishing(false);
        throw new Error(
          "No pudimos preparar un espacio. Toca Publicar otra vez.",
        );
      }
      const targets = selected.map((surface, i) => ({
        surface,
        render_id: ids[i]!,
      }));
      const signature = JSON.stringify({
        version: output.version.id,
        title,
        destination,
        values,
        targets,
      });
      if (request.current?.signature !== signature)
        request.current = {
          signature,
          key: crypto.randomUUID(),
          startsAt: new Date(values.start).toISOString(),
        };
      const response = await applyPlacements({
        tenant_id: tenantId,
        idempotency_key: request.current.key,
        version_id: output.version.id,
        title,
        alt_text: values.alt,
        destination_url: destination,
        starts_at: request.current.startsAt,
        ends_at: values.end ? new Date(values.end).toISOString() : null,
        targets,
      });
      setResults(response.results);
      const good = response.results.filter((r) => r.ok).length;
      if (good === response.results.length) {
        onSuccess(
          good === 1
            ? "Listo: tu anuncio ya está publicado."
            : `Listo: tu anuncio ya está en ${good} espacios.`,
        );
        onClose();
      } else {
        setPublishing(false);
        throw new Error(
          "Algunos espacios no se publicaron. Revisa cada uno abajo; tu selección se conserva para reintentar.",
        );
      }
    },
  );

  function render(surface: StudioSurface): Promise<string | null> {
    const task = draw(surface);
    pending.current[surface] = task;
    void task.then((id) => {
      if (!id) delete pending.current[surface];
    });
    return task;
  }

  async function draw(surface: StudioSurface): Promise<string | null> {
    const phase = (next: StudioPublishPhase) =>
      setJobs((current) => ({ ...current, [surface]: next }));
    phase("drawing");
    setError(null);
    try {
      const scene = reflowStudioScene(
          output.scene,
          STUDIO_SURFACES[surface].format,
        ),
        blob = await exportStudioScene(scene, assets, tenantId);
      phase("uploading");
      const stored = await uploadStudioAsset({
        tenantId,
        designId: output.version.design_id,
        file: blob,
        kind: "render",
        versionId: output.version.id,
        surface,
        format: scene.format,
      });
      if (!stored.renderId)
        throw new Error("No pudimos preparar este espacio.");
      phase("ready");
      return stored.renderId;
    } catch (e) {
      setJobs((current) => ({ ...current, [surface]: undefined }));
      setError(
        e instanceof Error ? e.message : "No pudimos preparar este espacio.",
      );
      return null;
    }
  }

  function toggle(surface: StudioSurface) {
    setResults([]);
    if (selected.includes(surface)) {
      setSelected((current) => current.filter((s) => s !== surface));
      return;
    }
    setSelected((current) => [...current, surface]);
    if (!pending.current[surface]) void render(surface);
  }

  const started = useRef(false);
  useEffect(() => {
    if (!open || started.current) return;
    started.current = true;
    const preferred = STUDIO_DEFAULT_SURFACE[source.type];
    if (options.some(([surface]) => surface === preferred)) {
      setSelected([preferred]);
      void render(preferred);
    }
    // Ticks the item's own page once, when the sheet first opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const busy = form.submitting,
    status = !selected.length
      ? "Elige al menos un espacio."
      : selected.length === 1
        ? "Se publica en 1 espacio. Publicar no cuesta."
        : `Se publica en ${selected.length} espacios. Publicar no cuesta.`;
  return (
    <FormSheet
      isOpen={open}
      onClose={onClose}
      title="Publicar en tu negocio"
      description="Elige dónde lo verán tus clientes. Publicar no cuesta."
      icon={Globe}
      maxWidth="max-w-3xl"
      dismissible={!form.submitting}
      footer={
        <div className="space-y-2">
          <p
            className="text-center text-xs text-muted-foreground sm:text-right"
            aria-live="polite"
          >
            {status}
          </p>
          <div className="flex justify-end">
            <button
              type="submit"
              form={FORM_ID}
              className={`${adminActionButtonPrimary} w-full sm:w-auto`}
              disabled={!selected.length || busy}
            >
              {form.submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Globe className="h-4 w-4" />
              )}
              {form.submitting ? "Publicando…" : "Publicar"}
            </button>
          </div>
        </div>
      }
    >
      <form
        id={FORM_ID}
        onSubmit={form.handleSubmit(form.submit)}
        className="space-y-5 pb-2"
      >
        {publishing ? (
          <StudioPublishSteps
            phases={selected.map((surface) => jobs[surface] ?? "drawing")}
          />
        ) : (
          <>
            <fieldset className="space-y-2">
              <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Dónde
              </legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {options.map(([surface, s]) => {
                  const on = selected.includes(surface);
                  return (
                    <button
                      key={surface}
                      type="button"
                      aria-pressed={on}
                      disabled={form.submitting}
                      onClick={() => toggle(surface)}
                      className={`flex min-w-0 cursor-pointer flex-col gap-2 rounded-xl border p-3 text-left transition-colors disabled:cursor-not-allowed ${on ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"}`}
                    >
                      <span className="flex items-start justify-between gap-3">
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold">
                            {s.label}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {s.hint}
                          </span>
                        </span>
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${on ? "border-accent bg-accent text-accent-foreground" : "border-border"}`}
                        >
                          {on && <Check className="h-3.5 w-3.5" aria-hidden />}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <FormInput
              label="Descripción de la imagen"
              hint="La leen quienes usan lector de pantalla."
              {...form.register("alt")}
              error={form.errors.alt?.message}
            />
            <FormInput
              label={
                source.type === "custom"
                  ? "Hasta cuándo (obligatorio)"
                  : "Hasta cuándo"
              }
              hint={
                source.type === "custom"
                  ? undefined
                  : "Si lo dejas vacío, sigue hasta que lo retires."
              }
              type="datetime-local"
              {...form.register("end")}
              error={form.errors.end?.message}
            />
          </>
        )}
        {error && <Notification tone="error" message={error} />}
        {form.submitError && (
          <Notification tone="error" message={form.submitError} />
        )}
        {results.map((r) => (
          <Notification
            key={r.surface}
            tone={r.ok ? "success" : "error"}
            message={`${STUDIO_SURFACES[r.surface as StudioSurface]?.label}: ${r.ok ? "publicado" : r.error}`}
          />
        ))}
        {!publishing && (
          <ul className="list-disc space-y-1 pl-4 text-xs leading-5 text-muted-foreground">
            <li>Reemplaza lo que hoy esté publicado en ese espacio.</li>
            <li>
              Si la promoción se pausa, vence o cambia de precio, se retira
              sola.
            </li>
            <li>Al retirarlo vuelve lo que había antes.</li>
          </ul>
        )}
      </form>
    </FormSheet>
  );
}
