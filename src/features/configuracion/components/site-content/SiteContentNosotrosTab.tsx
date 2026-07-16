"use client";

import { Check } from "lucide-react";
import { FormSection } from "./SiteContentFormSection";
import { inputForm } from "@/components/ui/inputClasses";
import { btnPrimary } from "@/components/ui/buttonClasses";
import type { SiteContentTabProps } from "@/features/configuracion/interfaces/sections";

export function SiteContentNosotrosTab({
  content,
  onChange,
  onSave,
  loading,
}: SiteContentTabProps) {
  return (
    <div className="space-y-8">
      <FormSection
        title="Contenido de Nosotros"
        description="Texto que aparece en la página /nosotros. Ideal para historia, misión, valores o equipo."
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="nosotros-title" className="block text-sm font-medium text-muted-foreground">
              Título de la página
            </label>
            <input
              id="nosotros-title"
              type="text"
              value={content.title ?? ""}
              onChange={(e) => onChange({ ...content, title: e.target.value })}
              maxLength={80}
              className={inputForm}
              placeholder="Ej. Quiénes somos"
            />
          </div>
          <div>
            <label htmlFor="nosotros-body" className="block text-sm font-medium text-muted-foreground">
              Contenido principal
            </label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Puedes escribir varios párrafos. Se mostrará con formato de texto.
            </p>
            <textarea
              id="nosotros-body"
              value={content.body ?? ""}
              onChange={(e) => onChange({ ...content, body: e.target.value })}
              rows={6}
              className={inputForm}
              placeholder="Historia de tu negocio, misión, valores o descripción del equipo..."
            />
          </div>
        </div>
      </FormSection>

      <div className="flex justify-end border-t border-border pt-4">
        <button
          type="button"
          onClick={onSave}
          disabled={loading}
          className={btnPrimary}
        >
          <Check className="h-4 w-4 shrink-0" aria-hidden />
          {loading ? "Guardando…" : "Guardar Nosotros"}
        </button>
      </div>
    </div>
  );
}
