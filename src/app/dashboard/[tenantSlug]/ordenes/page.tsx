"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTenantStore } from "@/stores/useTenantStore";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { formatOrderDate } from "@/lib/formatDate";
import type { OrderListItem } from "@/types/orders";
import { list as listOrders } from "@/services/ordersService";

function orderContentType(o: OrderListItem): "productos" | "servicios" | "mixto" {
  const p = o.products_count ?? 0;
  const s = o.services_count ?? 0;
  if (p > 0 && s > 0) return "mixto";
  if (s > 0) return "servicios";
  return "productos";
}

export default function OrdenesPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useTenantStore((s) => s.activeTenant)();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState(
    () => searchParams.get("status") ?? ""
  );
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    if (!activeTenant) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    listOrders({
      tenant_id: activeTenant.id,
      status: statusFilter || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl">
          Órdenes / Tickets
        </h1>
        <Link
          href={`/dashboard/${tenantSlug}/ordenes/nueva`}
          className="min-h-[44px] inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 active:bg-zinc-700 sm:min-h-0"
        >
          Nueva orden
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
        <label className="flex flex-1 min-w-[120px] items-center gap-1.5 text-sm text-zinc-700 sm:flex-none">
          Estado:
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-h-[44px] flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:ring-2 focus:ring-zinc-500 sm:min-h-0 sm:flex-none sm:py-1.5"
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
        <label className="flex flex-1 min-w-[120px] items-center gap-1.5 text-sm text-zinc-700 sm:flex-none">
          Desde:
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="min-h-[44px] flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 sm:min-h-0 sm:py-1.5"
          />
        </label>
        <label className="flex flex-1 min-w-[120px] items-center gap-1.5 text-sm text-zinc-700 sm:flex-none">
          Hasta:
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="min-h-[44px] flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 sm:min-h-0 sm:py-1.5"
          />
        </label>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-zinc-500">Cargando órdenes...</p>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-zinc-500">
            No hay órdenes. Crea una con &quot;Nueva orden&quot;.
          </p>
          <Link
            href={`/dashboard/${tenantSlug}/ordenes/nueva`}
            className="mt-4 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Crear primera orden
          </Link>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Contenido
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Asignado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white">
                  {orders.map((o) => {
                    const tipo = orderContentType(o);
                    return (
                      <tr
                        key={o.id}
                        className="cursor-pointer hover:bg-zinc-50/50"
                        onClick={() =>
                          router.push(
                            `/dashboard/${tenantSlug}/ordenes/${o.id}`
                          )
                        }
                      >
                        <td className="px-4 py-3 text-sm text-zinc-900">
                          {o.customer_name || o.customer_email || "—"}
                        </td>
                        <td className="px-4 py-3">
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
                        <td className="px-4 py-3">
                          {o.assigned_user ? (
                            <span className="text-sm text-zinc-700">
                              {o.assigned_user.display_name ||
                                o.assigned_user.email?.split("@")[0]}
                            </span>
                          ) : (
                            <span className="text-sm text-zinc-400 italic">
                              Sin asignar
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={o.status} />
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-zinc-900">
                          ${Number(o.total).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-500">
                          {formatOrderDate(o.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-2 md:hidden">
            {orders.map((o) => {
              const tipo = orderContentType(o);
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() =>
                    router.push(`/dashboard/${tenantSlug}/ordenes/${o.id}`)
                  }
                  className="w-full rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-sm active:bg-zinc-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-zinc-900">
                        {o.customer_name || o.customer_email || "—"}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {formatOrderDate(o.created_at)}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
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
                        <StatusBadge status={o.status} />
                        {o.assigned_user && (
                          <span className="text-xs text-zinc-500">
                            →{" "}
                            {o.assigned_user.display_name ||
                              o.assigned_user.email?.split("@")[0]}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-zinc-900">
                      ${Number(o.total).toFixed(2)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
