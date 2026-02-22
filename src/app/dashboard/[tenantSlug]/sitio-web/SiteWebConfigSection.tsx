"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Globe, MessageCircle, FileText, Check, ChevronDown, ChevronUp, Tag, ArrowRight, Palette } from "lucide-react";
import { useTenantStore } from "@/stores/useTenantStore";
import type { MembershipItem } from "@/stores/useTenantStore";
import type { SitePage } from "@/types/tenantSitePages";
import { SiteContentForm } from "@/app/dashboard/[tenantSlug]/configuracion/SiteContentForm";
import { update as updateTenant, list as listTenants } from "@/services/tenantsService";
import { list as listTemplates } from "@/services/siteTemplatesService";
import type { SiteTemplate } from "@/services/siteTemplatesService";
import { swrFetcher } from "@/lib/swrFetcher";

const sitePagesKey = (tenantId: string) =>
  `/api/tenant-site-pages?tenant_id=${encodeURIComponent(tenantId)}`;

const inputClass =
  "input-form mt-1 block w-full min-h-[44px] rounded-lg border px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-colors duration-200";

interface SiteWebConfigSectionProps {
  tenantSlug: string;
}

export function SiteWebConfigSection({ tenantSlug }: SiteWebConfigSectionProps) {
  const activeTenant = useTenantStore((s) => s.activeTenant)();
  const setMemberships = useTenantStore((s) => s.setMemberships);
  const [publicStoreEnabled, setPublicStoreEnabled] = useState(false);
  const [publicStoreLoading, setPublicStoreLoading] = useState(false);
  const [themeColor, setThemeColor] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [redesLoading, setRedesLoading] = useState(false);
  const [redesError, setRedesError] = useState<string | null>(null);
  const [redesSuccess, setRedesSuccess] = useState<string | null>(null);
  const [templates, setTemplates] = useState<SiteTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [appearanceLoading, setAppearanceLoading] = useState(false);
  const [appearanceSuccess, setAppearanceSuccess] = useState<string | null>(null);

  const savedTemplateId = (activeTenant as { site_template_id?: string | null })?.site_template_id ?? null;
  const savedThemeColor = (activeTenant?.theme_color ?? "").trim();
  const appearanceDirty =
    selectedTemplateId !== savedTemplateId ||
    (themeColor || "").trim() !== savedThemeColor;
  const [expandedStep, setExpandedStep] = useState<"paso1" | "paso2" | "paso3" | "paso4" | null>("paso1");

  const sitePagesKeyValue = activeTenant ? sitePagesKey(activeTenant.id) : null;
  const { data: sitePagesData, mutate: mutateSitePages } = useSWR<SitePage[]>(
    sitePagesKeyValue,
    swrFetcher,
    { fallbackData: [] },
  );
  const sitePages = Array.isArray(sitePagesData) ? sitePagesData : [];

  useEffect(() => {
    listTemplates().then(setTemplates);
  }, []);

  useEffect(() => {
    if (!activeTenant) return;
    setPublicStoreEnabled(activeTenant.public_store_enabled ?? false);
    setThemeColor(activeTenant.theme_color ?? "");
    setSelectedTemplateId(
      (activeTenant as { site_template_id?: string | null }).site_template_id ?? null
    );
    setAppearanceSuccess(null);
    setWhatsappPhone((activeTenant as { whatsapp_phone?: string }).whatsapp_phone ?? "");
    const sl = (activeTenant as { social_links?: { instagram?: string; facebook?: string; twitter?: string } })
      .social_links;
    setInstagramUrl(sl?.instagram ?? "");
    setFacebookUrl(sl?.facebook ?? "");
    setTwitterUrl(sl?.twitter ?? "");
  }, [activeTenant?.id]);

  async function handleTogglePublicStore(e: React.ChangeEvent<HTMLInputElement>) {
    const checked = e.target.checked;
    if (!activeTenant) return;
    setPublicStoreLoading(true);
    try {
      await updateTenant(activeTenant.id, { public_store_enabled: checked });
      setPublicStoreEnabled(checked);
      const list = (await listTenants()) as MembershipItem[];
      setMemberships(list ?? []);
    } catch {
      setPublicStoreEnabled(!checked);
    } finally {
      setPublicStoreLoading(false);
    }
  }

  async function handleSaveAppearance(e: React.FormEvent) {
    e.preventDefault();
    if (!activeTenant) return;
    setAppearanceLoading(true);
    setAppearanceSuccess(null);
    try {
      await updateTenant(activeTenant.id, {
        site_template_id: selectedTemplateId,
        theme_color: themeColor.trim() || undefined,
      });
      setAppearanceSuccess("Apariencia guardada correctamente.");
      const list = (await listTenants()) as MembershipItem[];
      setMemberships(list ?? []);
    } finally {
      setAppearanceLoading(false);
    }
  }

  function handleTemplateSelect(templateId: string | null) {
    setSelectedTemplateId(templateId);
    setAppearanceSuccess(null);
  }

  function handleThemeColorChange(value: string) {
    setThemeColor(value);
    setAppearanceSuccess(null);
  }

  async function handleSaveRedes(e: React.FormEvent) {
    e.preventDefault();
    setRedesError(null);
    setRedesSuccess(null);
    if (!activeTenant) return;
    setRedesLoading(true);
    try {
      await updateTenant(activeTenant.id, {
        whatsapp_phone: whatsappPhone.trim() || undefined,
        social_links: {
          instagram: instagramUrl.trim() || undefined,
          facebook: facebookUrl.trim() || undefined,
          twitter: twitterUrl.trim() || undefined,
        },
      });
      setRedesSuccess("Redes y contacto guardados.");
      const list = (await listTenants()) as MembershipItem[];
      setMemberships(list ?? []);
    } catch (e) {
      setRedesError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setRedesLoading(false);
    }
  }

  if (!activeTenant) {
    return (
      <div className="text-sm text-muted-foreground">
        Selecciona un negocio para continuar.
      </div>
    );
  }

  const stepCardClass =
    "rounded-xl border border-border bg-surface-raised shadow-sm overflow-hidden";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto space-y-4">
        <div className={stepCardClass}>
          <button
            type="button"
            onClick={() => setExpandedStep((s) => (s === "paso1" ? null : "paso1"))}
            className="flex w-full min-h-[44px] cursor-pointer items-center gap-3 p-5 text-left transition-colors duration-200 hover:bg-border-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset sm:p-6"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent"
              aria-hidden
            >
              {publicStoreEnabled ? <Check className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-foreground">Paso 1. Activar tu sitio</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {publicStoreEnabled
                  ? "Tu catálogo público está activo. Los clientes pueden ver productos y contactarte por WhatsApp."
                  : "Activa tu catálogo público para que los clientes vean productos y te contacten por WhatsApp."}
              </p>
            </div>
            {expandedStep === "paso1" ? (
              <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            )}
          </button>
          <div
            className="grid transition-[grid-template-rows] duration-200 ease-out"
            style={{ gridTemplateRows: expandedStep === "paso1" ? "1fr" : "0fr" }}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="border-t border-border px-5 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-4">
              <div className="flex min-h-[44px] items-center gap-3">
                <label
                  htmlFor="publicStore"
                  className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center"
                  aria-label="Activar tienda pública"
                >
                  <input
                    id="publicStore"
                    type="checkbox"
                    checked={publicStoreEnabled}
                    onChange={handleTogglePublicStore}
                    disabled={publicStoreLoading}
                    className="h-5 w-5 rounded border-border focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                  />
                </label>
                <span className="text-sm font-medium text-foreground">
                  Tienda pública habilitada
                </span>
                {publicStoreLoading && (
                  <span className="text-xs text-muted-foreground">Guardando…</span>
                )}
              </div>
              {publicStoreEnabled && (
                <a
                  href={`/sitio/${tenantSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-accent/10 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/20 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-colors duration-200 cursor-pointer"
                >
                  Ver mi sitio
                  <Globe className="h-4 w-4" aria-hidden />
                </a>
              )}
              <form onSubmit={handleSaveAppearance} className="mt-6 space-y-6 border-t border-border/60 pt-6">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Palette className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    Apariencia del sitio
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Plantilla y color. Los cambios se guardan al pulsar Guardar.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">
                    Plantilla
                  </label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {templates.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleTemplateSelect(selectedTemplateId === t.id ? null : t.id)}
                        title={t.description ?? undefined}
                        className={`relative flex min-h-[100px] cursor-pointer flex-col items-center justify-center rounded-xl border px-3 py-3 text-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                          selectedTemplateId === t.id
                            ? "border-accent/70 bg-accent/5 ring-1 ring-accent/15"
                            : "border-border/70 bg-surface hover:border-border hover:bg-muted/30"
                        }`}
                      >
                        <div
                          className="mb-2 h-8 w-8 shrink-0 rounded-lg"
                          style={{
                            backgroundColor: t.default_theme_color ?? "#6366f1",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                          }}
                          aria-hidden
                        />
                        <span className="text-center text-xs font-semibold text-foreground">
                          {t.name}
                        </span>
                        {t.description && (
                          <span className="mt-0.5 line-clamp-2 text-center text-[10px] leading-tight text-muted-foreground">
                            {t.description}
                          </span>
                        )}
                        {selectedTemplateId === t.id && (
                          <span
                            className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground"
                            aria-hidden
                          >
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="themeColor" className="block text-xs font-medium text-muted-foreground mb-2">
                    Color del tema
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      id="themeColor"
                      type="color"
                      value={themeColor || "#6366f1"}
                      onChange={(e) => handleThemeColorChange(e.target.value)}
                      className="h-9 w-11 cursor-pointer rounded-lg border border-border/80 bg-surface shrink-0"
                    />
                    <input
                      type="text"
                      value={themeColor}
                      onChange={(e) => handleThemeColorChange(e.target.value)}
                      className="h-9 w-28 rounded-lg border border-border/80 bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
                      placeholder="#6366f1"
                    />
                  </div>
                </div>
                {appearanceSuccess && (
                  <p className="text-sm text-green-600" role="status">{appearanceSuccess}</p>
                )}
                <button
                  type="submit"
                  disabled={appearanceLoading || !appearanceDirty}
                  className="inline-flex min-h-[40px] cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Check className="h-4 w-4 shrink-0" aria-hidden />
                  {appearanceLoading ? "Guardando…" : "Guardar apariencia"}
                </button>
              </form>
              </div>
            </div>
          </div>
        </div>

        <div className={stepCardClass}>
          <button
            type="button"
            onClick={() => setExpandedStep((s) => (s === "paso2" ? null : "paso2"))}
            className="flex w-full min-h-[44px] cursor-pointer items-center gap-3 p-5 text-left transition-colors duration-200 hover:bg-border-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset sm:p-6"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-border-soft text-muted-foreground"
              aria-hidden
            >
              <MessageCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-foreground">Paso 2. Redes y contacto</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                WhatsApp y redes sociales para el sitio público. El botón de consulta por producto usará este número.
              </p>
            </div>
            {expandedStep === "paso2" ? (
              <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            )}
          </button>
          <div
            className="grid transition-[grid-template-rows] duration-200 ease-out"
            style={{ gridTemplateRows: expandedStep === "paso2" ? "1fr" : "0fr" }}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="border-t border-border px-5 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-4">
              <form onSubmit={handleSaveRedes} className="space-y-4">
                {redesError && (
                  <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                    {redesError}
                  </div>
                )}
                {redesSuccess && (
                  <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700" role="status">
                    {redesSuccess}
                  </div>
                )}
                <div>
                  <label htmlFor="whatsappPhone" className="block text-sm font-medium text-muted-foreground">
                    WhatsApp (número con código de país)
                  </label>
                  <input
                    id="whatsappPhone"
                    type="text"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    className={inputClass}
                    placeholder="5215512345678"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label htmlFor="instagramUrl" className="block text-sm font-medium text-muted-foreground">
                      Instagram URL
                    </label>
                    <input
                      id="instagramUrl"
                      type="url"
                      value={instagramUrl}
                      onChange={(e) => setInstagramUrl(e.target.value)}
                      className={inputClass}
                      placeholder="https://instagram.com/mi_tienda"
                    />
                  </div>
                  <div>
                    <label htmlFor="facebookUrl" className="block text-sm font-medium text-muted-foreground">
                      Facebook URL
                    </label>
                    <input
                      id="facebookUrl"
                      type="url"
                      value={facebookUrl}
                      onChange={(e) => setFacebookUrl(e.target.value)}
                      className={inputClass}
                      placeholder="https://facebook.com/mi_tienda"
                    />
                  </div>
                  <div>
                    <label htmlFor="twitterUrl" className="block text-sm font-medium text-muted-foreground">
                      Twitter/X URL
                    </label>
                    <input
                      id="twitterUrl"
                      type="url"
                      value={twitterUrl}
                      onChange={(e) => setTwitterUrl(e.target.value)}
                      className={inputClass}
                      placeholder="https://twitter.com/mi_tienda"
                    />
                  </div>
                </div>
                <div className="flex justify-end border-t border-border pt-4">
                  <button
                    type="submit"
                    disabled={redesLoading}
                    className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors duration-200 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <Check className="h-4 w-4 shrink-0" aria-hidden />
                    {redesLoading ? "Guardando…" : "Guardar redes"}
                  </button>
                </div>
              </form>
              </div>
            </div>
          </div>
        </div>

        {publicStoreEnabled && (
          <div className={stepCardClass}>
            <button
              type="button"
              onClick={() => setExpandedStep((s) => (s === "paso3" ? null : "paso3"))}
              className="flex w-full min-h-[44px] cursor-pointer items-center gap-3 p-5 text-left transition-colors duration-200 hover:bg-border-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset sm:p-6"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-border-soft text-muted-foreground"
                aria-hidden
              >
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-foreground">
                  Paso 3. Contenido del sitio
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Edita el contenido que se muestra en Inicio, Nosotros y Contacto.
                </p>
              </div>
              {expandedStep === "paso3" ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              )}
            </button>
            <div
              className="grid transition-[grid-template-rows] duration-200 ease-out"
              style={{ gridTemplateRows: expandedStep === "paso3" ? "1fr" : "0fr" }}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="border-t border-border px-5 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-4">
                <SiteContentForm
                  tenantId={activeTenant.id}
                  tenantSlug={tenantSlug}
                  sitePages={sitePages}
                  onContentSaved={() => mutateSitePages()}
                  embedded
                />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={stepCardClass}>
          <button
            type="button"
            onClick={() => setExpandedStep((s) => (s === "paso4" ? null : "paso4"))}
            className="flex w-full min-h-[44px] cursor-pointer items-center gap-3 p-5 text-left transition-colors duration-200 hover:bg-border-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset sm:p-6"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-border-soft text-muted-foreground"
              aria-hidden
            >
              <Tag className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-foreground">
                Paso 4. Promociones
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Crea y gestiona promociones para destacar productos en tu sitio público.
              </p>
            </div>
            {expandedStep === "paso4" ? (
              <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            )}
          </button>
          <div
            className="grid transition-[grid-template-rows] duration-200 ease-out"
            style={{ gridTemplateRows: expandedStep === "paso4" ? "1fr" : "0fr" }}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="border-t border-border px-5 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-4">
                <Link
                  href={`/dashboard/${tenantSlug}/promociones`}
                  className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors duration-200 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                >
                  Administrar promociones
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
