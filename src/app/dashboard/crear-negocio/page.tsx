"use client";

import { useEffect, useId, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { ArrowLeft, Plus, X, Palette, PackageCheck } from "lucide-react";
import {
  create as createTenant,
  list as listTenants,
} from "@/services/tenantsService";
import type { SiteTemplate } from "@/services/siteTemplatesService";
import { useTenantStore, type MembershipItem } from "@/stores/useTenantStore";
import { swrFetcher } from "@/lib/swrFetcher";
import { deriveSlug } from "@/features/onboarding/helpers/deriveSlug";
import { crearNegocioSchema } from "@/lib/tenantValidation";
import { BusinessCreatedSuccess } from "@/components/tenants/BusinessCreatedSuccess";
import { BUSINESS_TYPES } from "@/constants/businessTypes";
import { TemplateSelector } from "@/components/site/TemplateSelector";
import { CreateCancelActions } from "@/components/layout/CreateCancelActions";
import type { CatalogTemplatePreview } from "@/features/catalog/types";

export default function CrearNegocioPage() {
  const formId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();
  const setMemberships = useTenantStore((s) => s.setMemberships);
  const setActiveTenantId = useTenantStore((s) => s.setActiveTenantId);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [businessType, setBusinessType] = useState(() => searchParams.get("giro") ?? "");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [useStarterCatalog, setUseStarterCatalog] = useState(true);
  const [selectedCatalogKey, setSelectedCatalogKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [createdBusinessName, setCreatedBusinessName] = useState<string | null>(
    null,
  );

  const { data: templatesData } = useSWR<SiteTemplate[]>(
    "/api/site-templates",
    swrFetcher,
    { fallbackData: [] },
  );
  const templates = Array.isArray(templatesData) ? templatesData : [];
  const { data: catalogData, isLoading: catalogLoading } = useSWR<CatalogTemplatePreview[]>(
    businessType ? `/api/catalog-templates?business_type=${encodeURIComponent(businessType)}` : null,
    swrFetcher,
    { fallbackData: [] },
  );
  const catalogTemplates = Array.isArray(catalogData) ? catalogData : [];

  useEffect(() => {
    setSelectedCatalogKey(catalogTemplates[0]?.key ?? null);
  }, [businessType, catalogTemplates]);

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setName(value);
    setFieldErrors((prev) => ({ ...prev, name: "" }));
    if (!slug || slug === deriveSlug(name)) {
      setSlug(deriveSlug(value));
      setFieldErrors((prev) => ({ ...prev, slug: "" }));
    }
  }

  function handleSlugChange(value: string) {
    setSlug(value);
    setFieldErrors((prev) => ({ ...prev, slug: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    const finalSlug = slug.trim() || deriveSlug(name);
    try {
      crearNegocioSchema.validateSync(
        {
          name: name.trim(),
          slug: finalSlug,
          business_type: businessType.trim(),
        },
        { abortEarly: false },
      );
    } catch (err) {
      if (err instanceof Error && "inner" in err) {
        const inner = (err as { inner: { path?: string; message: string }[] })
          .inner;
        const next: Record<string, string> = {};
        for (const e of inner) if (e.path) next[e.path] = e.message;
        setFieldErrors(next);
        return;
      }
      setError(err instanceof Error ? err.message : "Revisa los campos");
      return;
    }
    setLoading(true);
    try {
      const tenant = (await createTenant({
        name: name.trim(),
        slug: finalSlug,
        business_type: businessType.trim(),
        site_template_id: selectedTemplateId ?? undefined,
        catalog_template_key: useStarterCatalog ? selectedCatalogKey ?? undefined : undefined,
      })) as { id: string };
      const list = (await listTenants()) as MembershipItem[];
      setMemberships(list);
      setActiveTenantId(tenant.id);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("tlaco_activeTenantId", tenant.id);
        } catch {
          console.error("Error al guardar el ID del negocio en localStorage");
        }
      }
      setCreatedBusinessName(name.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear el negocio");
    } finally {
      setLoading(false);
    }
  }

  if (createdBusinessName) {
    return (
      <BusinessCreatedSuccess
        businessName={createdBusinessName}
        onGoToDashboard={() => router.push("/dashboard")}
      />
    );
  }

  return (
    <div className="mx-auto flex min-h-0 max-w-5xl flex-1 flex-col overflow-y-auto overflow-x-hidden pb-28 md:overflow-hidden md:pb-0">
      <div className="shrink-0 pb-4">
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-lg"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Volver al inicio
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Crear negocio
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Registra tu negocio para empezar a usar el dashboard.
        </p>
      </div>

      <div className="flex shrink-0 flex-col rounded-xl border border-border bg-surface-raised shadow-sm md:min-h-0 md:flex-1 md:overflow-hidden mb-6">
        <form
          id={formId}
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col md:pb-0"
        >
          <div className="flex-1 overflow-y-auto p-4 pb-8 sm:p-6 sm:pb-8 md:p-8 md:pb-8">
            {error && (
              <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 alert-error">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-muted-foreground"
                >
                  Nombre del negocio
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  required
                  className="input-form mt-1 block w-full min-h-11 rounded-xl border border-border px-3 py-2.5 text-base text-foreground placeholder:text-muted transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 focus-visible:border-accent focus-visible:ring-accent/20"
                  placeholder="Ej. Lavado Express"
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.name}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="slug"
                  className="block text-sm font-medium text-muted-foreground"
                >
                  Slug (URL)
                </label>
                <input
                  id="slug"
                  type="text"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className="input-form mt-1 block w-full min-h-11 rounded-xl border border-border px-3 py-2.5 text-base text-foreground placeholder:text-muted transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 focus-visible:border-accent focus-visible:ring-accent/20"
                  placeholder="lavado-express"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Solo letras minúsculas, números y guiones. Se usará en la URL
                  del sitio.
                </p>
                {fieldErrors.slug && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.slug}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="businessType"
                  className="block text-sm font-medium text-muted-foreground"
                >
                  Tipo de negocio
                </label>
                <select
                  id="businessType"
                  value={businessType}
                  onChange={(e) => {
                    setBusinessType(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, business_type: "" }));
                  }}
                  className="input-form select-custom mt-1 block w-full min-h-11 rounded-xl border border-border px-3 py-2.5 text-base text-foreground transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 focus-visible:border-accent focus-visible:ring-accent/20"
                >
                  <option value="">Seleccionar</option>
                  {BUSINESS_TYPES.map((bt) => (
                    <option key={bt.value} value={bt.value}>
                      {bt.label}
                    </option>
                  ))}
                </select>
                {fieldErrors.business_type && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.business_type}
                  </p>
                )}
              </div>
              {businessType && (
                <section className="rounded-xl border border-border bg-surface p-4" aria-labelledby="starter-catalog-title">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                      <PackageCheck className="h-5 w-5 text-accent" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 id="starter-catalog-title" className="text-sm font-semibold text-foreground">Empieza con catálogo</h3>
                          <p className="mt-0.5 text-xs text-muted-foreground">Productos, servicios, precios en MXN e imágenes editables para empezar más rápido.</p>
                        </div>
                        <label className="relative inline-flex min-h-11 shrink-0 cursor-pointer items-center">
                          <input
                            type="checkbox"
                            checked={useStarterCatalog}
                            onChange={(event) => setUseStarterCatalog(event.target.checked)}
                            className="peer sr-only"
                          />
                          <span className="h-6 w-11 rounded-full bg-border transition-colors peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2" />
                          <span className="pointer-events-none absolute left-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
                          <span className="sr-only">Cargar catálogo recomendado</span>
                        </label>
                      </div>
                      {useStarterCatalog && (
                        <div className="mt-3">
                          {catalogLoading ? (
                            <p className="text-sm text-muted-foreground">Buscando el catálogo recomendado…</p>
                          ) : catalogTemplates.length > 0 ? (
                            <>
                              <label htmlFor="catalog-template" className="sr-only">Catálogo inicial</label>
                              <select
                                id="catalog-template"
                                value={selectedCatalogKey ?? ""}
                                onChange={(event) => setSelectedCatalogKey(event.target.value || null)}
                                className="select-custom min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                              >
                                {catalogTemplates.map((template) => (
                                  <option key={template.key} value={template.key}>{template.name}</option>
                                ))}
                              </select>
                              {catalogTemplates.filter((template) => template.key === selectedCatalogKey).map((template) => (
                                <p key={template.key} className="mt-2 text-xs text-muted-foreground">
                                  {template.products_count} productos · {template.services_count} servicios · Puedes editar todo después de crear el negocio.
                                </p>
                              ))}
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground">Aún no hay catálogo para este giro. Puedes iniciar vacío.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                    <Palette className="h-4 w-4 text-accent" aria-hidden />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Apariencia de tu sitio (opcional)
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Elige cómo quieres que se vea tu catálogo público.
                    </p>
                  </div>
                </div>
                <TemplateSelector
                  templates={templates}
                  selectedTemplateId={selectedTemplateId}
                  onSelect={(t) =>
                    setSelectedTemplateId((prev) =>
                      prev === t.id ? null : t.id,
                    )
                  }
                  compact
                />
              </div>
            </div>
          </div>
          <CreateCancelActions
            createLabel="Crear negocio"
            cancelHref="/dashboard"
            loading={loading}
            loadingLabel="Creando…"
            createIcon={<Plus className="h-4 w-4 shrink-0" aria-hidden />}
            cancelIcon={<X className="h-4 w-4 shrink-0" aria-hidden />}
            formId={formId}
          />
        </form>
      </div>
    </div>
  );
}
