"use client";
import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Check, Eye, Globe } from "lucide-react";
import { FormSheet } from "@/components/ui/FormSheet";
import { FormInput } from "@/components/ui/FormInput";
import { Notification } from "@/components/ui/Notification";
import {
  adminActionButtonPrimary,
  adminActionButtonSecondary,
} from "@/components/admin/actionButtonClasses";
import { useSchemaForm } from "@/lib/forms/useSchemaForm";
import { STUDIO_SURFACES } from "../../constants/studio";
import { reflowStudioScene } from "../../helpers/scene";
import { exportStudioScene } from "../../helpers/canvas";
import {
  applyPlacements,
  uploadStudioAsset,
} from "../../services/studioClientService";
import type { StudioPreparedOutput } from "../../hooks/useStudioOutput";
import type { StudioAsset, StudioSurface } from "../../interfaces/studio";
import type { FieldSchema } from "@/lib/forms/fieldSchema";

export function StudioPlacementSheet({
  open,
  onClose,
  output,
  tenantId,
  assets,
  title,
  destination,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  output: StudioPreparedOutput;
  tenantId: string;
  assets: StudioAsset[];
  title: string;
  destination: string;
  onSuccess: (message: string) => void;
}) {
  const [selected, setSelected] = useState<StudioSurface[]>([]),
    [previews, setPreviews] = useState<
      Array<{ surface: StudioSurface; renderId: string; url: string }>
    >([]),
    [preparing, setPreparing] = useState(false),
    [error, setError] = useState<string | null>(null),
    [results, setResults] = useState<
      Array<{ surface: string; ok: boolean; error?: string }>
    >([]);
  const source = output.version.source_snapshot,
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
    ([, s]) =>
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
        defaultValue: new Date(
          Date.now() - new Date().getTimezoneOffset() * 60000,
        )
          .toISOString()
          .slice(0, 16),
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
          ? new Date(
              new Date(source.validUntil).getTime() -
                new Date(source.validUntil).getTimezoneOffset() * 60000,
            )
              .toISOString()
              .slice(0, 16)
          : "",
      },
    ],
    [title, source.type, source.validUntil],
  );
  const form = useSchemaForm<{ alt: string; start: string; end: string }>(
    fields,
    async (values) => {
      if (
        !selected.length ||
        previews.length !== selected.length ||
        previews.some((p) => !selected.includes(p.surface))
      )
        throw new Error("Prepara y revisa cada vista antes de aplicarla.");
      const signature = JSON.stringify({
        version: output.version.id,
        title,
        destination,
        values,
        previews,
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
        targets: previews.map((p) => ({
          surface: p.surface,
          render_id: p.renderId,
        })),
      });
      setResults(response.results);
      const good = response.results.filter((r) => r.ok).length;
      if (good === response.results.length) {
        onSuccess(
          `Diseño aplicado en ${good} ${good === 1 ? "superficie" : "superficies"}.`,
        );
        onClose();
      } else
        throw new Error(
          "Algunos destinos no se aplicaron. Revisa el resultado de cada superficie; conservamos tu selección y vigencia para reintentar.",
        );
    },
  );
  async function prepare() {
    setPreparing(true);
    setError(null);
    setResults([]);
    try {
      const next = [];
      for (const surface of selected) {
        const scene = reflowStudioScene(
            output.scene,
            STUDIO_SURFACES[surface].format,
          ),
          blob = await exportStudioScene(scene, assets, tenantId);
        const render = await uploadStudioAsset({
          tenantId,
          designId: output.version.design_id,
          file: blob,
          kind: "render",
          versionId: output.version.id,
          surface,
          format: scene.format,
        });
        if (!render.renderId)
          throw new Error("No pudimos preparar esta superficie.");
        next.push({ surface, renderId: render.renderId, url: render.url });
      }
      setPreviews(next);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No pudimos preparar las vistas.",
      );
    } finally {
      setPreparing(false);
    }
  }
  return (
    <FormSheet
      isOpen={open}
      onClose={onClose}
      title="Aplicar en tu negocio"
      description="Elige y revisa cada espacio. Tus fotografías y precios del catálogo se conservan."
      icon={Globe}
      maxWidth="max-w-3xl"
      dismissible={!preparing && !form.submitting}
    >
      <form
        onSubmit={form.handleSubmit(form.submit)}
        className="space-y-5 pb-4"
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {options.map(([surface, s]) => (
            <button
              key={surface}
              type="button"
              aria-pressed={selected.includes(surface)}
              disabled={preparing || form.submitting}
              onClick={() => {
                setSelected((current) =>
                  current.includes(surface)
                    ? current.filter((x) => x !== surface)
                    : [...current, surface],
                );
                setPreviews([]);
              }}
              className={`flex min-h-12 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-sm ${selected.includes(surface) ? "border-accent bg-accent/5" : "border-border"}`}
            >
              <span>{s.label}</span>
              {selected.includes(surface) && (
                <Check className="h-4 w-4 text-accent" />
              )}
            </button>
          ))}
        </div>
        <FormInput
          label="Descripción accesible de la imagen"
          {...form.register("alt")}
          error={form.errors.alt?.message}
        />
        <FormInput
          label={
            source.type === "custom"
              ? "Fin de campaña (obligatorio)"
              : "Fin de publicación"
          }
          type="datetime-local"
          {...form.register("end")}
          error={form.errors.end?.message}
        />
        {error && <Notification tone="error" message={error} />}{" "}
        {form.submitError && (
          <Notification tone="error" message={form.submitError} />
        )}
        <button
          type="button"
          className={adminActionButtonSecondary}
          disabled={!selected.length || preparing || form.submitting}
          onClick={() => void prepare()}
        >
          <Eye className="h-4 w-4" />
          {preparing ? "Preparando…" : "Vista previa"}
        </button>
        <div className="grid gap-4 sm:grid-cols-2">
          {previews.map((p) => (
            <div key={p.surface}>
              <p className="mb-2 text-xs font-bold">
                {STUDIO_SURFACES[p.surface].label}
              </p>
              <Image
                src={p.url}
                alt={title}
                width={1600}
                height={
                  STUDIO_SURFACES[p.surface].format === "banner"
                    ? 700
                    : STUDIO_SURFACES[p.surface].format === "square"
                      ? 1600
                      : 2000
                }
                unoptimized
                className="h-auto w-full rounded-xl border border-border object-contain"
              />
            </div>
          ))}
        </div>
        {results.map((r) => (
          <Notification
            key={r.surface}
            tone={r.ok ? "success" : "error"}
            message={`${STUDIO_SURFACES[r.surface as StudioSurface]?.label}: ${r.ok ? "aplicado" : r.error}`}
          />
        ))}
        <p className="text-xs leading-5 text-muted-foreground">
          Al aplicar se reemplaza la colocación anterior de ese espacio. Si
          programas el inicio, se mostrará el contenido original hasta entonces.
          Una promoción pausada, vencida o con precio cambiado dejará de usar el
          arte. Retirar el anuncio restaura el contenido original.
        </p>
        <button
          className={adminActionButtonPrimary}
          disabled={!previews.length || preparing || form.submitting}
        >
          <Globe className="h-4 w-4" />
          {form.submitting ? "Publicando…" : "Publicar"}
        </button>
      </form>
    </FormSheet>
  );
}
