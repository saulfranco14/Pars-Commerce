"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { useTenantStore } from "@/stores/useTenantStore";
import { MultiImageUpload } from "@/components/MultiImageUpload";
import { ArrowLeft, Plus, X } from "lucide-react";
import { serviceFormSchema } from "@/lib/serviceValidation";
import { create } from "@/services/productsService";
import { swrFetcher } from "@/lib/swrFetcher";
import type { Subcatalog } from "@/types/subcatalogs";
import { SubcatalogSelect } from "@/components/forms/SubcatalogSelect";

const subcatalogsKey = (tenantId: string) =>
  `/api/subcatalogs?tenant_id=${encodeURIComponent(tenantId)}`;

export default function NuevoServicioPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useTenantStore((s) => s.activeTenant)();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [commissionAmount, setCommissionAmount] = useState("");
  const [sku, setSku] = useState("");
  const [subcatalogId, setSubcatalogId] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const subcatalogsKeyValue = activeTenant
    ? subcatalogsKey(activeTenant.id)
    : null;
  const { data: subcatalogsData } = useSWR<Subcatalog[]>(
    subcatalogsKeyValue,
    swrFetcher,
    { fallbackData: [] },
  );
  const subcatalogs = Array.isArray(subcatalogsData) ? subcatalogsData : [];

  function deriveSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setName(value);
    if (!slug || slug === deriveSlug(name)) setSlug(deriveSlug(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    const priceNum = parseFloat(price.replace(",", "."));
    const costPriceNum = parseFloat(costPrice.replace(",", "."));
    try {
      serviceFormSchema.validateSync(
        {
          name: name.trim(),
          slug: (slug.trim() || deriveSlug(name)).toLowerCase(),
          description: description.trim() || undefined,
          price: Number.isNaN(priceNum) ? undefined : priceNum,
          cost_price: Number.isNaN(costPriceNum) ? undefined : costPriceNum,
          sku: sku.trim() || undefined,
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
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setFieldErrors({ price: "El precio debe ser mayor o igual a 0" });
      return;
    }
    if (Number.isNaN(costPriceNum) || costPriceNum < 0) {
      setFieldErrors({ cost_price: "El costo debe ser mayor o igual a 0" });
      return;
    }
    if (!activeTenant) {
      setError("No hay negocio seleccionado");
      return;
    }

    const commissionNum =
      commissionAmount.trim() === ""
        ? undefined
        : parseFloat(commissionAmount.replace(",", "."));
    if (
      commissionNum !== undefined &&
      (Number.isNaN(commissionNum) || commissionNum < 0)
    ) {
      setFieldErrors({
        commission_amount: "La comisión debe ser mayor o igual a 0",
      });
      return;
    }

    setLoading(true);
    try {
      await create({
        tenant_id: activeTenant.id,
        name: name.trim(),
        slug: (slug.trim() || deriveSlug(name)).toLowerCase(),
        description: description.trim() || undefined,
        price: priceNum,
        cost_price: costPriceNum,
        commission_amount: commissionNum,
        sku: sku.trim() || undefined,
        subcatalog_id: subcatalogId || null,
        unit: "service",
        is_public: isPublic,
        type: "service",
        track_stock: false,
        image_urls: imageUrls.length > 0 ? imageUrls : undefined,
      });
      router.push(`/dashboard/${tenantSlug}/servicios`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear el servicio");
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
    <div className="lg:mx-auto flex min-h-0 max-w-5xl flex-1 flex-col overflow-hidden">
      <div className="shrink-0 pb-4">
        <Link
          href={`/dashboard/${tenantSlug}/servicios`}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-lg"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Volver a servicios
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">
          Nuevo servicio
        </h1>
        <p className="mt-0.5 text-sm text-muted">
          Catálogo de {activeTenant.name}
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden gap-4 rounded-xl border border-border bg-surface-raised shadow-sm">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
            {error && (
              <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 alert-error">
                {error}
              </div>
            )}
            <div className="flex flex-col gap-3 sm:gap-6 md:flex-row md:items-start">
              <div className="min-w-0 flex-1">
                <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
                  <h3 className="md:col-span-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Información básica
                  </h3>
                  <div className="space-y-4 md:col-span-2 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-muted-foreground"
                      >
                        Nombre *
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={handleNameChange}
                        className="input-form mt-1 block w-full min-h-[44px] rounded-xl border border-border px-3 py-2.5 text-base text-foreground placeholder:text-muted transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 focus-visible:border-accent focus-visible:ring-accent/20"
                        placeholder="Ej. Lavado básico"
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
                        Slug (URL) *
                      </label>
                      <input
                        id="slug"
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        className="input-form mt-1 block w-full min-h-[44px] rounded-xl border border-border px-3 py-2.5 text-base text-foreground placeholder:text-muted transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 focus-visible:border-accent focus-visible:ring-accent/20"
                        placeholder="lavado-basico"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Minúsculas, números y guiones.
                      </p>
                      {fieldErrors.slug && (
                        <p className="mt-1 text-sm text-red-600">
                          {fieldErrors.slug}
                        </p>
                      )}
                    </div>
                  </div>

                  <h3 className="md:col-span-2 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Precios
                  </h3>
                  <div>
                    <label
                      htmlFor="price"
                      className="block text-sm font-medium text-muted-foreground"
                    >
                      Precio de venta *
                    </label>
                    <input
                      id="price"
                      type="text"
                      inputMode="decimal"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="input-form mt-1 block w-full min-h-[44px] rounded-xl border border-border px-3 py-2.5 text-base text-foreground placeholder:text-muted transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 focus-visible:border-accent focus-visible:ring-accent/20"
                      placeholder="0.00"
                    />
                    {fieldErrors.price && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldErrors.price}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="cost_price"
                      className="block text-sm font-medium text-muted-foreground"
                    >
                      Costo del servicio *
                    </label>
                    <input
                      id="cost_price"
                      type="text"
                      inputMode="decimal"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      className="input-form mt-1 block w-full min-h-[44px] rounded-xl border border-border px-3 py-2.5 text-base text-foreground placeholder:text-muted transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 focus-visible:border-accent focus-visible:ring-accent/20"
                      placeholder="0.00"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Cuánto te cuesta este servicio (para calcular ganancias)
                    </p>
                    {fieldErrors.cost_price && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldErrors.cost_price}
                      </p>
                    )}
                  </div>

                  <h3 className="md:col-span-2 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Categoría
                  </h3>
                  <div>
                    <label
                      htmlFor="sku"
                      className="block text-sm font-medium text-muted-foreground"
                    >
                      SKU (opcional)
                    </label>
                    <input
                      id="sku"
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="input-form mt-1 block w-full min-h-[44px] rounded-xl border border-border px-3 py-2.5 text-base text-foreground placeholder:text-muted transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 focus-visible:border-accent focus-visible:ring-accent/20"
                      placeholder="Ej. SVC-001"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Código único en inventario.
                    </p>
                  </div>

                  <div>
                    <label
                      id="subcatalog-label"
                      htmlFor="subcatalog"
                      className="block text-sm font-medium text-muted-foreground"
                    >
                      Subcatalog (opcional)
                    </label>
                    <div className="mt-1">
                      <SubcatalogSelect
                        id="subcatalog"
                        subcatalogs={subcatalogs}
                        value={subcatalogId}
                        onChange={setSubcatalogId}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Agrupa para buscar más rápido al agregar a órdenes.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="commission_amount"
                      className="block text-sm font-medium text-muted-foreground"
                    >
                      Comisión por unidad (opcional)
                    </label>
                    <input
                      id="commission_amount"
                      type="text"
                      inputMode="decimal"
                      value={commissionAmount}
                      onChange={(e) => setCommissionAmount(e.target.value)}
                      className="input-form mt-1 block w-full min-h-[44px] rounded-xl border border-border px-3 py-2.5 text-base text-foreground placeholder:text-muted transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 focus-visible:border-accent focus-visible:ring-accent/20"
                      placeholder="0.00"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Comisión que se pagará por cada servicio realizado
                    </p>
                    {fieldErrors.commission_amount && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldErrors.commission_amount}
                      </p>
                    )}
                  </div>

                  <h3 className="md:col-span-2 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Configuración
                  </h3>
                  <div className="flex flex-wrap gap-6 md:col-span-2">
                    <label className="flex min-h-[44px] cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        className="h-4 w-4 rounded border-border focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                      />
                      <span className="text-sm text-muted-foreground">
                        Visible en sitio público
                      </span>
                    </label>
                  </div>

                  <div className="md:col-span-2">
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
                      rows={2}
                      className="input-form mt-1 block w-full min-h-[44px] rounded-xl border border-border px-3 py-2.5 text-base text-foreground placeholder:text-muted transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 focus-visible:border-accent focus-visible:ring-accent/20"
                      placeholder="Descripción del servicio"
                    />
                  </div>
                </div>
              </div>
              <div className="shrink-0 rounded-xl border border-border bg-surface p-5 md:w-80 lg:w-80">
                <MultiImageUpload
                  tenantId={activeTenant.id}
                  urls={imageUrls}
                  onChange={setImageUrls}
                />
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-border bg-surface-raised px-4 py-4 sm:px-6 md:px-8">
            <div className="flex flex-1 gap-3">
              <Link
                href={`/dashboard/${tenantSlug}/servicios`}
                className="inline-flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-border-soft/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2"
              >
                <X className="h-4 w-4 shrink-0" aria-hidden />
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors duration-200 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Plus className="h-4 w-4 shrink-0" aria-hidden />
                {loading ? "Creando…" : "Crear servicio"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
