"use client";

import { Check, CheckCircle2, ExternalLink, Palette } from "lucide-react";
import {
  COLOR_PRESETS,
} from "@/features/sitio-web/constants/templateStyles";
import type { SiteWebGeneralTabProps } from "@/features/sitio-web/interfaces/siteWebGeneralTab";
import { TemplateSelector } from "@/components/site/TemplateSelector";
import { DEFAULT_TENANT_ACCENT } from "@/features/sitio-web/constants/templateStyles";
import { usePublicSitePath } from "@/hooks/usePublicSitePath";

export function SiteWebGeneralTab({
  tenantSlug,
  publicStoreEnabled,
  templates,
  selectedTemplateId,
  onTemplateSelect,
  themeColor,
  onThemeColorChange,
  appearanceSuccess,
  onSaveAppearance,
}: SiteWebGeneralTabProps) {
  const previewColor = themeColor.trim() || DEFAULT_TENANT_ACCENT;
  const sitePath = usePublicSitePath(tenantSlug);

  return (
    <form
      id="appearance-form"
      onSubmit={onSaveAppearance}
      className="space-y-5"
    >
      <div
        className={`rounded-xl border px-4 py-3 ${
          publicStoreEnabled
            ? "border-emerald-200 bg-emerald-50"
            : "border-amber-200 bg-amber-50"
        }`}
      >
        <div className="flex items-start gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              publicStoreEnabled
                ? "bg-emerald-500/10 text-emerald-700"
                : "bg-amber-500/10 text-amber-800"
            }`}
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {publicStoreEnabled
                ? "Tu tienda está publicada"
                : "Tu tienda se publicará desde la preparación guiada"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {publicStoreEnabled
                ? "Personaliza su apariencia aquí. Para dejar de recibir compras utiliza Pausar pedidos, sin ocultar el catálogo."
                : "Completa contacto, catálogo y cobro; Tlaco publicará el enlace automáticamente."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-foreground">
                {publicStoreEnabled ? "Enlace público listo" : "Publicación automática"}
              </span>
              <span className="block text-xs text-muted-foreground">
                {publicStoreEnabled
                  ? "Tu catálogo permanece visible aunque pauses pedidos"
                  : "No necesitas activar nada desde Configuración"}
              </span>
            </div>
          </div>
          {publicStoreEnabled && (
            <a
              href={sitePath}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-border-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 cursor-pointer"
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
                placeholder="#3483fa"
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
                    boxShadow: themeColor === c ? `0 0 0 2px ${c}` : undefined,
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
            <p className="text-xs text-muted-foreground">Plantilla del sitio</p>
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
