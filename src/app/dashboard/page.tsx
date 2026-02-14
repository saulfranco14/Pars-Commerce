"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { useTenantStore } from "@/stores/useTenantStore";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import {
  TableWrapper,
  tableHeaderRowClass,
  tableHeaderCellClass,
  tableHeaderCellRightClass,
  tableBodyRowClass,
  tableBodyCellClass,
  tableBodyCellMutedClass,
  tableBodyCellRightClass,
} from "@/components/ui/TableWrapper";
import { formatOrderDate } from "@/lib/formatDate";
import { swrFetcher } from "@/lib/swrFetcher";
import {
  ArrowRight,
  ClipboardList,
  Clock,
  Plus,
  ShoppingBag,
  TrendingUp,
  Trophy,
  UserPlus,
  Wrench,
} from "lucide-react";
import { OrderCardMobile } from "@/components/orders/OrderCardMobile";

interface OrderRow {
  id: string;
  status: string;
  cancelled_from?: string | null;
  customer_name: string | null;
  customer_email: string | null;
  total: number;
  created_at: string;
  assigned_to: string | null;
  payment_method?: string | null;
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
  const [period, setPeriod] = useState<
    "today" | "week" | "fortnight" | "month"
  >("week");

  const { dateFrom, dateTo } = getPeriodDates(period);

  const ordersKey =
    activeTenant?.id != null
      ? `/api/orders?tenant_id=${encodeURIComponent(activeTenant.id)}&date_from=${dateFrom}&date_to=${dateTo}`
      : null;
  const { data: ordersData, isLoading: salesLoading } = useSWR<OrderRow[]>(
    ordersKey,
    swrFetcher,
    { fallbackData: [] }
  );
  const orders = Array.isArray(ordersData) ? ordersData : [];

  const salesByItemKey =
    activeTenant?.id != null
      ? `/api/dashboard-sales-by-item?tenant_id=${encodeURIComponent(activeTenant.id)}&date_from=${dateFrom}&date_to=${dateTo}`
      : null;
  const { data: salesByItemData, isLoading: salesByItemLoading } =
    useSWR<SalesByItem>(salesByItemKey, swrFetcher, {
      fallbackData: { products: [], services: [] },
    });
  const salesByItem =
    salesByItemData &&
    Array.isArray(salesByItemData.products) &&
    Array.isArray(salesByItemData.services)
      ? salesByItemData
      : { products: [], services: [] };

  const statsKey =
    activeTenant?.id != null
      ? `/api/dashboard-stats?tenant_id=${encodeURIComponent(activeTenant.id)}`
      : null;
  const { data: catalogStats, isLoading: catalogLoading } =
    useSWR<CatalogStats | null>(statsKey, swrFetcher);

  if (!activeTenant) {
    return null;
  }

  const recent = orders.slice(0, 5);
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

  const periodLabel =
    period === "today"
      ? "Hoy"
      : period === "week"
      ? "Últimos 7 días"
      : period === "fortnight"
      ? "Últimos 15 días"
      : "Últimos 30 días";
  const needsAttention = unassignedCount > 0 || activeOrders > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <div className="space-y-8 pb-8 sm:pb-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {activeTenant.name}
          </h1>
          <p className="mt-0.5 text-sm text-muted sm:text-base">
            {periodLabel}
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
            className="select-custom min-h-[44px] flex-1 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-medium text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:min-h-0 sm:flex-none"
          >
            <option value="today">Hoy</option>
            <option value="week">Semana</option>
            <option value="fortnight">Quincena</option>
            <option value="month">Mes</option>
          </select>
          <Link
            href={`/dashboard/${activeTenant.slug}/ordenes/nueva`}
            className="inline-flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors duration-200 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:min-h-0 sm:flex-none"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden />
            Nueva Orden
          </Link>
        </div>
      </header>

