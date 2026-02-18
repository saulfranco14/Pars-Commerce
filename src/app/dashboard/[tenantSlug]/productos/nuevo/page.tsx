"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { useTenantStore } from "@/stores/useTenantStore";
import { MultiImageUpload } from "@/components/MultiImageUpload";
import { ArrowLeft, Plus, X, ChevronDown } from "lucide-react";
import { productFormSchema } from "@/lib/productValidation";
import { create } from "@/services/productsService";
import { swrFetcher } from "@/lib/swrFetcher";
import type { Subcatalog } from "@/types/subcatalogs";
import { SubcatalogSelect } from "@/components/forms/SubcatalogSelect";
import { btnPrimaryFlex, btnSecondaryFlex } from "@/components/ui/buttonClasses";

const subcatalogsKey = (tenantId: string) =>
  `/api/subcatalogs?tenant_id=${encodeURIComponent(tenantId)}`;

export default function NuevoProductoPage() {
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
  const [unit, setUnit] = useState("unit");
  const [theme, setTheme] = useState("");
  const [subcatalogId, setSubcatalogId] = useState("");
  const [wholesaleMinQuantity, setWholesaleMinQuantity] = useState("");
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [trackStock, setTrackStock] = useState(true);
  const [stock, setStock] = useState("");
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
      productFormSchema.validateSync(
        {
          name: name.trim(),
          slug: (slug.trim() || deriveSlug(name)).toLowerCase(),
          description: description.trim() || undefined,
          price: Number.isNaN(priceNum) ? undefined : priceNum,
          cost_price: Number.isNaN(costPriceNum) ? undefined : costPriceNum,
          sku: sku.trim() || undefined,
          unit: unit.trim() || "unit",
          theme: theme.trim() || undefined,
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

    const stockNum = stock.trim() === "" ? undefined : parseInt(stock, 10);
    if (stockNum !== undefined && (Number.isNaN(stockNum) || stockNum < 0)) {
      setFieldErrors({ stock: "Stock debe ser un número mayor o igual a 0" });
      return;
    }

    const hasWholesaleMin = wholesaleMinQuantity.trim() !== "";
    const hasWholesalePrice = wholesalePrice.trim() !== "";
    if (hasWholesaleMin !== hasWholesalePrice) {
      setFieldErrors({
        wholesale:
          "Cantidad mínima y precio mayoreo deben ir juntos o ambos vacíos",
      });
      return;
    }
    let wholesaleMinNum: number | undefined;
    let wholesalePriceNum: number | undefined;
    if (hasWholesaleMin) {
      wholesaleMinNum = parseInt(wholesaleMinQuantity, 10);
      wholesalePriceNum = parseFloat(wholesalePrice.replace(",", "."));
      if (Number.isNaN(wholesaleMinNum) || wholesaleMinNum < 1) {
        setFieldErrors({
          wholesale: "Cantidad mínima debe ser mayor o igual a 1",
        });
        return;
      }
      if (Number.isNaN(wholesalePriceNum) || wholesalePriceNum < 0) {
        setFieldErrors({
          wholesale: "Precio mayoreo debe ser mayor o igual a 0",
        });
        return;
      }
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
        unit: unit.trim() || "unit",
        theme: theme.trim() || undefined,
        subcatalog_id: subcatalogId || null,
        track_stock: trackStock,
        stock: trackStock && stockNum !== undefined ? stockNum : undefined,
        is_public: isPublic,
        image_urls: imageUrls.length > 0 ? imageUrls : undefined,
        wholesale_min_quantity: wholesaleMinNum ?? null,
        wholesale_price: wholesalePriceNum ?? null,
      });
      router.push(`/dashboard/${tenantSlug}/productos`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear el producto");
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
    <div className="mx-auto max-w-4xl">
      <div className="pb-4">
        <Link
          href={`/dashboard/${tenantSlug}/productos`}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-lg"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Volver a productos
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">
          Nuevo producto
        </h1>
        <p className="mt-0.5 text-sm text-muted">
          Catálogo de {activeTenant.name}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface-raised shadow-sm">
        <form onSubmit={handleSubmit}>
          <div className="p-4 sm:p-6 md:p-8">
            {error && (
              <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 alert-error">
                {error}
              </div>
            )}
            <div className="flex flex-col gap-3 sm:gap-6 md:flex-row md:items-start">
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-8">
                  {/* ── Información básica ── */}
                  <section>
                    <div className="mb-4 border-b border-border pb-2">
                      <h3 className="text-sm font-semibold text-foreground">
                        Información básica
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Nombre, descripción, stock y precio por volumen.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-foreground"
                        >
                          Nombre *
                        </label>
                        <input
                          id="name"
                          type="text"
                          value={name}
                          onChange={handleNameChange}
                          className="input-form mt-1 block w-full min-h-[44px] rounded-xl border border-border px-3 py-2.5 text-base text-foreground placeholder:text-muted transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 focus-visible:border-accent focus-visible:ring-accent/20"
                          placeholder="Ej. Mesa 14x10"
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
                          className="block text-sm font-medium text-foreground"
                        >
                          Slug (URL) *
                        </label>
                        <input
                          id="slug"
                          type="text"
                          value={slug}
                          onChange={(e) => setSlug(e.target.value)}
                          className="input-form mt-1 block w-full min-h-[44px] rounded-xl border border-border px-3 py-2.5 text-base text-foreground placeholder:text-muted transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 focus-visible:border-accent focus-visible:ring-accent/20"
                          placeholder="mesa-14x10"
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
                      <div className="md:col-span-2">
                        <label
                          htmlFor="description"
                          className="block text-sm font-medium text-foreground"
                        >
                          Descripción (opcional)
                        </label>
                        <textarea
                          id="description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={2}
                          className="input-form mt-1 block w-full min-h-[44px] rounded-xl border border-border px-3 py-2.5 text-base text-foreground placeholder:text-muted transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 focus-visible:border-accent focus-visible:ring-accent/20"
                          placeholder="Descripción del producto"
                        />
                      </div>
                      {/* Stock inicial y Mayoreo en la misma fila */}
                      <div>
                        <label
                          htmlFor="stock"
                          className="block text-sm font-medium text-foreground"
                        >
                          Stock inicial
                        </label>
                        <input
                          id="stock"
                          type="number"
                          min={0}
                          value={stock}
                          disabled={!trackStock}
                          onChange={(e) => setStock(e.target.value)}
                          className="input-form mt-1 w-full min-h-[44px] rounded-xl border border-border px-3 py-2.5 text-base text-foreground transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 focus-visible:border-accent focus-visible:ring-accent/20 disabled:opacity-40 disabled:cursor-not-allowed"
                          placeholder="0"
                        />
                        {fieldErrors.stock && (
                          <p className="mt-1 text-sm text-red-600">
                            {fieldErrors.stock}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground">
                          Mayoreo (opcional)
                        </label>
                        <details className="group mt-1 rounded-xl border border-border overflow-hidden">
                          <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-2 bg-surface px-4 py-3 text-sm text-muted-foreground transition-colors duration-200 hover:bg-border-soft [&::-webkit-details-marker]:hidden">
                            <span>Configurar precio</span>
                            <ChevronDown
                              className="h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-180"
                              aria-hidden
                            />
                          </summary>
                          <div className="px-4 py-4 grid grid-cols-1 gap-4 border-t border-border">
                            <div>
                              <label
                                htmlFor="wholesale_min"
                                className="block text-sm font-medium text-foreground"
                              >
                                Cantidad mínima
                              </label>
                              <input
                                id="wholesale_min"
                                type="number"
                                min={1}
                                value={wholesaleMinQuantity}
                                onChange={(e) =>
                                  setWholesaleMinQuantity(e.target.value)
                                }
                                className="input-form mt-1 block w-full min-h-[44px] rounded-xl border border-border px-3 py-2.5 text-base text-foreground placeholder:text-muted transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 focus-visible:border-accent focus-visible:ring-accent/20"
                                placeholder="Ej. 10"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="wholesale_price"
                                className="block text-sm font-medium text-foreground"
                              >
                                Precio por unidad
                              </label>
                              <input
                                id="wholesale_price"
                                type="text"
                                inputMode="decimal"
                                value={wholesalePrice}
                                onChange={(e) =>
                                  setWholesalePrice(e.target.value)
                                }
                                className="input-form mt-1 block w-full min-h-[44px] rounded-xl border border-border px-3 py-2.5 text-base text-foreground placeholder:text-muted transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 focus-visible:border-accent focus-visible:ring-accent/20"
                                placeholder="0.00"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Si uno tiene valor, el otro es requerido.
                            </p>
                          </div>
                          {fieldErrors.wholesale && (
                            <p className="px-4 pb-4 text-sm text-red-600">
                              {fieldErrors.wholesale}
                            </p>
                          )}
                        </details>
                      </div>
                    </div>
                  </section>

                  {/* ── Precios ── */}
                  <section>
                    <div className="mb-4 border-b border-border pb-2">
                      <h3 className="text-sm font-semibold text-foreground">
                        Precios
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Precio de venta, costo y comisión por unidad.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label
                          htmlFor="price"
                          className="block text-sm font-medium text-foreground"
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
                          className="block text-sm font-medium text-foreground"
                        >
                          Costo del producto *
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
                          Cuánto te cuesta (para calcular ganancias)
                        </p>
                        {fieldErrors.cost_price && (
                          <p className="mt-1 text-sm text-red-600">
                            {fieldErrors.cost_price}
                          </p>
                        )}
                      </div>
                      <div>
                        <label
                          htmlFor="commission_amount"
                          className="block text-sm font-medium text-foreground"
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
                          Comisión que se pagará por cada unidad vendida
                        </p>
                        {fieldErrors.commission_amount && (
                          <p className="mt-1 text-sm text-red-600">
                            {fieldErrors.commission_amount}
                          </p>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* ── Inventario y categoría ── */}
                  <section>
                    <div className="mb-4 border-b border-border pb-2">
                      <h3 className="text-sm font-semibold text-foreground">
                        Inventario y categoría
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        SKU, unidad de medida, tema y subcatálogo.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label
                          htmlFor="sku"
                          className="block text-sm font-medium text-foreground"
                        >
                          SKU (opcional)
                        </label>
                        <input
                          id="sku"
                          type="text"
                          value={sku}
                          onChange={(e) => setSku(e.target.value)}
                          className="input-form mt-1 block w-full min-h-[44px] rounded-xl border border-border px-3 py-2.5 text-base text-foreground placeholder:text-muted transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 focus-visible:border-accent focus-visible:ring-accent/20"
                          placeholder="Ej. MESA-001"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          Código único en inventario.
                        </p>
                      </div>
                      <div>
                        <label
                          htmlFor="unit"
                          className="block text-sm font-medium text-foreground"
                        >
                          Unidad *
                        </label>
                        <input
                          id="unit"
                          type="text"
                          value={unit}
                          onChange={(e) => setUnit(e.target.value)}
                          className="input-form mt-1 block w-full min-h-[44px] rounded-xl border border-border px-3 py-2.5 text-base text-foreground placeholder:text-muted transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 focus-visible:border-accent focus-visible:ring-accent/20"
                          placeholder="unit, kg, pza, hora..."
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          Cómo se vende: &quot;unit&quot; = por pieza,
                          &quot;kg&quot; = por kilo, &quot;pza&quot; = pieza,
                          &quot;hora&quot; = por hora, etc.
                        </p>
                        {fieldErrors.unit && (
                          <p className="mt-1 text-sm text-red-600">
                            {fieldErrors.unit}
                          </p>
                        )}
                      </div>
                      <div>
                        <label
                          htmlFor="theme"
                          className="block text-sm font-medium text-foreground"
                        >
                          Tema o categoría (opcional)
                        </label>
                        <input
                          id="theme"
                          type="text"
                          value={theme}
                          onChange={(e) => setTheme(e.target.value)}
                          className="input-form mt-1 block w-full min-h-[44px] rounded-xl border border-border px-3 py-2.5 text-base text-foreground placeholder:text-muted transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 focus-visible:border-accent focus-visible:ring-accent/20"
                          placeholder="Ej. Mobiliario, Promociones"
                        />
                      </div>
                      <div>
                        <label
                          id="subcatalog-label"
                          htmlFor="subcatalog"
                          className="block text-sm font-medium text-foreground"
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
                    </div>
                  </section>

                  {/* ── Configuración ── */}
                  <section>
                    <div className="mb-4 border-b border-border pb-2">
                      <h3 className="text-sm font-semibold text-foreground">
                        Configuración
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Stock y visibilidad del producto.
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="flex min-h-[44px] cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={trackStock}
                          onChange={(e) => setTrackStock(e.target.checked)}
                          className="h-4 w-4 rounded border-border focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                        />
                        <span className="text-sm text-foreground">
                          Controlar stock
                        </span>
                      </label>
                      <label className="flex min-h-[44px] cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isPublic}
                          onChange={(e) => setIsPublic(e.target.checked)}
                          className="h-4 w-4 rounded border-border focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                        />
                        <span className="text-sm text-foreground">
                          Visible en sitio público
                        </span>
                      </label>
                    </div>
                  </section>
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

          <div className="border-t border-border bg-surface-raised px-4 py-4 sm:px-6 md:px-8">
            <div className="flex flex-col gap-3 md:flex-row md:flex-1">
              <Link
                href={`/dashboard/${tenantSlug}/productos`}
                className={`${btnSecondaryFlex} w-full min-h-(--touch-target,44px) md:w-auto justify-center`}
              >
                <X className="h-4 w-4 shrink-0" aria-hidden />
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className={`${btnPrimaryFlex} w-full min-h-(--touch-target,44px) md:w-auto justify-center`}
              >
                <Plus className="h-4 w-4 shrink-0" aria-hidden />
                {loading ? "Creando…" : "Crear producto"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
