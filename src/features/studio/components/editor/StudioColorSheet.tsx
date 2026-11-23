"use client";
import { Check, Palette } from "lucide-react";
import { FormInput } from "@/components/ui/FormInput";
import { FormSheet } from "@/components/ui/FormSheet";
import { adminActionButtonPrimary } from "@/components/admin/actionButtonClasses";
import { STUDIO_PALETTES } from "../../constants/studio";
import {
  recolorStudioScene,
  studioPaletteId,
} from "../../helpers/sceneStyle";
import type { StudioColorSheetProps } from "../../interfaces/ui";

export function StudioColorSheet({
  open,
  onClose,
  disabled,
  scene,
  onApply,
}: StudioColorSheetProps) {
  const current = studioPaletteId(scene);
  return (
    <FormSheet
      isOpen={open}
      onClose={onClose}
      title="Colores"
      icon={Palette}
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
      <div className="space-y-5 pb-3">
        <p className="text-sm leading-6 text-muted-foreground">
          Usa los colores de tu marca para que te reconozcan a la primera.
        </p>
        <div className="grid grid-cols-4 gap-2">
          {STUDIO_PALETTES.map((palette) => (
            <button
              key={palette.id}
              type="button"
              disabled={disabled}
              aria-pressed={current === palette.id}
              onClick={() => onApply(recolorStudioScene(scene, palette))}
              className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 p-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${current === palette.id ? "border-accent" : "border-transparent bg-border-soft/60"}`}
            >
              <span
                aria-hidden
                className="block h-10 w-full rounded-lg border border-border"
                style={{
                  background: `linear-gradient(135deg, ${palette.background} 55%, ${palette.accent} 55%)`,
                }}
              />
              <span className="truncate">{palette.name}</span>
            </button>
          ))}
        </div>
        <FormInput
          label="Otro color de fondo"
          type="color"
          value={scene.background}
          disabled={disabled}
          onChange={(e) =>
            onApply({ ...scene, background: e.target.value })
          }
        />
      </div>
    </FormSheet>
  );
}
