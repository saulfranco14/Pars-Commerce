"use client";
import { useMemo } from "react";
import { CheckCircle2 } from "lucide-react";
import { StudioScenePreview } from "./StudioScenePreview";
import { STUDIO_TEMPLATES } from "../../constants/studio";
import { restyleStudioScene } from "../../helpers/sceneStyle";
import type { StudioDesignGalleryProps } from "../../interfaces/ui";

export function StudioDesignGallery({
  scene,
  source,
  assets,
  tenantId,
  disabled,
  onPick,
}: StudioDesignGalleryProps) {
  const current = scene.template ?? "clean";
  const options = useMemo(
    () =>
      STUDIO_TEMPLATES.map((template) => ({
        template,
        scene: restyleStudioScene(scene, source, template.id),
      })),
    [scene, source],
  );
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-bold">Elige un diseño</h2>
        <p className="text-xs text-muted-foreground">
          Ya vienen con tu foto y tu precio. Cambiar de diseño no cuesta
          Tlacos.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
        {options.map(({ template, scene: option }) => {
          const selected = current === template.id;
          return (
            <button
              key={template.id}
              type="button"
              aria-pressed={selected}
              aria-label={`Diseño ${template.name}`}
              disabled={disabled}
              onClick={() => onPick(template.id)}
              className={`flex cursor-pointer flex-col gap-2 rounded-2xl border-2 bg-surface p-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60 ${selected ? "border-accent" : "border-border hover:border-accent/40"}`}
            >
              <div className="pointer-events-none overflow-hidden rounded-xl">
                <StudioScenePreview
                  scene={option}
                  assets={assets}
                  tenantId={tenantId}
                />
              </div>
              <span className="flex items-center justify-between gap-2 px-1.5 pb-1 text-sm font-semibold">
                {template.name}
                {selected && (
                  <CheckCircle2 className="h-4 w-4 text-accent" aria-hidden />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