      {needsAttention && (
        <Link
          href={`/dashboard/${activeTenant.slug}/ordenes`}
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-border-soft bg-border-soft/50 px-4 py-3 transition-colors duration-200 hover:bg-border-soft/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2"
        >
          <div className="flex items-center gap-2">
            {activeOrders > 0 && (
              <span className="flex items-center gap-1.5 text-sm text-foreground">
                <Clock className="h-4 w-4 text-amber-500" />
                {activeOrders} en progreso
              </span>
            )}
            {unassignedCount > 0 && (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <UserPlus className="h-4 w-4" />
                {unassignedCount} sin asignar
              </span>
            )}
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted" />
        </Link>
      )}

      <section>
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Ventas
          </h2>
          <span className="text-xs text-muted">{periodLabel}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link
            href={`/dashboard/${activeTenant.slug}/ordenes`}
            className="block cursor-pointer rounded-xl border border-border bg-surface-raised p-4 transition-colors duration-200 hover:bg-border-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted">
                Total vendido
              </p>
              <TrendingUp className="h-4 w-4 text-accent" />
            </div>
            <p className="mt-1.5 text-2xl font-bold tabular-nums text-foreground">
              ${totalSold.toFixed(2)}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              Cobrado · Ver órdenes <ArrowRight className="inline h-3 w-3" />
            </p>
          </Link>
          <Link
            href={`/dashboard/${activeTenant.slug}/ordenes?status=in_progress`}
            className="block cursor-pointer rounded-xl border border-border bg-surface-raised p-4 transition-colors duration-200 hover:bg-border-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted">Activas</p>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <p className="mt-1.5 text-xl font-bold tabular-nums text-foreground">
              {activeOrders}
            </p>
            <p className="mt-0.5 text-xs text-muted">En progreso</p>
          </Link>
          <Link
            href={`/dashboard/${activeTenant.slug}/ordenes?status=completed`}
            className="block cursor-pointer rounded-xl border border-border bg-surface-raised p-4 transition-colors duration-200 hover:bg-border-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted">Completadas</p>
              <div className="h-2 w-2 rounded-full bg-accent" />
            </div>
            <p className="mt-1.5 text-xl font-bold tabular-nums text-foreground">
              {byStatus.completed ?? 0}
            </p>
            <p className="mt-0.5 text-xs text-muted">Para cobro</p>
          </Link>
          <Link
            href={`/dashboard/${activeTenant.slug}/ordenes`}
            className="block cursor-pointer rounded-xl border border-border bg-surface-raised p-4 transition-colors duration-200 hover:bg-border-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted">Total órdenes</p>
              <ClipboardList className="h-4 w-4 text-muted" />
            </div>
            <p className="mt-1.5 text-xl font-bold tabular-nums text-foreground">
              {orders.length}
            </p>
            <p className="mt-0.5 text-xs text-muted">En el período</p>
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
          Catálogo
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4">
          <Link
            href={`/dashboard/${activeTenant.slug}/productos`}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface-raised p-4 transition-colors duration-200 hover:bg-border-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-border-soft text-muted">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted">Productos</p>
              <p className="text-lg font-bold tabular-nums text-foreground">
                {catalogLoading ? "—" : catalogStats?.products_count ?? 0}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted" />
          </Link>
          <Link
            href={`/dashboard/${activeTenant.slug}/servicios`}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface-raised p-4 transition-colors duration-200 hover:bg-border-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-border-soft text-accent">
              <Wrench className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted">Servicios</p>
              <p className="text-lg font-bold tabular-nums text-foreground">
                {catalogLoading ? "—" : catalogStats?.services_count ?? 0}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted" />
          </Link>
        </div>
      </section>

      {unassignedCount > 0 && (
        <Link
          href={`/dashboard/${activeTenant.slug}/ordenes`}
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-amber-200/80 bg-amber-50/80 p-4 text-amber-900 transition-colors duration-200 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 sm:p-4"
        >
          <UserPlus className="h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-medium">
              {unassignedCount} orden{unassignedCount !== 1 ? "es" : ""} sin
              asignar
            </p>
            <p className="text-sm text-amber-800/90">
              Asigna a un miembro del equipo para dar seguimiento.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-amber-600" />
        </Link>
      )}

