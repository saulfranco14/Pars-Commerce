"use client";

import { Check, ExternalLink, Palette } from "lucide-react";
import type { SiteTemplate } from "@/services/siteTemplatesService";
import { TemplateSelector } from "@/components/site/TemplateSelector";

const COLOR_PRESETS = [
  "#c20fbc",
  "#6366f1",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#14b8a6",
  "#8b5cf6",
  "#f97316",
];

interface SiteWebGeneralTabProps {
  tenantSlug: string;
  publicStoreEnabled: boolean;
  publicStoreLoading: boolean;
  onTogglePublicStore: (e: React.ChangeEvent<HTMLInputElement>) => void;
  templates: SiteTemplate[];
  selectedTemplateId: string | null;
  onTemplateSelect: (t: SiteTemplate) => void;
  themeColor: string;
  onThemeColorChange: (value: string) => void;
  appearanceLoading: boolean;
  appearanceDirty: boolean;
  appearanceSuccess: string | null;
  onSaveAppearance: (e: React.FormEvent) => void;
}

export function SiteWebGeneralTab({
  tenantSlug,
  publicStoreEnabled,
  publicStoreLoading,
  onTogglePublicStore,
  templates,
  selectedTemplateId,
  onTemplateSelect,
  themeColor,
  onThemeColorChange,
  appearanceLoading,
  appearanceDirty,
  appearanceSuccess,
  onSaveAppearance,
}: SiteWebGeneralTabProps) {
  const previewColor = themeColor.trim() || "#6366f1";

  return (
    <form id="appearance-form" onSubmit={onSaveAppearance} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <label
              htmlFor="publicStore"
              className="flex min-h-[44px] min-w-[44px] shrink-0 cursor-pointer items-center justify-center"
              aria-label="Activar tienda pública"
            >
              <input
                id="publicStore"
                type="checkbox"
                checked={publicStoreEnabled}
                onChange={onTogglePublicStore}
                disabled={publicStoreLoading}
                className="h-4 w-4 cursor-pointer rounded border-border focus:ring-2 focus:ring-accent focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-foreground">
                Tienda pública
              </span>
              <span className="block text-xs text-muted-foreground">
                Los clientes pueden visitar tu sitio
              </span>
            </div>
            {publicStoreLoading && (
              <span className="shrink-0 text-xs text-muted-foreground">
                Guardando…
              </span>
            )}
          </div>
          {publicStoreEnabled && (
            <a
              href={`/sitio/${tenantSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-border-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 cursor-pointer"
            >
              <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
              Ver mi sitio
            </a>
          )}
        </div>

        <div className="rounded-xl border border-border/60 bg-background p-4 shadow-sm">
          <label
            htmlFor="themeColor"
            className="mb-3 block text-sm font-medium text-foreground"
          >
            Color de marca
          </label>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                id="themeColor"
                type="color"
                value={previewColor}
                onChange={(e) => onThemeColorChange(e.target.value)}
                className="h-9 w-10 cursor-pointer rounded-lg border border-border/80 bg-surface p-0.5 shrink-0"
              />
              <input
                type="text"
                value={themeColor}
                onChange={(e) => onThemeColorChange(e.target.value)}
                className="h-9 min-w-0 flex-1 rounded-lg border border-border/80 bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
                placeholder="#6366f1"
                maxLength={7}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onThemeColorChange(c)}
                  className="h-7 w-7 cursor-pointer rounded-lg border-2 transition-transform duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-1 shadow-sm"
                  style={{
                    backgroundColor: c,
                    borderColor: themeColor === c ? "white" : "transparent",
                    boxShadow:
                      themeColor === c ? `0 0 0 2px ${c}` : undefined,
                  }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border/50 pt-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
            <Palette className="h-4 w-4 text-accent" aria-hidden />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Apariencia
            </h3>
            <p className="text-xs text-muted-foreground">
              Plantilla del sitio
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <TemplateSelector
            templates={templates}
            selectedTemplateId={selectedTemplateId}
            onSelect={onTemplateSelect}
            themeColor={previewColor}
            label="Plantilla"
          />
        </div>
      </div>

      {appearanceSuccess && (
        <p
          className="flex items-center gap-1.5 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700"
          role="status"
        >
          <Check className="h-3.5 w-3.5 shrink-0" />
          {appearanceSuccess}
        </p>
      )}
    </form>
  );
}
