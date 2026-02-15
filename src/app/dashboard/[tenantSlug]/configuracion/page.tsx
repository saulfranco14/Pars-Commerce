"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { ArrowLeft, Check } from "lucide-react";
import { useTenantStore } from "@/stores/useTenantStore";
import type { MembershipItem } from "@/stores/useTenantStore";
import type { SitePage } from "@/types/tenantSitePages";
import { SiteContentForm } from "./SiteContentForm";
import { update as updateTenant, list as listTenants } from "@/services/tenantsService";
import { swrFetcher } from "@/lib/swrFetcher";

const sitePagesKey = (tenantId: string) =>
  `/api/tenant-site-pages?tenant_id=${encodeURIComponent(tenantId)}`;

export default function ConfiguracionPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useTenantStore((s) => s.activeTenant)();
  const setMemberships = useTenantStore((s) => s.setMemberships);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [themeColor, setThemeColor] = useState("");
  const [publicStoreEnabled, setPublicStoreEnabled] = useState(false);
  const [expressOrderEnabled, setExpressOrderEnabled] = useState(false);
  const [addressStreet, setAddressStreet] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressState, setAddressState] = useState("");
  const [addressPostalCode, setAddressPostalCode] = useState("");
  const [addressCountry, setAddressCountry] = useState("");
  const [addressPhone, setAddressPhone] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [monthlySalesObjective, setMonthlySalesObjective] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const sitePagesKeyValue = activeTenant
    ? sitePagesKey(activeTenant.id)
    : null;
  const { data: sitePagesData, mutate: mutateSitePages } = useSWR<SitePage[]>(
    sitePagesKeyValue,
    swrFetcher,
    { fallbackData: [] },
  );
  const sitePages = Array.isArray(sitePagesData) ? sitePagesData : [];

  useEffect(() => {
    if (!activeTenant) return;
    setName(activeTenant.name ?? "");
    setDescription(activeTenant.description ?? "");
    setThemeColor(activeTenant.theme_color ?? "");
    setPublicStoreEnabled(activeTenant.public_store_enabled ?? false);
    const st = activeTenant.settings as Record<string, unknown> | null | undefined;
    setExpressOrderEnabled(st?.express_order_enabled === true);
    const addr = activeTenant.address;
    setAddressStreet(addr?.street ?? "");
    setAddressCity(addr?.city ?? "");
    setAddressState(addr?.state ?? "");
    setAddressPostalCode(addr?.postal_code ?? "");
    setAddressCountry(addr?.country ?? "");
    setAddressPhone(addr?.phone ?? "");
    const sc = activeTenant.sales_config;
    setMonthlyRent(sc?.monthly_rent != null ? String(sc.monthly_rent) : "");
    setMonthlySalesObjective(sc?.monthly_sales_objective != null ? String(sc.monthly_sales_objective) : "");
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
        settings: {
          ...((activeTenant.settings as Record<string, unknown>) ?? {}),
          express_order_enabled: expressOrderEnabled,
        },
        address: {
          street: addressStreet.trim() || undefined,
          city: addressCity.trim() || undefined,
          state: addressState.trim() || undefined,
          postal_code: addressPostalCode.trim() || undefined,
          country: addressCountry.trim() || undefined,
          phone: addressPhone.trim() || undefined,
        },
        monthly_rent: (() => {
          const n = parseFloat(monthlyRent);
          return monthlyRent !== "" && !Number.isNaN(n) ? n : undefined;
        })(),
        monthly_sales_objective: (() => {
          const n = parseFloat(monthlySalesObjective);
          return monthlySalesObjective !== "" && !Number.isNaN(n) ? n : undefined;
        })(),
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
      <div className="text-sm text-muted-foreground-foreground">
        Selecciona un negocio para continuar.
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-0 max-w-4xl flex-1 flex-col overflow-hidden">
      <div className="shrink-0 pb-4">
        <Link
          href={`/dashboard/${tenantSlug}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-lg"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Volver al inicio
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">
          Configuración
        </h1>
        <p className="mt-0.5 text-sm text-muted">
          Datos del negocio y sitio web. El nombre y la descripción se muestran
          en tu sitio público.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-surface-raised shadow-sm">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
            {error && (
              <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 alert-error">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 alert-success">
                Cambios guardados.
              </div>
            )}

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
          <p className="mt-1 text-xs text-muted-foreground">
            Se abre en una nueva pestaña.
          </p>
        </div>
      )}
      {!publicStoreEnabled && (
        <p className="mt-2 text-sm text-muted-foreground">
          Habilita la tienda pública para ver el enlace a tu sitio.
        </p>
      )}

      <div className="mt-4 rounded-lg border border-border bg-surface-raised p-3">
        <h2 className="text-sm font-medium text-foreground">
          Secciones del sitio (hasta 5)
        </h2>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground-foreground">
          {sitePages.length === 0 ? (
            <li>Cargando secciones...</li>
          ) : (
            sitePages.map((p) => (
              <li key={p.id}>
                {p.title} <span className="text-muted-foreground">/ {p.slug}</span>
              </li>
            ))
          )}
        </ul>
      </div>

      {publicStoreEnabled && (
        <SiteContentForm
          tenantId={activeTenant.id}
          tenantSlug={tenantSlug}
          sitePages={sitePages}
          onContentSaved={() => mutateSitePages()}
        />
      )}

      <div className="mt-6 space-y-4">
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
            onChange={(e) => setName(e.target.value)}
            required
            className="input-form mt-1 block w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="Ej. Lavado express"
          />
        </div>
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-muted-foreground"
          >
            Descripción (opcional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="input-form mt-1 block w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="Breve descripción del negocio"
          />
        </div>
        <div>
          <label
            htmlFor="themeColor"
            className="block text-sm font-medium text-muted-foreground"
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
              className="input-form block flex-1 min-h-[44px] rounded-xl border px-3 py-2.5 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
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
          <label htmlFor="publicStore" className="text-sm text-muted-foreground-foreground">
            Tienda pública habilitada (mostrar catálogo en sitio web)
          </label>
        </div>

        <div className="rounded-lg border border-border bg-border-soft/60 p-4">
          <h2 className="text-sm font-semibold text-foreground">Flujo de órdenes</h2>
          <div className="mt-3 flex items-start gap-2">
            <input
              id="expressOrder"
              type="checkbox"
              checked={expressOrderEnabled}
              onChange={(e) => setExpressOrderEnabled(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-border"
            />
            <label htmlFor="expressOrder" className="text-sm text-muted-foreground">
              Orden Express. Permite crear el pedido y pagar de inmediato, ideal para cobros rápidos sin asignación ni seguimiento.
            </label>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-stone-50/30 p-4 space-y-4">
          <h2 className="text-sm font-medium text-foreground">Finanzas del negocio</h2>
          <p className="text-xs text-muted-foreground">
            Renta y objetivo de ventas para el dashboard.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="monthlyRent" className="block text-xs font-medium text-muted-foreground">
                Renta mensual
              </label>
              <input
                id="monthlyRent"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(e.target.value)}
                className="input-form mt-1 block w-full min-h-[40px] rounded-lg border px-3 py-2 text-sm text-foreground"
                placeholder="0.00"
              />
            </div>
            <div>
              <label htmlFor="monthlySalesObjective" className="block text-xs font-medium text-muted-foreground">
                Objetivo de ventas mensual
              </label>
              <input
                id="monthlySalesObjective"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={monthlySalesObjective}
                onChange={(e) => setMonthlySalesObjective(e.target.value)}
                className="input-form mt-1 block w-full min-h-[40px] rounded-lg border px-3 py-2 text-sm text-foreground"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-stone-50/30 p-4 space-y-4">
          <h2 className="text-sm font-medium text-foreground">Dirección del negocio</h2>
          <p className="text-xs text-muted-foreground">
            Se muestra en el ticket al imprimir.
          </p>
          <div>
            <label htmlFor="addressStreet" className="block text-xs font-medium text-muted-foreground">
              Calle y número
            </label>
            <input
              id="addressStreet"
              type="text"
              value={addressStreet}
              onChange={(e) => setAddressStreet(e.target.value)}
              className="input-form mt-1 block w-full min-h-[40px] rounded-lg border px-3 py-2 text-sm text-foreground"
              placeholder="Av. Principal 123"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="addressCity" className="block text-xs font-medium text-muted-foreground">
                Ciudad
              </label>
              <input
                id="addressCity"
                type="text"
                value={addressCity}
                onChange={(e) => setAddressCity(e.target.value)}
                className="input-form mt-1 block w-full min-h-[40px] rounded-lg border px-3 py-2 text-sm text-foreground"
                placeholder="CDMX"
              />
            </div>
            <div>
              <label htmlFor="addressState" className="block text-xs font-medium text-muted-foreground">
                Estado/Región
              </label>
              <input
                id="addressState"
                type="text"
                value={addressState}
                onChange={(e) => setAddressState(e.target.value)}
                className="input-form mt-1 block w-full min-h-[40px] rounded-lg border px-3 py-2 text-sm text-foreground"
                placeholder="CDMX"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="addressPostalCode" className="block text-xs font-medium text-muted-foreground">
                Código postal
              </label>
              <input
                id="addressPostalCode"
                type="text"
                value={addressPostalCode}
                onChange={(e) => setAddressPostalCode(e.target.value)}
                className="input-form mt-1 block w-full min-h-[40px] rounded-lg border px-3 py-2 text-sm text-foreground"
                placeholder="06000"
              />
            </div>
            <div>
              <label htmlFor="addressCountry" className="block text-xs font-medium text-muted-foreground">
                País
              </label>
              <input
                id="addressCountry"
                type="text"
                value={addressCountry}
                onChange={(e) => setAddressCountry(e.target.value)}
                className="input-form mt-1 block w-full min-h-[40px] rounded-lg border px-3 py-2 text-sm text-foreground"
                placeholder="México"
              />
            </div>
          </div>
          <div>
            <label htmlFor="addressPhone" className="block text-xs font-medium text-muted-foreground">
              Teléfono del negocio
            </label>
            <input
              id="addressPhone"
              type="text"
              value={addressPhone}
              onChange={(e) => setAddressPhone(e.target.value)}
              className="input-form mt-1 block w-full min-h-[40px] rounded-lg border px-3 py-2 text-sm text-foreground"
              placeholder="555-0000"
            />
          </div>
        </div>
      </div>

          </div>
          <div className="flex shrink-0 justify-end border-t border-border bg-surface-raised px-4 py-4 sm:px-6 md:px-8">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors duration-200 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Check className="h-4 w-4 shrink-0" aria-hidden />
              {loading ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
