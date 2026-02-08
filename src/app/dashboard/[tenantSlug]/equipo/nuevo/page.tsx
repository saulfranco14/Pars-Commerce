"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTenantStore } from "@/stores/useTenantStore";

interface RoleOption {
  id: string;
  name: string;
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  owner:
    "Acceso total al negocio: ventas, productos, inventario, equipo y configuración.",
  member:
    "Puede gestionar ventas, órdenes y catálogo; no puede gestionar equipo ni configuración.",
};

export default function NuevoMiembroPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useTenantStore((s) => s.activeTenant)();

  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeTenant?.id) return;
    fetch(`/api/tenant-roles?tenant_id=${encodeURIComponent(activeTenant.id)}`)
      .then((res) => res.json())
      .then((list: RoleOption[]) => {
        setRoles(list ?? []);
        if (list?.length && !roleId) setRoleId(list[0].id);
      })
      .catch(() => setRoles([]));
  }, [activeTenant?.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!activeTenant) return;
    if (!email.trim()) {
      setError("El email es requerido");
      return;
    }
    if (!roleId) {
      setError("Selecciona un rol");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: activeTenant.id,
          role_id: roleId,
          email: email.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error al agregar");
      router.push(`/dashboard/${tenantSlug}/equipo`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al agregar");
    } finally {
      setLoading(false);
    }
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
          href={`/dashboard/${tenantSlug}/equipo`}
          className="text-sm text-zinc-600 hover:text-zinc-900"
        >
          ← Volver a equipo
        </Link>
      </div>
      <h1 className="text-2xl font-semibold text-zinc-900">Agregar miembro</h1>
      <p className="mt-1 text-sm text-zinc-500">
        El usuario debe tener una cuenta con ese email en la plataforma.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            <p>{error}</p>
            {error.includes("registrarse") && (
              <Link
                href="/registro"
                className="mt-2 inline-block text-sm font-medium text-red-800 underline hover:no-underline"
              >
                Ir a registro
              </Link>
            )}
          </div>
        )}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-zinc-700"
          >
            Email del usuario
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
            placeholder="usuario@ejemplo.com"
          />
        </div>
        <div>
          <label
            htmlFor="role"
            className="block text-sm font-medium text-zinc-700"
          >
            Rol
          </label>
          <select
            id="role"
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          {roleId && (
            <p className="mt-1 text-xs text-zinc-500">
              {ROLE_DESCRIPTIONS[
                roles.find((r) => r.id === roleId)?.name ?? ""
              ] ?? ""}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? "Agregando..." : "Agregar"}
          </button>
          <Link
            href={`/dashboard/${tenantSlug}/equipo`}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
