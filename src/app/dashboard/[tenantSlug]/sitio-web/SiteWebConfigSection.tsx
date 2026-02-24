"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import { ArrowRight, Check, Save } from "lucide-react";
import { useActiveTenant, useTenantStore } from "@/stores/useTenantStore";
import type { MembershipItem } from "@/stores/useTenantStore";
import type { SitePage } from "@/types/tenantSitePages";
import { SiteContentForm } from "@/features/configuracion/components/SiteContentForm";
import {
  update as updateTenant,
  list as listTenants,
} from "@/services/tenantsService";
import type { SiteTemplate } from "@/services/siteTemplatesService";
import { swrFetcher } from "@/lib/swrFetcher";
import { SiteWebGeneralTab } from "./SiteWebGeneralTab";
import { SiteWebRedesTab } from "./SiteWebRedesTab";

import { SITIO_TABS, type SitioTab } from "@/features/sitio-web/constants/tabs";
import type { SiteWebConfigSectionProps } from "@/features/sitio-web/interfaces/siteWebConfig";

const sitePagesKey = (tenantId: string) =>
  `/api/tenant-site-pages?tenant_id=${encodeURIComponent(tenantId)}`;

export function SiteWebConfigSection({
  tenantSlug,
}: SiteWebConfigSectionProps) {
  const activeTenant = useActiveTenant();
  const setMemberships = useTenantStore((s) => s.setMemberships);
  const [activeTab, setActiveTab] = useState<SitioTab>("general");

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
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [appearanceLoading, setAppearanceLoading] = useState(false);
  const [appearanceSuccess, setAppearanceSuccess] = useState<string | null>(
    null,
  );

  const savedTemplateId =
    (activeTenant as { site_template_id?: string | null })?.site_template_id ??
    null;
  const savedThemeColor = (activeTenant?.theme_color ?? "").trim();
  const appearanceDirty =
    selectedTemplateId !== savedTemplateId ||
    (themeColor || "").trim() !== savedThemeColor;

  const sitePagesKeyValue = activeTenant ? sitePagesKey(activeTenant.id) : null;
  const { data: sitePagesData, mutate: mutateSitePages } = useSWR<SitePage[]>(
    sitePagesKeyValue,
    swrFetcher,
    { fallbackData: [] },
  );
  const sitePages = Array.isArray(sitePagesData) ? sitePagesData : [];

  const { data: templatesData } = useSWR<SiteTemplate[]>(
    "/api/site-templates",
    swrFetcher,
    { fallbackData: [] },
  );
  const templates = Array.isArray(templatesData) ? templatesData : [];

  useEffect(() => {
    if (!activeTenant) return;
    setPublicStoreEnabled(activeTenant.public_store_enabled ?? false);
    setThemeColor(activeTenant.theme_color ?? "");
    setSelectedTemplateId(
      (activeTenant as { site_template_id?: string | null }).site_template_id ??
        null,
    );
    setAppearanceSuccess(null);
    setWhatsappPhone(
      (activeTenant as { whatsapp_phone?: string }).whatsapp_phone ?? "",
    );
    const sl = (
      activeTenant as {
        social_links?: {
          instagram?: string;
          facebook?: string;
          twitter?: string;
        };
      }
    ).social_links;
    setInstagramUrl(sl?.instagram ?? "");
    setFacebookUrl(sl?.facebook ?? "");
    setTwitterUrl(sl?.twitter ?? "");
  }, [activeTenant?.id]);

  function handleTabChange(tab: SitioTab) {
    setActiveTab(tab);
  }

  async function handleTogglePublicStore(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
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
      setAppearanceSuccess(
        "Apariencia guardada. La vista previa se actualizará.",
      );
      const list = (await listTenants()) as MembershipItem[];
      setMemberships(list ?? []);
    } finally {
      setAppearanceLoading(false);
    }
  }

  function handleTemplateSelect(t: SiteTemplate) {
    setSelectedTemplateId((prev) => (prev === t.id ? null : t.id));
    setAppearanceSuccess(null);
    if (t.default_theme_color && !savedThemeColor) {
      setThemeColor(t.default_theme_color);
    }
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

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 p-4 pb-0 sm:p-5 sm:pb-0">
        <div className="flex rounded-xl bg-muted/40 p-1 gap-0.5">
          {SITIO_TABS.map((tab) => {
            const isActive = activeTab === tab.value;
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleTabChange(tab.value)}
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-[10px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/40 ${
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {tab.shortLabel}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-4 sm:px-5 sm:pb-6 sm:pt-4">
        {activeTab === "general" && (
          <SiteWebGeneralTab
            tenantSlug={tenantSlug}
            publicStoreEnabled={publicStoreEnabled}
            publicStoreLoading={publicStoreLoading}
            onTogglePublicStore={handleTogglePublicStore}
            templates={templates}
            selectedTemplateId={selectedTemplateId}
            onTemplateSelect={handleTemplateSelect}
            themeColor={themeColor}
            onThemeColorChange={handleThemeColorChange}
            appearanceLoading={appearanceLoading}
            appearanceDirty={appearanceDirty}
            appearanceSuccess={appearanceSuccess}
            onSaveAppearance={handleSaveAppearance}
          />
        )}

        {activeTab === "redes" && (
          <SiteWebRedesTab
            whatsappPhone={whatsappPhone}
            onWhatsappPhoneChange={setWhatsappPhone}
            instagramUrl={instagramUrl}
            onInstagramUrlChange={setInstagramUrl}
            facebookUrl={facebookUrl}
            onFacebookUrlChange={setFacebookUrl}
            twitterUrl={twitterUrl}
            onTwitterUrlChange={setTwitterUrl}
            loading={redesLoading}
            error={redesError}
            success={redesSuccess}
            onSave={handleSaveRedes}
          />
        )}

        {activeTab === "contenido" && publicStoreEnabled && (
          <SiteContentForm
            tenantId={activeTenant.id}
            tenantSlug={tenantSlug}
            sitePages={sitePages}
            onContentSaved={() => mutateSitePages()}
            embedded
          />
        )}

        {activeTab === "contenido" && !publicStoreEnabled && (
          <div className="rounded-xl border border-border/50 bg-muted/20 px-4 py-6 text-center">
            <p className="text-sm font-medium text-foreground">
              Tienda pública desactivada
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Activa la tienda pública en la pestaña{" "}
              <button
                type="button"
                onClick={() => handleTabChange("general")}
                className="font-medium text-accent underline underline-offset-2 hover:no-underline"
              >
                General
              </button>{" "}
              para editar el contenido.
            </p>
          </div>
        )}

        {activeTab === "promociones" && (
          <div className="rounded-xl border border-border/50 bg-muted/10 px-4 py-4">
            <p className="text-sm text-muted-foreground">
              Crea y gestiona descuentos, cupones y ofertas especiales para tus
              clientes.
            </p>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-border/60 bg-background shadow-[0_-2px_8px_rgba(0,0,0,0.04)] px-4 py-3 sm:px-5 min-h-[60px] flex items-center">
        {activeTab === "general" && (
          <button
            type="submit"
            form="appearance-form"
            disabled={appearanceLoading || !appearanceDirty}
            className="flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm transition-colors duration-200 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check className="h-4 w-4 shrink-0" aria-hidden />
            {appearanceLoading ? "Guardando…" : "Guardar apariencia"}
          </button>
        )}
        {activeTab === "redes" && (
          <button
            type="submit"
            form="redes-form"
            disabled={redesLoading}
            className="flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm transition-colors duration-200 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4 shrink-0" aria-hidden />
            {redesLoading ? "Guardando…" : "Guardar redes"}
          </button>
        )}
        {activeTab === "contenido" && publicStoreEnabled && (
          <p className="text-center text-xs text-muted-foreground">
            Guarda los cambios en cada sección (Inicio, Nosotros, Contacto).
          </p>
        )}
        {activeTab === "promociones" && (
          <Link
            href={`/dashboard/${tenantSlug}/promociones`}
            className="flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm transition-colors duration-200 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Administrar promociones
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
          </Link>
        )}
      </div>
    </div>
  );
}
