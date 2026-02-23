"use client";

import { Check } from "lucide-react";
import type { SiteTemplate } from "@/services/siteTemplatesService";
import { TemplateMiniPreview } from "./TemplateMiniPreview";

interface TemplateSelectorProps {
  templates: SiteTemplate[];
  selectedTemplateId: string | null;
  onSelect: (template: SiteTemplate) => void;
  themeColor?: string;
  label?: string;
  compact?: boolean;
}

export function TemplateSelector({
  templates,
  selectedTemplateId,
  onSelect,
  themeColor = "#6366f1",
  label = "Plantilla",
  compact = false,
}: TemplateSelectorProps) {
  const previewColor = themeColor.trim() || "#6366f1";
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const gridClass = compact
    ? "grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-5"
    : "grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground">{label}</label>
        {selectedTemplate && (
          <span className="text-[10px] text-muted-foreground">
            {selectedTemplate.name} seleccionada
          </span>
        )}
      </div>
      <div className={gridClass}>
        {templates.map((t) => {
          const isSelected = selectedTemplateId === t.id;
          const cardColor = t.default_theme_color ?? previewColor;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t)}
              title={t.description ?? undefined}
              className={`group relative flex min-w-0 flex-col overflow-hidden rounded-lg border text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                compact ? "min-h-0" : "min-h-[80px]"
              } ${
                isSelected
                  ? "border-accent ring-2 ring-accent/25 shadow-md"
                  : "border-border/60 bg-background hover:border-accent/40 hover:shadow-sm"
              }`}
            >
              <div className="overflow-hidden">
                {t.preview_image_url ? (
                  <img
                    src={t.preview_image_url}
                    alt={t.name}
                    className={`w-full object-cover ${
                      compact ? "aspect-4/3" : "aspect-16/10"
                    }`}
                  />
                ) : (
                  <TemplateMiniPreview
                    variant={t.layout_variant}
                    themeColor={cardColor}
                    compact={compact}
                  />
                )}
              </div>
              <div
                className={`flex items-center px-1.5 transition-colors ${
                  compact ? "py-1" : "min-h-[44px] flex-1 px-2 py-1.5"
                } ${
                  isSelected ? "bg-accent/5" : "bg-background"
                }`}
              >
                <p
                  className={`truncate font-medium leading-tight text-foreground ${
                    compact ? "text-[9px]" : "text-[11px]"
                  }`}
                >
                  {t.name}
                </p>
              </div>
              {isSelected && (
                <span
                  className={`absolute flex items-center justify-center rounded-full bg-accent text-accent-foreground shadow-sm ${
                    compact
                      ? "right-1 top-1 h-3 w-3"
                      : "right-1.5 top-1.5 h-4 w-4"
                  }`}
                  aria-hidden
                >
                  <Check
                    className={compact ? "h-1.5 w-1.5" : "h-2.5 w-2.5"}
                    aria-hidden
                  />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground/70">
        {templates.length} plantillas disponibles
      </p>
    </div>
  );
}
