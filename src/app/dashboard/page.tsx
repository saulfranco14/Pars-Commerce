"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTenantStore } from "@/stores/useTenantStore";
import { StatusBadge } from "@/components/orders/StatusBadge";

interface OrderRow {
  id: string;
  status: string;
  customer_name: string | null;
  total: number;
  created_at: string;
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

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  assigned: "Asignada",
  in_progress: "En progreso",
  completed: "Completada",
  pending_payment: "Pago pendiente",
  paid: "Pagada",
  cancelled: "Cancelada",
};

export default function DashboardPage() {
  const activeTenant = useTenantStore((s) => s.activeTenant)();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [period, setPeriod] = useState<"all" | "week" | "today">("week");

  useEffect(() => {
    if (!activeTenant?.id) return;
    setSalesLoading(true);
    const params = new URLSearchParams({ tenant_id: activeTenant.id });
    if (period === "today") {
      const today = new Date().toISOString().slice(0, 10);
      params.set("date_from", today);
      params.set("date_to", today);
    } else if (period === "week") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      params.set("date_from", d.toISOString().slice(0, 10));
    }
    fetch(`/api/orders?${params}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: OrderRow[]) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]))
      .finally(() => setSalesLoading(false));
  }, [activeTenant?.id, period]);

  if (!activeTenant) {
    return null;
  }

  const recent = orders.slice(0, 10);
  const byStatus = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});
  const totalSold = orders
    .filter((o) => o.status === "paid" || o.status === "completed")
    .reduce((sum, o) => sum + Number(o.total), 0);

  const ordersWithProducts = orders.filter(
    (o) => (o.products_count ?? 0) > 0
  ).length;
  const ordersWithServices = orders.filter(
    (o) => (o.services_count ?? 0) > 0
  ).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900">
        {activeTenant.name}
      </h1>

      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-medium text-zinc-900">Ventas</h2>
          <div className="flex gap-2">
            <select
              value={period}
              onChange={(e) =>
                setPeriod(e.target.value as "all" | "week" | "today")
              }
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900"
            >
              <option value="today">Hoy</option>
              <option value="week">Últimos 7 días</option>
              <option value="all">Todas</option>
            </select>
            <Link
              href={`/dashboard/${activeTenant.slug}/ordenes`}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Ver todas
            </Link>
          </div>
        </div>
        {salesLoading ? (
          <p className="mt-2 text-sm text-zinc-500">Cargando ventas...</p>
        ) : (
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex flex-wrap gap-3">
              {Object.entries(byStatus).map(([s, count]) => (
                <span key={s} className="text-zinc-600">
                  {STATUS_LABELS[s] ?? s}:{" "}
                  <strong className="text-zinc-900">{count}</strong>
                </span>
              ))}
              {Object.keys(byStatus).length === 0 && (
                <span className="text-zinc-500">Sin órdenes en el período</span>
              )}
            </div>
            {(period === "week" || period === "today") && (
              <p className="text-zinc-600">
                Total vendido (pagado/completado):{" "}
                <span className="font-medium text-zinc-900">
                  ${totalSold.toFixed(2)}
                </span>
              </p>
            )}
            {recent.length > 0 && (
              <div className="mt-2 overflow-hidden rounded border border-zinc-100">
                <table className="min-w-full text-xs">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-2 py-1 text-left font-medium text-zinc-600">
                        Cliente
                      </th>
                      <th className="px-2 py-1 text-left font-medium text-zinc-600">
                        Contenido
                      </th>
                      <th className="px-2 py-1 text-left font-medium text-zinc-600">
                        Estado
                      </th>
                      <th className="px-2 py-1 text-right font-medium text-zinc-600">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.slice(0, 5).map((o) => {
                      const tipo = orderContentType(o);
                      return (
                        <tr key={o.id} className="border-t border-zinc-100">
                          <td className="px-2 py-1 text-zinc-900">
                            {o.customer_name || "—"}
                          </td>
                          <td className="px-2 py-1">
                            {tipo === "productos" && (
                              <span className="rounded bg-zinc-200 px-1.5 py-0.5 font-medium text-zinc-700">
                                Productos
                              </span>
                            )}
                            {tipo === "servicios" && (
                              <span className="rounded bg-teal-100 px-1.5 py-0.5 font-medium text-teal-800">
                                Servicios
                              </span>
                            )}
                            {tipo === "mixto" && (
                              <span className="rounded bg-amber-100 px-1.5 py-0.5 font-medium text-amber-800">
                                Mixto
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-1">
                            <StatusBadge status={o.status} />
                          </td>
                          <td className="px-2 py-1 text-right text-zinc-900">
                            ${Number(o.total).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href={`/dashboard/${activeTenant.slug}/productos`}
          className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm hover:border-zinc-300"
        >
          <h2 className="font-medium text-zinc-900">Productos</h2>
          <p className="mt-1 text-sm text-zinc-500">Gestionar catálogo</p>
        </Link>
        <Link
          href={`/dashboard/${activeTenant.slug}/servicios`}
          className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm hover:border-zinc-300"
        >
          <h2 className="font-medium text-zinc-900">Servicios</h2>
          <p className="mt-1 text-sm text-zinc-500">Catálogo de servicios</p>
        </Link>
        <Link
          href={`/dashboard/${activeTenant.slug}/ordenes`}
          className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm hover:border-zinc-300"
        >
          <h2 className="font-medium text-zinc-900">Órdenes / Tickets</h2>
          <p className="mt-1 text-sm text-zinc-500">Ventas y cobros</p>
        </Link>
        <Link
          href={`/dashboard/${activeTenant.slug}/equipo`}
          className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm hover:border-zinc-300"
        >
          <h2 className="font-medium text-zinc-900">Equipo</h2>
          <p className="mt-1 text-sm text-zinc-500">Miembros y roles</p>
        </Link>
        <Link
          href={`/dashboard/${activeTenant.slug}/configuracion`}
          className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm hover:border-zinc-300"
        >
          <h2 className="font-medium text-zinc-900">Configuración</h2>
          <p className="mt-1 text-sm text-zinc-500">Sitio web y negocio</p>
        </Link>
      </div>
    </div>
  );
}
