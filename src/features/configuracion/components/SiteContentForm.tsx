"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import type { SitePage, SitePageContent } from "@/types/tenantSitePages";
import { updateContent } from "@/services/tenantSitePagesService";
import { SiteContentInicioTab } from "./SiteContentInicioTab";
import { SiteContentNosotrosTab } from "./SiteContentNosotrosTab";
import { SiteContentContactoTab } from "./SiteContentContactoTab";
import { FilterTabs } from "@/components/ui/FilterTabs";
import {
  CONTENT_TABS,
  ACCORDION_SECTIONS,
  type SectionSlug,
} from "@/features/configuracion/constants/contentTabs";
import type { SiteContentFormProps } from "@/features/configuracion/interfaces/sections";

function getPageContent(page: SitePage | undefined): SitePageContent {
  const c = page?.content as SitePageContent | undefined;
  return c ?? {};
}

export function SiteContentForm({
  tenantId,
  tenantSlug,
  sitePages,
  onContentSaved,
  embedded = false,
}: SiteContentFormProps) {
  const [contentTab, setContentTab] = useState<SectionSlug>("inicio");
  const [expanded, setExpanded] = useState<SectionSlug | null>("inicio");
  const [inicio, setInicio] = useState<SitePageContent>({});
  const [nosotros, setNosotros] = useState<SitePageContent>({});
  const [contacto, setContacto] = useState<SitePageContent>({});
  const [loading, setLoading] = useState<SectionSlug | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const pInicio = sitePages.find((p) => p.slug === "inicio");
    const pNosotros = sitePages.find((p) => p.slug === "nosotros");
    const pContacto = sitePages.find((p) => p.slug === "contacto");
    if (pInicio) setInicio(getPageContent(pInicio));
    if (pNosotros) setNosotros(getPageContent(pNosotros));
    if (pContacto) setContacto(getPageContent(pContacto));
  }, [sitePages]);

  async function handleSave(slug: SectionSlug, content: SitePageContent) {
    setError(null);
    setSuccess(null);
    setLoading(slug);
    try {
      await updateContent(tenantId, slug, content);
      onContentSaved?.();
      setSuccess(`Contenido de ${slug} guardado.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setLoading(null);
    }
  }

  if (embedded) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Edita el contenido de cada página de tu sitio público.
        </p>

        {error && (
          <div
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}
        {success && (
          <div
            className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700"
            role="status"
          >
            {success}
          </div>
        )}

        <FilterTabs
          tabs={CONTENT_TABS}
          activeValue={contentTab}
          onTabChange={(v) => setContentTab(v as SectionSlug)}
          ariaLabel="Páginas de contenido"
        />

        <div className="pt-1">
          {contentTab === "inicio" && (
            <SiteContentInicioTab
              content={inicio}
              onChange={setInicio}
              onSave={() => handleSave("inicio", inicio)}
              loading={loading === "inicio"}
              narrow
            />
          )}
          {contentTab === "nosotros" && (
            <SiteContentNosotrosTab
              content={nosotros}
              onChange={setNosotros}
              onSave={() => handleSave("nosotros", nosotros)}
              loading={loading === "nosotros"}
            />
          )}
          {contentTab === "contacto" && (
            <SiteContentContactoTab
              content={contacto}
              onChange={setContacto}
              onSave={() => handleSave("contacto", contacto)}
              loading={loading === "contacto"}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-lg border border-border bg-surface-raised p-4">
      <h2 className="text-sm font-medium text-foreground">
        Contenido del sitio
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Edita el contenido que se muestra en cada sección de tu sitio público.
      </p>

      {error && (
        <div
          className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700"
          role="status"
        >
          {success}
        </div>
      )}

      <div className="mt-4 space-y-2">
        {ACCORDION_SECTIONS.map(({ id, label }) => {
          const isExpanded = expanded === id;
          return (
            <div
              key={id}
              className="overflow-hidden rounded-lg border border-border bg-surface"
            >
              <button
                type="button"
                onClick={() => setExpanded(isExpanded ? null : id)}
                className="flex w-full min-h-[44px] cursor-pointer items-center justify-between px-4 py-3 text-left text-sm font-medium text-foreground transition-colors duration-200 hover:bg-border-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
              >
                {label}
                {isExpanded ? (
                  <ChevronUp
                    className="h-4 w-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                ) : (
                  <ChevronDown
                    className="h-4 w-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                )}
              </button>
              {isExpanded && (
                <div className="border-t border-border px-4 py-4">
                  {id === "inicio" && (
                    <SiteContentInicioTab
                      content={inicio}
                      onChange={setInicio}
                      onSave={() => handleSave("inicio", inicio)}
                      loading={loading === "inicio"}
                      narrow={false}
                    />
                  )}
                  {id === "nosotros" && (
                    <SiteContentNosotrosTab
                      content={nosotros}
                      onChange={setNosotros}
                      onSave={() => handleSave("nosotros", nosotros)}
                      loading={loading === "nosotros"}
                    />
                  )}
                  {id === "contacto" && (
                    <SiteContentContactoTab
                      content={contacto}
                      onChange={setContacto}
                      onSave={() => handleSave("contacto", contacto)}
                      loading={loading === "contacto"}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!embedded && (
        <a
          href={`/sitio/${tenantSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-border-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          <ExternalLink className="h-4 w-4" aria-hidden />
          Ver cómo se ve el sitio
        </a>
      )}
    </div>
  );
}
