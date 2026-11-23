"use client";
import { useMemo } from "react";
import { Check, LayoutTemplate, Move } from "lucide-react";
import { FormSheet } from "@/components/ui/FormSheet";
import { StudioScenePreview } from "./StudioScenePreview";
import {
  adminActionButtonPrimary,
  adminActionButtonText,
} from "@/components/admin/actionButtonClasses";
import { STUDIO_POSTER_STYLES } from "../../constants/studio";
import { restyleStudioScene } from "../../helpers/sceneStyle";
import type { StudioStyleSheetProps } from "../../interfaces/ui";

export function StudioStyleSheet({
  open,
  onClose,
  disabled,
  scene,
  source,
  assets,
  tenantId,
  onApply,
  onAdvanced,
}: StudioStyleSheetProps) {
  const options = useMemo(
    () =>
      open
        ? STUDIO_POSTER_STYLES.map((style) => ({
            style,
            scene: restyleStudioScene(scene, source, style.id),
          }))
        : [],
    [open, scene, source],
  );
  return (
    <FormSheet
      isOpen={open}
      onClose={onClose}
      title="Estilo"
      description="Cambia cómo se acomodan las letras sobre tu imagen. No cuesta."
      icon={LayoutTemplate}
      footer={
        <button
          type="button"
          onClick={onClose}
          className={`${adminActionButtonPrimary} w-full`}
        >
          <Check className="h-4 w-4" />
          Listo
        </button>
      }
    >
      <div className="space-y-4 pb-3">
        <div className="grid grid-cols-3 gap-2">
          {options.map(({ style, scene: option }) => (
            <button
              key={style.id}
              type="button"
              disabled={disabled}
              aria-pressed={scene.template === style.id}
              onClick={() => onApply(option)}
              className={`flex cursor-pointer flex-col gap-1.5 rounded-xl border-2 p-1 text-xs font-semibold disabled:opacity-60 ${scene.template === style.id ? "border-accent" : "border-transparent"}`}
            >
              <span className="pointer-events-none block overflow-hidden rounded-lg">
                <StudioScenePreview
                  scene={option}
                  assets={assets}
                  tenantId={tenantId}
                />
              </span>
              {style.name}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onAdvanced}
          className={`${adminActionButtonText} w-full`}
        >
          <Move className="h-4 w-4" />
          Editar a mano
        </button>
      </div>
    </FormSheet>
  );
}
