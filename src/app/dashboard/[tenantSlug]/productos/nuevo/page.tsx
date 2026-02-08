"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTenantStore } from "@/stores/useTenantStore";
import { ImageUpload } from "@/components/ImageUpload";

export default function NuevoProductoPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useTenantStore((s) => s.activeTenant)();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [sku, setSku] = useState("");
  const [unit, setUnit] = useState("unit");
  const [trackStock, setTrackStock] = useState(true);
  const [isPublic, setIsPublic] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    if (!activeTenant) {
      setError("No hay negocio seleccionado");
      return;
    }
    const priceNum = parseFloat(price.replace(",", "."));
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setError("Precio no válido");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenant_id: activeTenant.id,
        name: name.trim(),
        slug: slug.trim() || deriveSlug(name),
        description: description.trim() || undefined,
        price: priceNum,
        sku: sku.trim() || undefined,
        unit: unit.trim() || "unit",
        track_stock: trackStock,
        is_public: isPublic,
        image_url: imageUrl.trim() || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Error al crear el producto");
      return;
    }
    router.push(`/dashboard/${tenantSlug}/productos`);
    router.refresh();
  }

  if (!activeTenant) {
    return (
      <div className="text-sm text-zinc-600">
        Selecciona un negocio para continuar.
      </div>
    );
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
      <h1 className="text-2xl font-semibold text-zinc-900">Nuevo producto</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Agrega un producto al catálogo de {activeTenant.name}.
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
          <p className="mt-1 text-xs text-zinc-500">
            Minúsculas, números y guiones. Único por negocio.
          </p>
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
        <ImageUpload
          tenantId={activeTenant.id}
          currentUrl={imageUrl || null}
          onUploaded={setImageUrl}
        />
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear producto"}
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
