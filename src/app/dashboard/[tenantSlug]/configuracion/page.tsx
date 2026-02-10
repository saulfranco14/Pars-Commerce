"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTenantStore } from "@/stores/useTenantStore";
import type { MembershipItem } from "@/stores/useTenantStore";
import type { SitePage } from "@/types/tenantSitePages";
import { list as listSitePages } from "@/services/tenantSitePagesService";
import { update as updateTenant, list as listTenants } from "@/services/tenantsService";

export default function ConfiguracionPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useTenantStore((s) => s.activeTenant)();
  const setMemberships = useTenantStore((s) => s.setMemberships);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [themeColor, setThemeColor] = useState("");
  const [publicStoreEnabled, setPublicStoreEnabled] = useState(false);
  const [sitePages, setSitePages] = useState<SitePage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeTenant) return;
    setName(activeTenant.name ?? "");
    setDescription(activeTenant.description ?? "");
    setThemeColor(activeTenant.theme_color ?? "");
    setPublicStoreEnabled(activeTenant.public_store_enabled ?? false);
  }, [activeTenant?.id]);

  useEffect(() => {
    if (!activeTenant?.id) return;
    listSitePages(activeTenant.id)
      .then(setSitePages)
      .catch(() => setSitePages([]));
  }, [activeTenant?.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!activeTenant) {
      setError("No hay negocio seleccionado");
      return;
    }
    setLoading(true);
    try {
      await updateTenant(activeTenant.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        theme_color: themeColor.trim() || undefined,
        public_store_enabled: publicStoreEnabled,
      });
      setSuccess(true);
      const list = (await listTenants()) as MembershipItem[];
      setMemberships(list ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setLoading(false);
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
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold text-foreground">Configuración</h1>
      <p className="mt-1 text-sm text-muted">
        Datos del negocio y sitio web. El nombre y la descripción se muestran en
        tu sitio público. El color del tema se aplica al sitio. Si habilitas la
        tienda pública, el catálogo y las secciones serán visibles en la URL de
        tu sitio.
      </p>

      {publicStoreEnabled && (
        <div className="mt-4 rounded-lg border border-border bg-border-soft p-3">
          <a
            href={`/sitio/${tenantSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-foreground underline hover:no-underline"
          >
            Ver mi sitio
          </a>
          <p className="mt-1 text-xs text-muted">
            Se abre en una nueva pestaña.
          </p>
        </div>
      )}
      {!publicStoreEnabled && (
        <p className="mt-2 text-sm text-muted">
          Habilita la tienda pública para ver el enlace a tu sitio.
        </p>
      )}

      <div className="mt-4 rounded-lg border border-border bg-surface-raised p-3">
        <h2 className="text-sm font-medium text-foreground">
          Secciones del sitio (hasta 5)
        </h2>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          {sitePages.length === 0 ? (
            <li>Cargando secciones...</li>
          ) : (
            sitePages.map((p) => (
              <li key={p.id}>
                {p.title} <span className="text-muted">/ {p.slug}</span>
              </li>
            ))
          )}
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
            Cambios guardados.
          </div>
        )}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-zinc-700"
          >
            Nombre del negocio
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-foreground"
            placeholder="Ej. Lavado express"
          />
        </div>
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-zinc-700"
          >
            Descripción (opcional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-foreground"
            placeholder="Breve descripción del negocio"
          />
        </div>
        <div>
          <label
            htmlFor="themeColor"
            className="block text-sm font-medium text-zinc-700"
          >
            Color del tema (opcional)
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id="themeColor"
              type="color"
              value={themeColor || "#18181b"}
              onChange={(e) => setThemeColor(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded border border-border"
            />
            <input
              type="text"
              value={themeColor}
              onChange={(e) => setThemeColor(e.target.value)}
              className="block flex-1 rounded-md border border-border px-3 py-2 text-foreground"
              placeholder="#18181b"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="publicStore"
            type="checkbox"
            checked={publicStoreEnabled}
            onChange={(e) => setPublicStoreEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          <label htmlFor="publicStore" className="text-sm text-zinc-700">
            Tienda pública habilitada (mostrar catálogo en sitio web)
          </label>
        </div>
        <div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}