      {userSales.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted">
            <Trophy className="h-4 w-4 text-amber-500" />
            Ventas por usuario
          </h2>
          <TableWrapper>
            <table className="w-full text-sm">
              <thead>
                <tr className={tableHeaderRowClass}>
                  <th className={tableHeaderCellClass}>#</th>
                  <th className={tableHeaderCellClass}>Usuario</th>
                  <th className={tableHeaderCellRightClass}>Órdenes</th>
                  <th className={tableHeaderCellRightClass}>Total</th>
                </tr>
              </thead>
              <tbody>
                {userSales.slice(0, 8).map((u, i) => (
                  <tr
                    key={u.id}
                    className={
                      i === 0
                        ? "bg-amber-50/40 font-medium"
                        : tableBodyRowClass
                    }
                  >
                    <td className={tableBodyCellClass}>
                      <span
                        className={
                          i === 0
                            ? "inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-200/80 text-xs font-bold text-amber-900"
                            : "text-muted"
                        }
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className={tableBodyCellClass}>{u.name}</td>
                    <td className={`${tableBodyCellMutedClass} text-right`}>
                      {u.count}
                    </td>
                    <td className={tableBodyCellRightClass}>
                      ${u.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalSold > 0 && userSales.length > 0 && (
              <div className="border-t border-border-soft px-4 py-2 text-xs text-muted sm:px-6">
                El líder del período es{" "}
                <strong className="text-muted-foreground">{userSales[0].name}</strong>{" "}
                con {((userSales[0].total / totalSold) * 100).toFixed(0)}%
                del total.
              </div>
            )}
          </TableWrapper>
        </section>
      )}

      <section
        className={
          salesByItem.products.length > 0 && salesByItem.services.length > 0
            ? "grid gap-4 lg:grid-cols-2"
            : ""
        }
      >
        {!salesByItemLoading &&
        salesByItem.products.length === 0 &&
        salesByItem.services.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface-raised px-4 py-3 text-center text-sm text-muted">
            Sin ventas de productos ni servicios en el período.
          </div>
        ) : (
          <>
        {(salesByItem.products.length > 0 || salesByItemLoading) && (
          <div
            className={
              salesByItem.products.length === 0 &&
              salesByItem.services.length > 0
                ? "hidden"
                : ""
            }
          >
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted">
              <ShoppingBag className="h-4 w-4" />
              Lo más vendido: Productos
            </h2>
            <TableWrapper>
              {salesByItemLoading ? (
                <LoadingBlock message="Cargando productos…" />
              ) : salesByItem.products.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted">
                  Sin ventas de productos en el período.
                </div>
              ) : (
                <table className="min-w-full">
                  <thead>
                    <tr className={tableHeaderRowClass}>
                      <th className={tableHeaderCellClass}>Producto</th>
                      <th className={tableHeaderCellRightClass}>Cant.</th>
                      <th className={tableHeaderCellRightClass}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesByItem.products.map((row, i) => (
                      <tr
                        key={row.id}
                        className={
                          i === 0 ? "bg-border-soft/60" : tableBodyRowClass
                        }
                      >
                        <td className={tableBodyCellClass}>{row.name}</td>
                        <td className={`${tableBodyCellMutedClass} text-right`}>
                          {row.quantity}
                        </td>
                        <td className={tableBodyCellRightClass}>
                          ${row.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </TableWrapper>
          </div>
        )}
        {(salesByItem.services.length > 0 || salesByItemLoading) && (
          <div
            className={
              salesByItem.services.length === 0 &&
              salesByItem.products.length > 0
                ? "hidden"
                : ""
            }
          >
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted">
              <Wrench className="h-4 w-4" />
              Lo más vendido: Servicios
            </h2>
            <TableWrapper>
              {salesByItemLoading ? (
                <LoadingBlock message="Cargando servicios…" />
              ) : salesByItem.services.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted">
                  Sin ventas de servicios en el período.
                </div>
              ) : (
                <table className="min-w-full">
                  <thead>
                    <tr className={tableHeaderRowClass}>
                      <th className={tableHeaderCellClass}>Servicio</th>
                      <th className={tableHeaderCellRightClass}>Cant.</th>
                      <th className={tableHeaderCellRightClass}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesByItem.services.map((row, i) => (
                      <tr
                        key={row.id}
                        className={
                          i === 0 ? "bg-border-soft/60" : tableBodyRowClass
                        }
                      >
                        <td className={tableBodyCellClass}>{row.name}</td>
                        <td className={`${tableBodyCellMutedClass} text-right`}>
                          {row.quantity}
                        </td>
                        <td className={tableBodyCellRightClass}>
                          ${row.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </TableWrapper>
          </div>
        )}
          </>
        )}
      </section>

      <section>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Actividad reciente
          </h2>
          <Link
            href={`/dashboard/${activeTenant.slug}/ordenes`}
            className="inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-muted hover:text-foreground sm:min-h-0"
          >
            Ver todas <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {salesLoading ? (
          <LoadingBlock message="Cargando actividad…" />
        ) : recent.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface-raised p-6 text-center text-sm text-muted">
            No hay actividad reciente.
          </div>
        ) : (
          <>
            <TableWrapper>
              <div className="hidden md:block">
                <table className="min-w-full">
                  <thead>
                    <tr className={tableHeaderRowClass}>
                      <th className={tableHeaderCellClass}>Fecha</th>
                      <th className={tableHeaderCellClass}>Cliente</th>
                      <th className={tableHeaderCellClass}>Contenido</th>
                      <th className={tableHeaderCellClass}>Asignado</th>
                      <th className={tableHeaderCellClass}>Estado</th>
                      <th className={tableHeaderCellRightClass}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((o) => {
                      const tipo = orderContentType(o);
                      return (
                        <tr
                          key={o.id}
                          className={`group ${tableBodyRowClass}`}
                        >
                          <td className={`whitespace-nowrap ${tableBodyCellMutedClass}`}>
                            {formatOrderDate(o.created_at)}
                          </td>
                          <td className={tableBodyCellClass}>
                            <Link
                              href={`/dashboard/${activeTenant.slug}/ordenes/${o.id}`}
                              className="font-medium text-foreground group-hover:underline"
                            >
                              {o.customer_name || "Sin nombre"}
                            </Link>
                            <span className="ml-1 font-mono text-[10px] text-muted">
                              {o.id.slice(0, 8)}
                            </span>
                          </td>
                          <td className={tableBodyCellClass}>
                            {tipo === "productos" && (
                              <span className="inline-flex rounded-md bg-border-soft px-2 py-0.5 text-xs font-medium text-muted-foreground">
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
                          <td className={tableBodyCellClass}>
                            {o.assigned_user ? (
                              <span className="text-muted-foreground">
                                {o.assigned_user.display_name ||
                                  o.assigned_user.email?.split("@")[0]}
                              </span>
                            ) : (
                              <span className="italic text-muted">
                                Pendiente
                              </span>
                            )}
                          </td>
                          <td className={tableBodyCellClass}>
                            <StatusBadge status={o.status} cancelledFrom={o.cancelled_from} />
                          </td>
                          <td className={tableBodyCellRightClass}>
                            ${Number(o.total).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </TableWrapper>

            <div className="space-y-3 md:hidden">
              {recent.map((o) => (
                <OrderCardMobile
                  key={o.id}
                  order={o}
                  tenantSlug={activeTenant.slug}
                  businessName={activeTenant.name ?? "Negocio"}
                  businessAddress={activeTenant.address ?? null}
                />
              ))}
            </div>
          </>
        )}
      </section>
      </div>
    </div>
  );
}
