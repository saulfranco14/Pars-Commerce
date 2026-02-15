"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Globe, MessageCircle, FileText, Check, ChevronDown, ChevronUp, Tag, ArrowRight } from "lucide-react";
import { useTenantStore } from "@/stores/useTenantStore";
import type { MembershipItem } from "@/stores/useTenantStore";
import type { SitePage } from "@/types/tenantSitePages";
import { SiteContentForm } from "@/app/dashboard/[tenantSlug]/configuracion/SiteContentForm";
import { update as updateTenant, list as listTenants } from "@/services/tenantsService";
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
  const [themeColorLoading, setThemeColorLoading] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [redesLoading, setRedesLoading] = useState(false);
  const [redesError, setRedesError] = useState<string | null>(null);
  const [redesSuccess, setRedesSuccess] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<"paso1" | "paso2" | "paso3" | "paso4" | null>("paso1");

  const sitePagesKeyValue = activeTenant ? sitePagesKey(activeTenant.id) : null;
  const { data: sitePagesData, mutate: mutateSitePages } = useSWR<SitePage[]>(
    sitePagesKeyValue,
    swrFetcher,
    { fallbackData: [] },
  );
  const sitePages = Array.isArray(sitePagesData) ? sitePagesData : [];

  useEffect(() => {
    if (!activeTenant) return;
    setPublicStoreEnabled(activeTenant.public_store_enabled ?? false);
    setThemeColor(activeTenant.theme_color ?? "");
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

  async function handleSaveThemeColor(e: React.FormEvent) {
    e.preventDefault();
    if (!activeTenant) return;
    setThemeColorLoading(true);
    try {
      await updateTenant(activeTenant.id, { theme_color: themeColor.trim() || undefined });
      const list = (await listTenants()) as MembershipItem[];
      setMemberships(list ?? []);
    } finally {
      setThemeColorLoading(false);
    }
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
              <div className="mt-6 border-t border-border pt-4">
                <label htmlFor="themeColor" className="block text-sm font-medium text-muted-foreground">
                  Color del tema (opcional)
                </label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Color principal del sitio. Se usa en botones, enlaces y acentos.
                </p>
                <form onSubmit={handleSaveThemeColor} className="mt-3 flex flex-wrap items-end gap-3">
                  <div className="flex gap-2">
                    <input
                      id="themeColor"
                      type="color"
                      value={themeColor || "#6366f1"}
                      onChange={(e) => setThemeColor(e.target.value)}
                      className="h-10 w-12 cursor-pointer rounded-lg border border-border shrink-0"
                    />
                    <input
                      type="text"
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      className={inputClass}
                      placeholder="#6366f1"
                      style={{ minWidth: "120px" }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={themeColorLoading}
                    className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors duration-200 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <Check className="h-4 w-4 shrink-0" aria-hidden />
                    {themeColorLoading ? "Guardando…" : "Guardar"}
                  </button>
                </form>
              </div>
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
