"use client";

import { useState, useEffect } from "react";
import type { SitePage, SitePageContent } from "@/types/tenantSitePages";
import { updateContent } from "@/services/tenantSitePagesService";

const inputClass =
  "input-form mt-1 block w-full min-h-[40px] rounded-lg border px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

type SectionSlug = "inicio" | "nosotros" | "contacto";

interface SiteContentFormProps {
  tenantId: string;
  tenantSlug: string;
  sitePages: SitePage[];
}

function getPageContent(page: SitePage | undefined): SitePageContent {
  const c = page?.content as SitePageContent | undefined;
  return c ?? {};
}

export function SiteContentForm({
  tenantId,
  tenantSlug,
  sitePages,
}: SiteContentFormProps) {
  const [expanded, setExpanded] = useState<SectionSlug | null>(null);
  const [inicio, setInicio] = useState<SitePageContent>({});
  const [nosotros, setNosotros] = useState<SitePageContent>({});
  const [contacto, setContacto] = useState<SitePageContent>({});
  const [loading, setLoading] = useState<string | null>(null);
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
      setSuccess(`Contenido de ${slug} guardado.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setLoading(null);
    }
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
        <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="mt-4 space-y-2">
        <SectionBlock
          title="Inicio"
          isExpanded={expanded === "inicio"}
          onToggle={() => setExpanded(expanded === "inicio" ? null : "inicio")}
        >
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground">
                Título principal
              </label>
              <input
                type="text"
                value={inicio.title ?? ""}
                onChange={(e) => setInicio({ ...inicio, title: e.target.value })}
                maxLength={80}
                className={inputClass}
                placeholder="Ej. Bienvenido a Regalos Jazmín"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground">
                Subtítulo (opcional)
              </label>
              <input
                type="text"
                value={inicio.subtitle ?? ""}
                onChange={(e) =>
                  setInicio({ ...inicio, subtitle: e.target.value })
                }
                maxLength={120}
                className={inputClass}
                placeholder="Frase breve debajo del título"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground">
                Texto de bienvenida (opcional)
              </label>
              <textarea
                value={inicio.welcome_text ?? ""}
                onChange={(e) =>
                  setInicio({ ...inicio, welcome_text: e.target.value })
                }
                maxLength={500}
                rows={3}
                className={inputClass}
                placeholder="1–2 párrafos de bienvenida"
              />
            </div>
            <button
              type="button"
              onClick={() => handleSave("inicio", inicio)}
              disabled={loading === "inicio"}
              className="rounded-md bg-accent px-3 py-1.5 text-sm text-accent-foreground hover:opacity-90 disabled:opacity-50"
            >
              {loading === "inicio" ? "Guardando..." : "Guardar Inicio"}
            </button>
          </div>
        </SectionBlock>

        <SectionBlock
          title="Nosotros"
          isExpanded={expanded === "nosotros"}
          onToggle={() => setExpanded(expanded === "nosotros" ? null : "nosotros")}
        >
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground">
                Título (opcional)
              </label>
              <input
                type="text"
                value={nosotros.title ?? ""}
                onChange={(e) =>
                  setNosotros({ ...nosotros, title: e.target.value })
                }
                maxLength={80}
                className={inputClass}
                placeholder="Ej. Quiénes somos"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground">
                Contenido
              </label>
              <textarea
                value={nosotros.body ?? ""}
                onChange={(e) =>
                  setNosotros({ ...nosotros, body: e.target.value })
                }
                rows={5}
                className={inputClass}
                placeholder="Historia, misión, equipo..."
              />
            </div>
            <button
              type="button"
              onClick={() => handleSave("nosotros", nosotros)}
              disabled={loading === "nosotros"}
              className="rounded-md bg-accent px-3 py-1.5 text-sm text-accent-foreground hover:opacity-90 disabled:opacity-50"
            >
              {loading === "nosotros" ? "Guardando..." : "Guardar Nosotros"}
            </button>
          </div>
        </SectionBlock>

        <SectionBlock
          title="Contacto"
          isExpanded={expanded === "contacto"}
          onToggle={() =>
            setExpanded(expanded === "contacto" ? null : "contacto")
          }
        >
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground">
                Email
              </label>
              <input
                type="email"
                value={contacto.email ?? ""}
                onChange={(e) =>
                  setContacto({ ...contacto, email: e.target.value })
                }
                className={inputClass}
                placeholder="contacto@negocio.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground">
                Teléfono
              </label>
              <input
                type="tel"
                value={contacto.phone ?? ""}
                onChange={(e) =>
                  setContacto({ ...contacto, phone: e.target.value })
                }
                className={inputClass}
                placeholder="555-0000"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground">
                Dirección (opcional)
              </label>
              <input
                type="text"
                value={contacto.address_text ?? ""}
                onChange={(e) =>
                  setContacto({ ...contacto, address_text: e.target.value })
                }
                maxLength={200}
                className={inputClass}
                placeholder="Av. Principal 123, Col. Centro"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground">
                Horario (opcional)
              </label>
              <input
                type="text"
                value={contacto.schedule ?? ""}
                onChange={(e) =>
                  setContacto({ ...contacto, schedule: e.target.value })
                }
                maxLength={100}
                className={inputClass}
                placeholder="Lun–Vie 9:00–18:00"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground">
                Mensaje de bienvenida (opcional)
              </label>
              <textarea
                value={contacto.welcome_message ?? ""}
                onChange={(e) =>
                  setContacto({ ...contacto, welcome_message: e.target.value })
                }
                maxLength={300}
                rows={2}
                className={inputClass}
                placeholder="Texto arriba de los datos de contacto"
              />
            </div>
            <button
              type="button"
              onClick={() => handleSave("contacto", contacto)}
              disabled={loading === "contacto"}
              className="rounded-md bg-accent px-3 py-1.5 text-sm text-accent-foreground hover:opacity-90 disabled:opacity-50"
            >
              {loading === "contacto" ? "Guardando..." : "Guardar Contacto"}
            </button>
          </div>
        </SectionBlock>
      </div>

      <a
        href={`/sitio/${tenantSlug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-block text-sm text-accent underline hover:no-underline"
      >
        Ver cómo se ve el sitio
      </a>
    </div>
  );
}

function SectionBlock({
  title,
  isExpanded,
  onToggle,
  children,
}: {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded border border-border">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-border-soft"
      >
        {title}
        <span className="text-muted-foreground">{isExpanded ? "−" : "+"}</span>
      </button>
      {isExpanded && (
        <div className="border-t border-border px-3 py-4">{children}</div>
      )}
    </div>
  );
}
