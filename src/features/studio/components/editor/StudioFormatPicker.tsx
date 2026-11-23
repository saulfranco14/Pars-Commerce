"use client";
import { CircleHelp } from "lucide-react";
import { STUDIO_FORMATS } from "../../constants/studio";
import type { StudioFormat } from "../../interfaces/scene";
import type { StudioFormatPickerProps } from "../../interfaces/ui";

export function StudioFormatPicker({
  value,
  disabled,
  onChange,
}: StudioFormatPickerProps) {
  return (
    <fieldset
      disabled={disabled}
      className="space-y-3 rounded-2xl border border-border bg-surface p-4"
    >
      <legend className="float-left mb-3 w-full text-sm font-bold">
        ¿Dónde lo vas a publicar?
      </legend>
      <div className="clear-both grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
        {(Object.keys(STUDIO_FORMATS) as StudioFormat[]).map((format) => (
          <button
            key={format}
            type="button"
            aria-pressed={value === format}
            onClick={() => onChange(format)}
            className={`min-h-11 cursor-pointer truncate rounded-xl border px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${value === format ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface hover:bg-border-soft/50"}`}
          >
            {STUDIO_FORMATS[format].channel}
          </button>
        ))}
      </div>
      <p className="flex gap-2 rounded-xl bg-border-soft/60 p-3 text-xs leading-5 text-muted-foreground">
        <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
        {STUDIO_FORMATS[value].hint}
      </p>
    </fieldset>
  );
}
