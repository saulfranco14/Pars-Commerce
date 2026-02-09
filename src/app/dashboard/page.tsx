"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTenantStore } from "@/stores/useTenantStore";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { formatOrderDate } from "@/lib/formatDate";
import {
  ClipboardList,
  TrendingUp,
  Clock,
  ArrowRight,
  Trophy,
  ShoppingBag,
  Wrench,
  UserPlus,
} from "lucide-react";

interface OrderRow {
  id: string;
  status: string;
  customer_name: string | null;
  total: number;
  created_at: string;
  assigned_to: string | null;
  assigned_user?: {
    id: string;
    display_name: string | null;
    email: string | null;
  } | null;
  products_count?: number;
  services_count?: number;
}

interface CatalogStats {
  products_count: number;
  services_count: number;
}

interface SalesByItemRow {
  id: string;
  name: string;
  quantity: number;
  total: number;
}

interface SalesByItem {
  products: SalesByItemRow[];
  services: SalesByItemRow[];
}

function getPeriodDates(period: string): { dateFrom: string; dateTo: string } {
  const to = new Date();
  const toStr = to.toISOString().slice(0, 10);
  if (period === "today") return { dateFrom: toStr, dateTo: toStr };
  const from = new Date();
  if (period === "week") from.setDate(from.getDate() - 7);
  else if (period === "fortnight") from.setDate(from.getDate() - 15);
  else from.setDate(from.getDate() - 30);
  return { dateFrom: from.toISOString().slice(0, 10), dateTo: toStr };
}

function orderContentType(o: OrderRow): "productos" | "servicios" | "mixto" {
  const p = o.products_count ?? 0;
  const s = o.services_count ?? 0;
  if (p > 0 && s > 0) return "mixto";
  if (s > 0) return "servicios";
  return "productos";
}

function salesByUser(orders: OrderRow[]) {
  const paidOrCompleted = orders.filter((o) =>
    ["paid", "completed"].includes(o.status)
  );
  const byUserId: Record<
    string,
    { total: number; name: string; count: number }
  > = {};
  for (const o of paidOrCompleted) {
    const uid = o.assigned_to ?? "__sin_asignar__";
    const name = o.assigned_user
      ? o.assigned_user.display_name ||
        o.assigned_user.email?.split("@")[0] ||
        "Usuario"
      : "Sin asignar";
    if (!byUserId[uid]) {
      byUserId[uid] = { total: 0, name, count: 0 };
    }
    byUserId[uid].total += Number(o.total);
    byUserId[uid].count += 1;
  }
  return Object.entries(byUserId)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.total - a.total);
}

