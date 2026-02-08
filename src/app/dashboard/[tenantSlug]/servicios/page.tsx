"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTenantStore } from "@/stores/useTenantStore";

interface ServiceRow {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  price: number;
  type: string;
  image_url: string | null;
  stock: number;
  created_at: string;
}

export default function ServiciosPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useTenantStore((s) => s.activeTenant)();
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeTenant) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(
      `/api/products?tenant_id=${encodeURIComponent(
        activeTenant.id
      )}&type=service`
    )
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar servicios");
        return res.json();
      })
      .then(setServices)
      .catch(() => setError("No se pudieron cargar los servicios"))
      .finally(() => setLoading(false));
  }, [activeTenant?.id]);

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este servicio?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(
        `/api/products?product_id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error al eliminar");
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al eliminar");
    } finally {
      setDeletingId(null);
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
    <div className="space-y-4">
      <div className="flex items-center justify-between border-l-4 border-teal-500 pl-3">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Servicios
          <span className="ml-2 rounded bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-800">
            Catálogo de servicios
          </span>
        </h1>
        <Link
          href={`/dashboard/${tenantSlug}/servicios/nuevo`}
          className="rounded-md bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          Nuevo servicio
        </Link>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-zinc-500">Cargando servicios...</p>
      ) : services.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No hay servicios. Crea uno con &quot;Nuevo servicio&quot;.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-teal-200 bg-white">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-teal-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-zinc-600">
                  Imagen
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-zinc-600">
                  Nombre
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-zinc-600">
                  SKU
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-zinc-600">
                  Precio
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-zinc-600">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {services.map((s) => (
                <tr key={s.id} className="bg-white">
                  <td className="px-4 py-2">
                    {s.image_url ? (
                      <img
                        src={s.image_url}
                        alt=""
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span className="rounded bg-teal-100 px-1.5 py-0.5 text-xs font-medium text-teal-800">
                      Servicio
                    </span>
                    <span className="ml-2 text-sm font-medium text-zinc-900">
                      {s.name}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-zinc-600">
                    {s.sku ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-right text-sm text-zinc-900">
                    ${Number(s.price).toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/dashboard/${tenantSlug}/servicios/${s.id}`}
                      className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
                    >
                      Editar
                    </Link>
                    {" · "}
                    <button
                      type="button"
                      onClick={() => handleDelete(s.id)}
                      disabled={deletingId === s.id}
                      className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      {deletingId === s.id ? "..." : "Eliminar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
