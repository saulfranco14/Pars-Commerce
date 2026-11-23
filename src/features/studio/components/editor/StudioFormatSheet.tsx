"use client";
import { Check, Smartphone } from "lucide-react";
import { FormSheet } from "@/components/ui/FormSheet";
import { adminActionButtonPrimary } from "@/components/admin/actionButtonClasses";
import { STUDIO_FORMATS } from "../../constants/studio";
import type { StudioFormat } from "../../interfaces/scene";
import type { StudioFormatSheetProps } from "../../interfaces/ui";

export function StudioFormatSheet({
  open,
  onClose,
  disabled,
  value,
  onChange,
}: StudioFormatSheetProps) {
  return (
    <FormSheet
      isOpen={open}
      onClose={onClose}
      title="¿Dónde lo publicas?"
      description="La misma imagen se acomoda a cada formato. Cambiarlo no cuesta."
      icon={Smartphone}
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
      <div className="space-y-3 pb-3">
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(STUDIO_FORMATS) as StudioFormat[]).map((format) => (
            <button
              key={format}
              type="button"
              disabled={disabled}
              aria-pressed={value === format}
              onClick={() => onChange(format)}
              className={`min-h-11 cursor-pointer truncate rounded-xl border px-3 text-sm font-semibold transition-colors disabled:opacity-60 ${value === format ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface"}`}
            >
              {STUDIO_FORMATS[format].channel}
            </button>
          ))}
        </div>
        <p className="rounded-xl bg-border-soft/60 p-3 text-sm text-muted-foreground">
          {STUDIO_FORMATS[value].hint}
        </p>
      </div>
    </FormSheet>
  );
}