export default function DashboardPage() {
  const activeTenant = useTenantStore((s) => s.activeTenant)();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [catalogStats, setCatalogStats] = useState<CatalogStats | null>(null);
  const [salesLoading, setSalesLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [period, setPeriod] = useState<
    "today" | "week" | "fortnight" | "month"
  >("week");
  const [salesByItem, setSalesByItem] = useState<SalesByItem>({
    products: [],
    services: [],
  });
  const [salesByItemLoading, setSalesByItemLoading] = useState(false);

  const { dateFrom, dateTo } = getPeriodDates(period);

  useEffect(() => {
    if (!activeTenant?.id) return;
    setSalesLoading(true);
    const params = new URLSearchParams({
      tenant_id: activeTenant.id,
      date_from: dateFrom,
      date_to: dateTo,
    });
    fetch(`/api/orders?${params}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: OrderRow[]) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]))
      .finally(() => setSalesLoading(false));
  }, [activeTenant?.id, dateFrom, dateTo]);

  useEffect(() => {
    if (!activeTenant?.id) return;
    setSalesByItemLoading(true);
    const params = new URLSearchParams({
      tenant_id: activeTenant.id,
      date_from: dateFrom,
      date_to: dateTo,
    });
    fetch(`/api/dashboard-sales-by-item?${params}`)
      .then((res) => (res.ok ? res.json() : { products: [], services: [] }))
      .then((data: SalesByItem) => setSalesByItem(data))
      .catch(() => setSalesByItem({ products: [], services: [] }))
      .finally(() => setSalesByItemLoading(false));
  }, [activeTenant?.id, dateFrom, dateTo]);

  useEffect(() => {
    if (!activeTenant?.id) return;
    setCatalogLoading(true);
    fetch(
      `/api/dashboard-stats?tenant_id=${encodeURIComponent(activeTenant.id)}`
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data: CatalogStats | null) => setCatalogStats(data))
      .catch(() => setCatalogStats(null))
      .finally(() => setCatalogLoading(false));
  }, [activeTenant?.id]);

  if (!activeTenant) {
    return null;
  }

  const recent = orders.slice(0, 8);
  const byStatus = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  const totalSold = orders
    .filter((o) => o.status === "paid" || o.status === "completed")
    .reduce((sum, o) => sum + Number(o.total), 0);

  const activeOrders = orders.filter((o) =>
    ["assigned", "in_progress"].includes(o.status)
  ).length;

  const unassignedCount = orders.filter(
    (o) => ["draft", "assigned"].includes(o.status) && !o.assigned_to
  ).length;

  const userSales = salesByUser(orders);
  const maxUserTotal =
    userSales.length > 0 ? Math.max(...userSales.map((u) => u.total)) : 0;

  return (
    <div className="space-y-6 pb-8 sm:space-y-8 sm:pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            {activeTenant.name}
          </h1>
          <p className="text-sm text-zinc-500 sm:text-base">
            Resumen de ventas, catálogo y actividad.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <select
            value={period}
            onChange={(e) =>
              setPeriod(
                e.target.value as "today" | "week" | "fortnight" | "month"
              )
            }
            className="min-h-[44px] flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-700 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-1 sm:min-h-0 sm:flex-none"
          >
            <option value="today">Hoy</option>
            <option value="week">Semana</option>
            <option value="fortnight">Quincena</option>
            <option value="month">Mes</option>
          </select>
          <Link
            href={`/dashboard/${activeTenant.slug}/ordenes/nueva`}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 active:bg-zinc-700 sm:min-h-0 sm:flex-none"
          >
            Nueva Orden
          </Link>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Ventas
        </h2>
        <p className="mb-3 text-xs text-zinc-500">
          Período:{" "}
          {period === "today"
            ? "Hoy"
            : period === "week"
            ? "Últimos 7 días"
            : period === "fortnight"
            ? "Últimos 15 días"
            : "Últimos 30 días"}
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href={`/dashboard/${activeTenant.slug}/ordenes`}
            className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50/50 sm:p-6"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-500">
                Ventas Totales
              </p>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <h3 className="mt-2 text-xl font-bold text-zinc-900 sm:text-2xl">
              ${totalSold.toFixed(2)}
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Ver órdenes <ArrowRight className="inline h-3 w-3" />
            </p>
          </Link>
          <Link
            href={`/dashboard/${activeTenant.slug}/ordenes?status=in_progress`}
            className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50/50 sm:p-6"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-500">
                Órdenes Activas
              </p>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <h3 className="mt-2 text-xl font-bold text-zinc-900 sm:text-2xl">
              {activeOrders}
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              {activeOrders === 0 ? "Ver órdenes" : "En progreso · Ver"}{" "}
              <ArrowRight className="inline h-3 w-3" />
            </p>
          </Link>
          <Link
            href={`/dashboard/${activeTenant.slug}/ordenes?status=completed`}
            className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50/50 sm:p-6"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-500">Completadas</p>
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <h3 className="mt-2 text-xl font-bold text-zinc-900 sm:text-2xl">
              {byStatus.completed ?? 0}
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              {(byStatus.completed ?? 0) === 0
                ? "Ver órdenes"
                : "Listas para cobro · Ver"}{" "}
              <ArrowRight className="inline h-3 w-3" />
            </p>
          </Link>
          <Link
            href={`/dashboard/${activeTenant.slug}/ordenes`}
            className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50/50 sm:p-6"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-500">Total Órdenes</p>
              <ClipboardList className="h-4 w-4 text-zinc-400" />
            </div>
            <h3 className="mt-2 text-xl font-bold text-zinc-900 sm:text-2xl">
              {orders.length}
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              En el período · Ver <ArrowRight className="inline h-3 w-3" />
            </p>
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Catálogo
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href={`/dashboard/${activeTenant.slug}/productos`}
            className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50/50 sm:p-6"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-zinc-900">Productos</p>
              <p className="text-2xl font-bold text-zinc-900 sm:text-3xl">
                {catalogLoading ? "—" : catalogStats?.products_count ?? 0}
              </p>
              <p className="text-xs text-zinc-500">
                dados de alta en el catálogo
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-zinc-400" />
          </Link>
          <Link
            href={`/dashboard/${activeTenant.slug}/servicios`}
            className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50/50 sm:p-6"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <Wrench className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-zinc-900">Servicios</p>
              <p className="text-2xl font-bold text-zinc-900 sm:text-3xl">
                {catalogLoading ? "—" : catalogStats?.services_count ?? 0}
              </p>
              <p className="text-xs text-zinc-500">
                dados de alta en el catálogo
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-zinc-400" />
          </Link>
        </div>
      </section>

      {unassignedCount > 0 && (
        <Link
          href={`/dashboard/${activeTenant.slug}/ordenes`}
          className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 transition-colors hover:bg-amber-100/80 sm:p-4"
        >
          <UserPlus className="h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-medium">
              {unassignedCount} orden{unassignedCount !== 1 ? "es" : ""} sin
              asignar
            </p>
            <p className="text-sm text-amber-800">
              Asigna a un miembro del equipo para dar seguimiento.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-amber-600" />
        </Link>
      )}

      {userSales.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            <Trophy className="h-4 w-4 text-amber-500" />
            Ventas por usuario
          </h2>
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/80 text-xs font-medium uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3 sm:px-6">#</th>
                  <th className="px-4 py-3 sm:px-6">Usuario</th>
                  <th className="px-4 py-3 sm:px-6 text-right">Órdenes</th>
                  <th className="px-4 py-3 sm:px-6 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {userSales.slice(0, 8).map((u, i) => (
                  <tr
                    key={u.id}
                    className={
                      i === 0
                        ? "bg-amber-50/50 font-medium"
                        : "bg-white hover:bg-zinc-50/50"
                    }
                  >
                    <td className="px-4 py-3 sm:px-6">
                      <span
                        className={
                          i === 0
                            ? "inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-900"
                            : "text-zinc-500"
                        }
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 sm:px-6 text-zinc-900">
                      {u.name}
                    </td>
                    <td className="px-4 py-3 sm:px-6 text-right text-zinc-600">
                      {u.count}
                    </td>
                    <td className="px-4 py-3 sm:px-6 text-right font-semibold text-zinc-900">
                      ${u.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {maxUserTotal > 0 && userSales.length > 1 && (
              <div className="border-t border-zinc-100 px-4 py-2 text-xs text-zinc-500 sm:px-6">
                El líder del período es{" "}
                <strong className="text-zinc-700">{userSales[0].name}</strong>{" "}
                con {((userSales[0].total / maxUserTotal) * 100).toFixed(0)}%
                del total.
              </div>
            )}
          </div>
        </section>
      )}

      <section className="grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            <ShoppingBag className="h-4 w-4" />
            Lo más vendido: Productos
          </h2>
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            {salesByItemLoading ? (
              <div className="p-6 text-center text-sm text-zinc-500">
                Cargando...
              </div>
            ) : salesByItem.products.length === 0 ? (
              <div className="p-6 text-center text-sm text-zinc-500">
                Sin ventas de productos en el período.
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/80 text-xs font-medium uppercase tracking-wider text-zinc-500">
                    <th className="px-4 py-3 sm:px-6">Producto</th>
                    <th className="px-4 py-3 sm:px-6 text-right">Cant.</th>
                    <th className="px-4 py-3 sm:px-6 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {salesByItem.products.map((row, i) => (
                    <tr
                      key={row.id}
                      className={
                        i === 0 ? "bg-zinc-50/50" : "hover:bg-zinc-50/30"
                      }
                    >
                      <td className="px-4 py-3 font-medium text-zinc-900 sm:px-6">
                        {row.name}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-600 sm:px-6">
                        {row.quantity}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-zinc-900 sm:px-6">
                        ${row.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            <Wrench className="h-4 w-4" />
            Lo más vendido: Servicios
          </h2>
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            {salesByItemLoading ? (
              <div className="p-6 text-center text-sm text-zinc-500">
                Cargando...
              </div>
            ) : salesByItem.services.length === 0 ? (
              <div className="p-6 text-center text-sm text-zinc-500">
                Sin ventas de servicios en el período.
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/80 text-xs font-medium uppercase tracking-wider text-zinc-500">
                    <th className="px-4 py-3 sm:px-6">Servicio</th>
                    <th className="px-4 py-3 sm:px-6 text-right">Cant.</th>
                    <th className="px-4 py-3 sm:px-6 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {salesByItem.services.map((row, i) => (
                    <tr
                      key={row.id}
                      className={
                        i === 0 ? "bg-teal-50/30" : "hover:bg-zinc-50/30"
                      }
                    >
                      <td className="px-4 py-3 font-medium text-zinc-900 sm:px-6">
                        {row.name}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-600 sm:px-6">
                        {row.quantity}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-zinc-900 sm:px-6">
                        ${row.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Actividad reciente
          </h2>
          <Link
            href={`/dashboard/${activeTenant.slug}/ordenes`}
            className="inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-900 sm:min-h-0"
          >
            Ver todas <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          {salesLoading ? (
            <div className="p-8 text-center text-sm text-zinc-500">
              Cargando actividad...
            </div>
          ) : recent.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500">
              No hay actividad reciente.
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-zinc-50/80 text-xs font-medium uppercase tracking-wider text-zinc-500">
                      <th className="px-4 py-3 sm:px-6">Fecha</th>
                      <th className="px-4 py-3 sm:px-6">Cliente</th>
                      <th className="px-4 py-3 sm:px-6">Contenido</th>
                      <th className="px-4 py-3 sm:px-6">Asignado</th>
                      <th className="px-4 py-3 sm:px-6">Estado</th>
                      <th className="px-4 py-3 sm:px-6 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {recent.map((o) => {
                      const tipo = orderContentType(o);
                      return (
                        <tr
                          key={o.id}
                          className="group transition-colors hover:bg-zinc-50/50"
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600 sm:px-6">
                            {formatOrderDate(o.created_at)}
                          </td>
                          <td className="px-4 py-3 sm:px-6">
                            <Link
                              href={`/dashboard/${activeTenant.slug}/ordenes/${o.id}`}
                              className="text-sm font-medium text-zinc-900 group-hover:underline"
                            >
                              {o.customer_name || "Sin nombre"}
                            </Link>
                            <span className="ml-1 font-mono text-[10px] text-zinc-400">
                              {o.id.slice(0, 8)}
                            </span>
                          </td>
                          <td className="px-4 py-3 sm:px-6">
                            {tipo === "productos" && (
                              <span className="inline-flex rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                                Productos
                              </span>
                            )}
                            {tipo === "servicios" && (
                              <span className="inline-flex rounded-md bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                                Servicios
                              </span>
                            )}
                            {tipo === "mixto" && (
                              <span className="inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                                Mixto
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 sm:px-6">
                            {o.assigned_user ? (
                              <span className="text-xs text-zinc-600">
                                {o.assigned_user.display_name ||
                                  o.assigned_user.email?.split("@")[0]}
                              </span>
                            ) : (
                              <span className="text-xs italic text-zinc-400">
                                Pendiente
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 sm:px-6">
                            <StatusBadge status={o.status} />
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-zinc-900 sm:px-6">
                            ${Number(o.total).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-zinc-100 md:hidden">
                {recent.map((o) => {
                  const tipo = orderContentType(o);
                  return (
                    <Link
                      key={o.id}
                      href={`/dashboard/${activeTenant.slug}/ordenes/${o.id}`}
                      className="block p-4 active:bg-zinc-50"
                    >
                      <p className="text-xs text-zinc-500">
                        {formatOrderDate(o.created_at)}
                      </p>
                      <p className="mt-0.5 font-medium text-zinc-900">
                        {o.customer_name || "Sin nombre"}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {tipo === "productos" && (
                          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-600">
                            Productos
                          </span>
                        )}
                        {tipo === "servicios" && (
                          <span className="rounded bg-teal-50 px-1.5 py-0.5 text-xs font-medium text-teal-700">
                            Servicios
                          </span>
                        )}
                        {tipo === "mixto" && (
                          <span className="rounded bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700">
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
                      <p className="mt-2 text-right text-sm font-semibold text-zinc-900">
                        ${Number(o.total).toFixed(2)}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
