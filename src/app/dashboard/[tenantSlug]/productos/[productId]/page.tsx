"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTenantStore } from "@/stores/useTenantStore";
import { MultiImageUpload } from "@/components/MultiImageUpload";
import { productFormSchema } from "@/lib/productValidation";
import type { ProductDetail } from "@/types/products";
import { getById, update } from "@/services/productsService";

export default function EditarProductoPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useTenantStore((s) => s.activeTenant)();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [commissionAmount, setCommissionAmount] = useState("");
  const [sku, setSku] = useState("");
  const [unit, setUnit] = useState("unit");
  const [theme, setTheme] = useState("");
  const [trackStock, setTrackStock] = useState(true);
  const [isPublic, setIsPublic] = useState(true);
  const [stock, setStock] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    getById(productId)
      .then((data) => {
        setProduct(data);
        setName(data.name ?? "");
        setSlug(data.slug ?? "");
        setDescription(data.description ?? "");
        setPrice(String(data.price ?? ""));
        setCostPrice(String(data.cost_price ?? ""));
        setCommissionAmount(String(data.commission_amount ?? ""));
        setSku(data.sku ?? "");
        setUnit(data.unit ?? "unit");
        setTheme((data as { theme?: string }).theme ?? "");
        setTrackStock(data.track_stock ?? true);
        setIsPublic(data.is_public ?? true);
        setStock(String(data.stock ?? 0));
        setImageUrls(
          data.image_urls ?? (data.image_url ? [data.image_url] : [])
        );
      })
      .catch(() => setFetchError("No se pudo cargar el producto"))
      .finally(() => setLoading(false));
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
        { abortEarly: false }
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
        track_stock: trackStock,
        is_public: isPublic,
        image_urls: imageUrls.length > 0 ? imageUrls : undefined,
        stock: stockNum,
      });
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
      <div className="text-sm text-zinc-600">
        {fetchError}{" "}
        <Link
          href={`/dashboard/${tenantSlug}/productos`}
          className="text-zinc-900 underline"
        >
          Volver a productos
        </Link>
      </div>
    );
  }

  if (!product) {
    return <p className="text-sm text-zinc-500">Cargando...</p>;
  }

  return (
    <div className="mx-auto flex max-w-4xl min-h-[calc(100vh-10rem)] flex-col gap-4">
      <div className="shrink-0 border-b border-zinc-200 pb-4">
        <Link
          href={`/dashboard/${tenantSlug}/productos`}
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          ← Volver a productos
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-zinc-900 sm:text-2xl">
          Editar producto
        </h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Modifica los datos del producto
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            {error && (
              <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
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
                        className="block text-sm font-medium text-zinc-700"
                      >
                        Nombre *
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={handleNameChange}
                        className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
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
                        className="block text-sm font-medium text-zinc-700"
                      >
                        Slug (URL) *
                      </label>
                      <input
                        id="slug"
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                        placeholder="mesa-14x10"
                      />
                      <p className="mt-1 text-xs text-zinc-500">
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
                      className="block text-sm font-medium text-zinc-700"
                    >
                      Precio de venta *
                    </label>
                    <input
                      id="price"
                      type="text"
                      inputMode="decimal"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
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
                      className="block text-sm font-medium text-zinc-700"
                    >
                      Costo del producto *
                    </label>
                    <input
                      id="cost_price"
                      type="text"
                      inputMode="decimal"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                      placeholder="0.00"
                    />
                    <p className="mt-1 text-xs text-zinc-500">
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
                      className="block text-sm font-medium text-zinc-700"
                    >
                      SKU (opcional)
                    </label>
                    <input
                      id="sku"
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                      placeholder="Ej. MESA-001"
                    />
                    <p className="mt-1 text-xs text-zinc-500">
                      Código único en inventario.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="unit"
                      className="block text-sm font-medium text-zinc-700"
                    >
                      Unidad *
                    </label>
                    <input
                      id="unit"
                      type="text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                      placeholder="unit, kg, pza, hora..."
                    />
                    <p className="mt-1 text-xs text-zinc-500">
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
                      className="block text-sm font-medium text-zinc-700"
                    >
                      Tema o categoría (opcional)
                    </label>
                    <input
                      id="theme"
                      type="text"
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                      placeholder="Ej. Mobiliario, Promociones"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="commission_amount"
                      className="block text-sm font-medium text-zinc-700"
                    >
                      Comisión por unidad (opcional)
                    </label>
                    <input
                      id="commission_amount"
                      type="text"
                      inputMode="decimal"
                      value={commissionAmount}
                      onChange={(e) => setCommissionAmount(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                      placeholder="0.00"
                    />
                    <p className="mt-1 text-xs text-zinc-500">
                      Comisión que se pagará por cada unidad vendida
                    </p>
                    {fieldErrors.commission_amount && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldErrors.commission_amount}
                      </p>
                    )}
                  </div>

                  {product.type === "product" && (
                    <div className="md:col-span-2">
                      <label
                        htmlFor="stock"
                        className="block text-sm font-medium text-zinc-700"
                      >
                        Stock
                      </label>
                      <input
                        id="stock"
                        type="number"
                        min={0}
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        className="mt-1 max-w-32 rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap gap-6 md:col-span-2">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={trackStock}
                        onChange={(e) => setTrackStock(e.target.checked)}
                        className="h-4 w-4 rounded border-zinc-300"
                      />
                      <span className="text-sm text-zinc-700">
                        Controlar stock
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        className="h-4 w-4 rounded border-zinc-300"
                      />
                      <span className="text-sm text-zinc-700">
                        Visible en sitio público
                      </span>
                    </label>
                  </div>

                  <div className="md:col-span-2">
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
                      rows={2}
                      className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                      placeholder="Descripción del producto"
                    />
                  </div>
                </div>
              </div>
              {activeTenant && (
                <div className="shrink-0 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 md:w-72">
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

          <div className="shrink-0 border-t border-zinc-200 bg-white px-6 py-4 md:px-8">
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {loading ? "Guardando..." : "Guardar"}
              </button>
              <Link
                href={`/dashboard/${tenantSlug}/productos`}
                className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
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
