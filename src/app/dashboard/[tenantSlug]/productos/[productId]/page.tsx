"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTenantStore } from "@/stores/useTenantStore";
import { ImageUpload } from "@/components/ImageUpload";

interface ProductData {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  description: string | null;
  price: number;
  unit: string;
  type: string;
  track_stock: boolean;
  is_public: boolean;
  image_url: string | null;
  stock?: number;
}

export default function EditarProductoPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useTenantStore((s) => s.activeTenant)();

  const [product, setProduct] = useState<ProductData | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [sku, setSku] = useState("");
  const [unit, setUnit] = useState("unit");
  const [trackStock, setTrackStock] = useState(true);
  const [isPublic, setIsPublic] = useState(true);
  const [stock, setStock] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    fetch(`/api/products?product_id=${encodeURIComponent(productId)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Producto no encontrado");
        return res.json();
      })
      .then((data) => {
        setProduct(data);
        setName(data.name ?? "");
        setSlug(data.slug ?? "");
        setDescription(data.description ?? "");
        setPrice(String(data.price ?? ""));
        setSku(data.sku ?? "");
        setUnit(data.unit ?? "unit");
        setTrackStock(data.track_stock ?? true);
        setIsPublic(data.is_public ?? true);
        setStock(String((data as ProductData).stock ?? 0));
        setImageUrl(data.image_url ?? "");
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
    if (!slug || slug === deriveSlug(name)) {
      setSlug(deriveSlug(value));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const priceNum = parseFloat(price.replace(",", "."));
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setError("Precio no válido");
      return;
    }
    const stockNum = stock.trim() === "" ? undefined : parseInt(stock, 10);
    if (stockNum !== undefined && (Number.isNaN(stockNum) || stockNum < 0)) {
      setError("Stock debe ser un número mayor o igual a 0");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: productId,
        name: name.trim(),
        slug: slug.trim() || deriveSlug(name),
        description: description.trim() || undefined,
        price: priceNum,
        sku: sku.trim() || undefined,
        unit: unit.trim() || "unit",
        track_stock: trackStock,
        is_public: isPublic,
        image_url: imageUrl.trim() || undefined,
        stock: stockNum,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Error al guardar");
      return;
    }
    router.push(`/dashboard/${tenantSlug}/productos`);
    router.refresh();
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
    <div className="mx-auto max-w-md">
      <div className="mb-4">
        <Link
          href={`/dashboard/${tenantSlug}/productos`}
          className="text-sm text-zinc-600 hover:text-zinc-900"
        >
          ← Volver a productos
        </Link>
      </div>
      <h1 className="text-2xl font-semibold text-zinc-900">Editar producto</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Modifica los datos del producto.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-zinc-700"
          >
            Nombre
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={handleNameChange}
            required
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
            placeholder="Ej. Lavado básico"
          />
        </div>
        <div>
          <label
            htmlFor="slug"
            className="block text-sm font-medium text-zinc-700"
          >
            Slug (URL)
          </label>
          <input
            id="slug"
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
            placeholder="lavado-basico"
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
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
            placeholder="Descripción del producto"
          />
        </div>
        <div>
          <label
            htmlFor="price"
            className="block text-sm font-medium text-zinc-700"
          >
            Precio
          </label>
          <input
            id="price"
            type="text"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
            placeholder="0.00"
          />
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
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
            placeholder="Ej. LAV-001"
          />
        </div>
        <div>
          <label
            htmlFor="unit"
            className="block text-sm font-medium text-zinc-700"
          >
            Unidad
          </label>
          <input
            id="unit"
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
            placeholder="unit, kg, pza..."
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="trackStock"
            type="checkbox"
            checked={trackStock}
            onChange={(e) => setTrackStock(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300"
          />
          <label htmlFor="trackStock" className="text-sm text-zinc-700">
            Controlar stock
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="isPublic"
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300"
          />
          <label htmlFor="isPublic" className="text-sm text-zinc-700">
            Visible en sitio público
          </label>
        </div>
        {product?.type === "product" && (
          <div>
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
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
              placeholder="0"
            />
          </div>
        )}
        {activeTenant && (
          <ImageUpload
            tenantId={activeTenant.id}
            productId={productId}
            currentUrl={imageUrl || null}
            onUploaded={setImageUrl}
          />
        )}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
          <Link
            href={`/dashboard/${tenantSlug}/productos`}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
