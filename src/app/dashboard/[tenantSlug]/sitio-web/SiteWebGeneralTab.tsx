"use client";

import { Check, ExternalLink, Palette } from "lucide-react";
import type { SiteTemplate } from "@/services/siteTemplatesService";

const VARIANT_STYLES: Record<
  string,
  {
    bg: string;
    headerBg: string;
    heroBg: string;
    cardBg: string;
    dark?: boolean;
  }
> = {
  classic: {
    bg: "#F9FAFB",
    headerBg: "#FFFFFF",
    heroBg: "accent",
    cardBg: "#FFFFFF",
  },
  minimal: {
    bg: "#FFFFFF",
    headerBg: "#FFFFFF",
    heroBg: "#F3F4F6",
    cardBg: "#FFFFFF",
  },
  bento: {
    bg: "#F3F4F6",
    headerBg: "#FFFFFF",
    heroBg: "accent",
    cardBg: "#FFFFFF",
  },
  dark: {
    bg: "#111827",
    headerBg: "#0D1117",
    heroBg: "#1F2937",
    cardBg: "#1F2937",
    dark: true,
  },
  elegant: {
    bg: "#FAFAF9",
    headerBg: "#FAFAF9",
    heroBg: "#F5F5F4",
    cardBg: "#FFFFFF",
  },
  bold: {
    bg: "#FFFFFF",
    headerBg: "accent",
    heroBg: "#F9FAFB",
    cardBg: "#FFFFFF",
  },
  organic: {
    bg: "#FFFBEB",
    headerBg: "#FFFBEB",
    heroBg: "#FEF3C7",
    cardBg: "#FFFFFF",
  },
  industrial: {
    bg: "#F1F5F9",
    headerBg: "#1E293B",
    heroBg: "#334155",
    cardBg: "#E2E8F0",
    dark: true,
  },
  vibrant: {
    bg: "#F3F4F6",
    headerBg: "accent",
    heroBg: "accent",
    cardBg: "#FFFFFF",
  },
  clean: {
    bg: "#FFFFFF",
    headerBg: "#FFFFFF",
    heroBg: "#FFFFFF",
    cardBg: "#F9FAFB",
  },
};

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

function TemplateMiniPreview({
  variant,
  themeColor,
}: {
  variant: string;
  themeColor: string;
}) {
  const s = VARIANT_STYLES[variant] ?? VARIANT_STYLES.classic;
  const resolve = (val: string) => (val === "accent" ? themeColor : val);
  const isDark = s.dark ?? false;
  const textAlpha = isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.25)";

  return (
    <div
      className="w-full overflow-hidden rounded-t-md"
      style={{ background: s.bg, aspectRatio: "16/10" }}
    >
      <div
        className="flex items-center gap-1 px-1.5 py-1"
        style={{
          background: resolve(s.headerBg),
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <div
          className="h-1.5 w-1.5 rounded-full shrink-0"
          style={{ background: themeColor }}
        />
        <div
          className="h-0.5 w-8 rounded-full"
          style={{
            background: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.2)",
          }}
        />
      </div>
      <div
        className="flex flex-col gap-0.5 px-1.5 py-1.5"
        style={{ background: resolve(s.heroBg) }}
      >
        <div
          className="h-1 w-14 rounded-full"
          style={{
            background:
              isDark || s.heroBg === "accent"
                ? "rgba(255,255,255,0.85)"
                : textAlpha,
          }}
        />
        <div
          className="h-2 w-10 rounded"
          style={{
            background:
              s.heroBg === "accent" || isDark
                ? "rgba(255,255,255,0.9)"
                : themeColor,
            opacity: 0.95,
          }}
        />
      </div>
      <div className="grid grid-cols-3 gap-0.5 p-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="overflow-hidden rounded-sm"
            style={{
              background: s.cardBg,
              boxShadow: "0 1px 1px rgba(0,0,0,0.04)",
            }}
          >
            <div
              className="h-3 w-full"
              style={{ background: `${themeColor}22` }}
            />
            <div className="p-0.5">
              <div
                className="h-0.5 w-5 rounded-full"
                style={{ background: textAlpha }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

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
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-foreground">
                Plantilla
              </label>
              {selectedTemplate && (
                <span className="text-[10px] text-muted-foreground">
                  {selectedTemplate.name} seleccionada
                </span>
              )}
            </div>

            <div>
              <div className="grid grid-cols-3 gap-2">
                  {templates.map((t) => {
                    const isSelected = selectedTemplateId === t.id;
                    const cardColor = t.default_theme_color ?? previewColor;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => onTemplateSelect(t)}
                        title={t.description ?? undefined}
                        className={`group relative flex flex-col overflow-hidden rounded-xl border text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
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
                              className="aspect-16/10 w-full object-cover"
                            />
                          ) : (
                            <TemplateMiniPreview
                              variant={t.layout_variant}
                              themeColor={cardColor}
                            />
                          )}
                        </div>
                        <div
                          className={`px-2 py-1.5 transition-colors ${
                            isSelected ? "bg-accent/5" : "bg-background"
                          }`}
                        >
                          <p className="text-[11px] font-medium text-foreground leading-tight truncate">
                            {t.name}
                          </p>
                        </div>
                        {isSelected && (
                          <span
                            className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-sm"
                            aria-hidden
                          >
                            <Check className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
            </div>
            <p className="mt-1.5 text-[10px] text-muted-foreground/70">
              {templates.length} plantillas disponibles
            </p>
          </div>
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
