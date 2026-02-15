"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { useTenantStore } from "@/stores/useTenantStore";
import { MultiImageUpload } from "@/components/MultiImageUpload";
import { productFormSchema } from "@/lib/productValidation";
import type { ProductDetail } from "@/types/products";
import { update } from "@/services/productsService";
import { swrFetcher } from "@/lib/swrFetcher";
import type { Subcatalog } from "@/types/subcatalogs";
import { SubcatalogSelect } from "@/components/forms/SubcatalogSelect";

const productKey = (id: string) =>
  `/api/products?product_id=${encodeURIComponent(id)}`;
const subcatalogsKey = (tenantId: string) =>
  `/api/subcatalogs?tenant_id=${encodeURIComponent(tenantId)}`;

export default function EditarProductoPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useTenantStore((s) => s.activeTenant)();

  const productKeyValue = productId ? productKey(productId) : null;
  const subcatalogsKeyValue = activeTenant
    ? subcatalogsKey(activeTenant.id)
    : null;

  const { data: productData, error: productError, isLoading, mutate } = useSWR<
    ProductDetail | null
  >(productKeyValue, swrFetcher);

  const { data: subcatalogsData } = useSWR<Subcatalog[]>(
    subcatalogsKeyValue,
    swrFetcher,
    { fallbackData: [] },
  );

  const product = productData ?? null;
  const subcatalogs = Array.isArray(subcatalogsData) ? subcatalogsData : [];
  const fetchError = productError ? "No se pudo cargar el producto" : null;

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
  const [isPublic, setIsPublic] = useState(true);
  const [stock, setStock] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const syncedProductIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!product || syncedProductIdRef.current === product.id) return;
    syncedProductIdRef.current = product.id;
    setName(product.name ?? "");
    setSlug(product.slug ?? "");
    setDescription(product.description ?? "");
    setPrice(String(product.price ?? ""));
    setCostPrice(String(product.cost_price ?? ""));
    setCommissionAmount(String(product.commission_amount ?? ""));
    setSku(product.sku ?? "");
    setUnit(product.unit ?? "unit");
    setTheme((product as { theme?: string }).theme ?? "");
    setSubcatalogId(
      (product as { subcatalog_id?: string | null }).subcatalog_id ?? "",
    );
    const pd = product as {
      wholesale_min_quantity?: number | null;
      wholesale_price?: number | null;
    };
    setWholesaleMinQuantity(
      pd.wholesale_min_quantity != null ? String(pd.wholesale_min_quantity) : "",
    );
    setWholesalePrice(
      pd.wholesale_price != null ? String(pd.wholesale_price) : "",
    );
    setTrackStock(product.track_stock ?? true);
    setIsPublic(product.is_public ?? true);
    setStock(String(product.stock ?? 0));
    setImageUrls(
      product.image_urls ?? (product.image_url ? [product.image_url] : []),
    );
  }, [product]);

  useEffect(() => {
    if (productId && syncedProductIdRef.current !== productId) {
      syncedProductIdRef.current = null;
    }
  }, [productId]);

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
    const stockNum = stock.trim() === "" ? undefined : parseInt(stock, 10);
    if (stockNum !== undefined && (Number.isNaN(stockNum) || stockNum < 0)) {
      setError("Stock debe ser un número mayor o igual a 0");
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
      await update(productId, {
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
        is_public: isPublic,
        image_urls: imageUrls.length > 0 ? imageUrls : undefined,
        stock: stockNum,
        wholesale_min_quantity: hasWholesaleMin
          ? (wholesaleMinNum as number)
          : null,
        wholesale_price: hasWholesaleMin ? (wholesalePriceNum as number) : null,
      });
      await mutate();
      router.push(`/dashboard/${tenantSlug}/productos`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  if (fetchError) {
    return (
      <div className="text-sm text-muted-foreground">
        {fetchError}{" "}
        <Link
          href={`/dashboard/${tenantSlug}/productos`}
          className="text-foreground underline"
        >
          Volver a productos
        </Link>
      </div>
    );
  }

  if (isLoading || !product) {
    return <p className="text-sm text-muted-foreground">Cargando...</p>;
  }

  return (
    <div className="mx-auto flex min-h-0 max-w-4xl flex-1 flex-col overflow-hidden gap-4">
      <div className="shrink-0 border-b border-border pb-4">
        <Link
          href={`/dashboard/${tenantSlug}/productos`}
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          ← Volver a productos
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">
          Editar producto
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Modifica los datos del producto
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-surface-raised shadow-sm">
        <form
          onSubmit={handleSubmit}
          className="flex gap-4 min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            {error && (
              <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 alert-error">
                {error}
              </div>
            )}
            <div className="flex flex-col gap-8 md:flex-row md:items-start">
              <div className="min-w-0 flex-1">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                        className="input-form mt-1 block w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
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
                        className="block text-sm font-medium text-muted-foreground"
                      >
                        Slug (URL) *
                      </label>
                      <input
                        id="slug"
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        className="input-form mt-1 block w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
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
                  </div>

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
                      className="input-form mt-1 block w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
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
                      Costo del producto *
                    </label>
                    <input
                      id="cost_price"
                      type="text"
                      inputMode="decimal"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      className="input-form mt-1 block w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      placeholder="0.00"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Cuánto te cuesta este producto (para calcular ganancias)
                    </p>
                    {fieldErrors.cost_price && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldErrors.cost_price}
                      </p>
                    )}
                  </div>
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
                      className="input-form mt-1 block w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      placeholder="Ej. MESA-001"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Código único en inventario.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="unit"
                      className="block text-sm font-medium text-muted-foreground"
                    >
                      Unidad *
                    </label>
                    <input
                      id="unit"
                      type="text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="input-form mt-1 block w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
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
                      className="block text-sm font-medium text-muted-foreground"
                    >
                      Tema o categoría (opcional)
                    </label>
                    <input
                      id="theme"
                      type="text"
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      className="input-form mt-1 block w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      placeholder="Ej. Mobiliario, Promociones"
                    />
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
                      className="input-form mt-1 block w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
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

                  <details className="md:col-span-2 rounded-lg border border-border overflow-hidden">
                    <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground bg-border-soft/30">
                      Mayoreo (opcional)
                    </summary>
                    <div className="px-4 py-4 grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                        <label
                          htmlFor="wholesale_min"
                          className="block text-sm font-medium text-muted-foreground"
                        >
                          Cantidad mínima para mayoreo
                        </label>
                        <input
                          id="wholesale_min"
                          type="number"
                          min={1}
                          value={wholesaleMinQuantity}
                          onChange={(e) =>
                            setWholesaleMinQuantity(e.target.value)
                          }
                          className="input-form mt-1 block w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                          placeholder="Ej. 10"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          Si uno tiene valor, el otro es requerido
                        </p>
                      </div>
                      <div>
                        <label
                          htmlFor="wholesale_price"
                          className="block text-sm font-medium text-muted-foreground"
                        >
                          Precio mayoreo por unidad
                        </label>
                        <input
                          id="wholesale_price"
                          type="text"
                          inputMode="decimal"
                          value={wholesalePrice}
                          onChange={(e) => setWholesalePrice(e.target.value)}
                          className="input-form mt-1 block w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    {fieldErrors.wholesale && (
                      <p className="px-4 pb-4 text-sm text-red-600">
                        {fieldErrors.wholesale}
                      </p>
                    )}
                  </details>

                  {product.type === "product" && (
                    <div className="md:col-span-2">
                      <label
                        htmlFor="stock"
                        className="block text-sm font-medium text-muted-foreground"
                      >
                        Stock
                      </label>
                      <input
                        id="stock"
                        type="number"
                        min={0}
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        className="input-form mt-1 w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-base text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap gap-6 md:col-span-2">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={trackStock}
                        onChange={(e) => setTrackStock(e.target.checked)}
                        className="h-4 w-4 rounded border-border"
                      />
                      <span className="text-sm text-muted-foreground">
                        Controlar stock
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        className="h-4 w-4 rounded border-border"
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
                      className="input-form mt-1 block w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      placeholder="Descripción del producto"
                    />
                  </div>
                </div>
              </div>
              {activeTenant && (
                <div className="shrink-0 rounded-lg border border-border bg-border-soft/50 p-4 md:w-72">
                  <MultiImageUpload
                    tenantId={activeTenant.id}
                    productId={productId}
                    urls={imageUrls}
                    onChange={setImageUrls}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 border-t border-border bg-surface-raised px-6 py-4 md:px-8">
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Guardando..." : "Guardar"}
              </button>
              <Link
                href={`/dashboard/${tenantSlug}/productos`}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-border-soft"
              >
                Cancelar
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
