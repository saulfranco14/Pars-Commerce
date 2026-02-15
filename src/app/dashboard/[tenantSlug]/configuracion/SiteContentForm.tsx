"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import type { SitePage, SitePageContent } from "@/types/tenantSitePages";
import { updateContent } from "@/services/tenantSitePagesService";
import { SiteContentInicioTab } from "./SiteContentInicioTab";
import { SiteContentNosotrosTab } from "./SiteContentNosotrosTab";
import { SiteContentContactoTab } from "./SiteContentContactoTab";

type SectionSlug = "inicio" | "nosotros" | "contacto";

interface SiteContentFormProps {
  tenantId: string;
  tenantSlug: string;
  sitePages: SitePage[];
  onContentSaved?: () => void;
  embedded?: boolean;
}

function getPageContent(page: SitePage | undefined): SitePageContent {
  const c = page?.content as SitePageContent | undefined;
  return c ?? {};
}

const ACCORDION_SECTIONS: { id: SectionSlug; label: string }[] = [
  { id: "inicio", label: "Inicio" },
  { id: "nosotros", label: "Nosotros" },
  { id: "contacto", label: "Contacto" },
];

export function SiteContentForm({
  tenantId,
  tenantSlug,
  sitePages,
  onContentSaved,
  embedded = false,
}: SiteContentFormProps) {
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

  return (
    <div className={embedded ? "mt-4" : "mt-6 rounded-lg border border-border bg-surface-raised p-4"}>
      {!embedded && (
        <>
          <h2 className="text-sm font-medium text-foreground">
            Contenido del sitio
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Edita el contenido que se muestra en cada sección de tu sitio público.
          </p>
        </>
      )}

      {error && (
        <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700" role="status">
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
                  <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
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

      <a
        href={`/sitio/${tenantSlug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-border-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        <ExternalLink className="h-4 w-4" aria-hidden />
        Ver cómo se ve el sitio
      </a>
    </div>
  );
}
