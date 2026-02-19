"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, X } from "lucide-react";
import { create as createTenant, list as listTenants } from "@/services/tenantsService";
import { useTenantStore, type MembershipItem } from "@/stores/useTenantStore";

export default function CrearNegocioPage() {
  const router = useRouter();
  const setMemberships = useTenantStore((s) => s.setMemberships);
  const setActiveTenantId = useTenantStore((s) => s.setActiveTenantId);
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
      const tenant = (await createTenant({
        name: name.trim(),
        slug: slug.trim() || deriveSlug(name),
        business_type: businessType.trim() || undefined,
      })) as { id: string };
      const list = (await listTenants()) as MembershipItem[];
      setMemberships(list);
      setActiveTenantId(tenant.id);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("pars_activeTenantId", tenant.id);
        } catch {
          /* incognito, quota, disabled */
        }
      }
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear el negocio");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-0 max-w-5xl flex-1 flex-col overflow-hidden">
      <div className="shrink-0 pb-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-lg"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Volver al inicio
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">
          Crear negocio
        </h1>
        <p className="mt-0.5 text-sm text-muted">
          Registra tu negocio para empezar a usar el dashboard.
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
                  className="input-form mt-1 block w-full min-h-[44px] rounded-xl border border-border px-3 py-2.5 text-base text-foreground placeholder:text-muted transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 focus-visible:border-accent focus-visible:ring-accent/20"
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
                  className="input-form mt-1 block w-full min-h-[44px] rounded-xl border border-border px-3 py-2.5 text-base text-foreground placeholder:text-muted transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 focus-visible:border-accent focus-visible:ring-accent/20"
                  placeholder="lavado-express"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Solo letras minúsculas, números y guiones. Se usará en la URL
                  del sitio.
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
                  className="input-form select-custom mt-1 block w-full min-h-[44px] rounded-xl border border-border px-3 py-2.5 text-sm text-foreground transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 focus-visible:border-accent focus-visible:ring-accent/20"
                >
                  <option value="">Seleccionar</option>
                  <option value="ecommerce">Ecommerce</option>
                  <option value="lavado_autos">Lavado de autos</option>
                  <option value="renta_mesas">Renta mesas / carpas</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            </div>
          </div>
          <div className="shrink-0 border-t border-border bg-surface-raised px-4 py-4 sm:px-6 md:px-8">
            <div className="flex gap-3">
              <Link
                href="/dashboard"
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
                {loading ? "Creando…" : "Crear negocio"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
