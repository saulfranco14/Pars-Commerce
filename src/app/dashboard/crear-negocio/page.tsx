"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { create as createTenant } from "@/services/tenantsService";

export default function CrearNegocioPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [businessType, setBusinessType] = useState("");
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
    setLoading(true);
    try {
      await createTenant({
        name: name.trim(),
        slug: slug.trim() || deriveSlug(name),
        business_type: businessType.trim() || undefined,
      });
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear el negocio");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold text-foreground">Crear negocio</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Registra tu negocio para empezar a usar el dashboard.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 alert-error">
            {error}
          </div>
        )}
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
            className="input-form mt-1 block w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="Ej. Lavado Express"
          />
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
            onChange={(e) => setSlug(e.target.value)}
            className="input-form mt-1 block w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="lavado-express"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Solo letras minúsculas, números y guiones. Se usará en la URL del
            sitio.
          </p>
        </div>
        <div>
          <label
            htmlFor="businessType"
            className="block text-sm font-medium text-muted-foreground"
          >
            Tipo de negocio (opcional)
          </label>
          <select
            id="businessType"
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            className="input-form select-custom mt-1 block w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            <option value="">Seleccionar</option>
            <option value="ecommerce">Ecommerce</option>
            <option value="lavado_autos">Lavado de autos</option>
            <option value="renta_mesas">Renta mesas / carpas</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear negocio"}
          </button>
          <Link
            href="/dashboard"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-border-soft/60"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
