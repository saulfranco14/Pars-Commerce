"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTenantStore } from "@/stores/useTenantStore";
import { StatusBadge } from "@/components/orders/StatusBadge";

interface OrderRow {
  id: string;
  status: string;
  customer_name: string | null;
  customer_email: string | null;
  total: number;
  created_at: string;
  assigned_to: string | null;
  products_count?: number;
  services_count?: number;
}

function orderContentType(o: OrderRow): "productos" | "servicios" | "mixto" {
  const p = o.products_count ?? 0;
  const s = o.services_count ?? 0;
  if (p > 0 && s > 0) return "mixto";
  if (s > 0) return "servicios";
  return "productos";
}

export default function OrdenesPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useTenantStore((s) => s.activeTenant)();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    if (!activeTenant) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ tenant_id: activeTenant.id });
    if (statusFilter) params.set("status", statusFilter);
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    fetch(`/api/orders?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar órdenes");
        return res.json();
      })
      .then(setOrders)
      .catch(() => setError("No se pudieron cargar las órdenes"))
      .finally(() => setLoading(false));
  }, [activeTenant?.id, statusFilter, dateFrom, dateTo]);

  if (!activeTenant) {
    return (
      <div className="text-sm text-zinc-600">
        Selecciona un negocio para continuar.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Órdenes / Tickets
        </h1>
        <Link
          href={`/dashboard/${tenantSlug}/ordenes/nueva`}
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Nueva orden
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
        <label className="flex items-center gap-1.5 text-sm text-zinc-700">
          Estado:
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900"
          >
            <option value="">Todos</option>
            <option value="draft">Borrador</option>
            <option value="assigned">Asignada</option>
            <option value="in_progress">En progreso</option>
            <option value="completed">Completada</option>
            <option value="pending_payment">Pago pendiente</option>
            <option value="paid">Pagada</option>
            <option value="cancelled">Cancelada</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-sm text-zinc-700">
          Desde:
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900"
          />
        </label>
        <label className="flex items-center gap-1.5 text-sm text-zinc-700">
          Hasta:
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900"
          />
        </label>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-zinc-500">Cargando órdenes...</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No hay órdenes. Crea una con &quot;Nueva orden&quot;.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-zinc-600">
                  Cliente
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-zinc-600">
                  Contenido
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-zinc-600">
                  Estado
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-zinc-600">
                  Total
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-zinc-600">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {orders.map((o) => {
                const tipo = orderContentType(o);
                return (
                  <tr
                    key={o.id}
                    className="cursor-pointer bg-white hover:bg-zinc-50"
                    onClick={() =>
                      router.push(`/dashboard/${tenantSlug}/ordenes/${o.id}`)
                    }
                  >
                    <td className="px-4 py-2 text-sm text-zinc-900">
                      {o.customer_name || o.customer_email || "—"}
                    </td>
                    <td className="px-4 py-2">
                      {tipo === "productos" && (
                        <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-xs font-medium text-zinc-700">
                          Productos
                        </span>
                      )}
                      {tipo === "servicios" && (
                        <span className="rounded bg-teal-100 px-1.5 py-0.5 text-xs font-medium text-teal-800">
                          Servicios
                        </span>
                      )}
                      {tipo === "mixto" && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">
                          Mixto
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-2 text-right text-sm text-zinc-900">
                      ${Number(o.total).toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-sm text-zinc-500">
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
