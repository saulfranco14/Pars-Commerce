"use client";

import { useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
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
import type { OrderListItem } from "@/types/orders";

function orderContentType(o: OrderListItem): "productos" | "servicios" | "mixto" {
  const p = o.products_count ?? 0;
  const s = o.services_count ?? 0;
  if (p > 0 && s > 0) return "mixto";
  if (s > 0) return "servicios";
  return "productos";
}

function buildOrdersKey(tenantId: string | undefined, status: string, dateFrom: string, dateTo: string): string | null {
  if (!tenantId) return null;
  const search = new URLSearchParams({ tenant_id: tenantId });
  if (status) search.set("status", status);
  if (dateFrom) search.set("date_from", dateFrom);
  if (dateTo) search.set("date_to", dateTo);
  return `/api/orders?${search}`;
}

export default function OrdenesPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useTenantStore((s) => s.activeTenant)();
  const [statusFilter, setStatusFilter] = useState(
    () => searchParams.get("status") ?? ""
  );
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const ordersKey = buildOrdersKey(
    activeTenant?.id,
    statusFilter,
    dateFrom,
    dateTo
  );
  const { data: ordersData, error: swrError, isLoading } = useSWR<OrderListItem[]>(
    ordersKey,
    swrFetcher,
    { fallbackData: [] }
  );
  const orders = Array.isArray(ordersData) ? ordersData : [];
  const error = swrError ? "No se pudieron cargar las órdenes" : null;

  if (!activeTenant) {
    return (
      <div className="text-sm text-muted-foreground">
        Selecciona un negocio para continuar.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
          Órdenes / Tickets
        </h1>
        <Link
          href={`/dashboard/${tenantSlug}/ordenes/nueva`}
          className="min-h-[44px] inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90 active:opacity-95 sm:min-h-0"
        >
          Nueva orden
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-border-soft/80 overflow-hidden">
        <button
          type="button"
          onClick={() => setFiltersOpen((o) => !o)}
          className="flex min-h-[44px] w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-border-soft/60"
          aria-expanded={filtersOpen}
          aria-controls="ordenes-filters-content"
          id="ordenes-filters-trigger"
        >
          <span>Filtros</span>
          <span
            className={`shrink-0 text-muted transition-transform duration-200 ${filtersOpen ? "rotate-180" : ""}`}
            aria-hidden
          >
            ▼
          </span>
        </button>
        {filtersOpen && (
          <div
            id="ordenes-filters-content"
            role="region"
            aria-labelledby="ordenes-filters-trigger"
            className="border-t border-border px-4 pb-4 pt-3"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              <label className="flex w-full flex-col gap-1.5 sm:min-w-[120px] sm:flex-1 sm:flex-row sm:items-center sm:gap-1.5">
                <span className="text-sm font-medium text-muted-foreground sm:shrink-0">Estado</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input-form select-custom min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:min-h-0 sm:flex-1 sm:py-1.5"
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
              <label className="flex w-full flex-col gap-1.5 sm:min-w-[120px] sm:flex-1 sm:flex-row sm:items-center sm:gap-1.5">
                <span className="text-sm font-medium text-muted-foreground sm:shrink-0">Desde</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="input-form min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:min-h-0 sm:flex-1 sm:py-1.5"
                />
              </label>
              <label className="flex w-full flex-col gap-1.5 sm:min-w-[120px] sm:flex-1 sm:flex-row sm:items-center sm:gap-1.5">
                <span className="text-sm font-medium text-muted-foreground sm:shrink-0">Hasta</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="input-form min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:min-h-0 sm:flex-1 sm:py-1.5"
                />
              </label>
            </div>
          </div>
        )}
        {!filtersOpen && (
          <p className="border-t border-border px-4 py-2 text-xs text-muted" aria-hidden>
            {[
              statusFilter
                ? { draft: "Borrador", assigned: "Asignada", in_progress: "En progreso", completed: "Completada", pending_payment: "Pago pendiente", paid: "Pagada", cancelled: "Cancelada" }[statusFilter] ?? statusFilter
                : "Todos",
              dateFrom || dateTo ? `${dateFrom || "—"} a ${dateTo || "—"}` : null,
            ]
              .filter(Boolean)
              .join(" · ") || "Sin filtros"}
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 alert-error">
          {error}
        </div>
      )}

      {isLoading ? (
        <LoadingBlock
          variant="skeleton"
          message="Cargando órdenes"
          skeletonRows={6}
        />
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface-raised p-8 text-center">
          <p className="text-sm text-muted">
            No hay órdenes. Crea una con &quot;Nueva orden&quot;.
          </p>
          <Link
            href={`/dashboard/${tenantSlug}/ordenes/nueva`}
            className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90 active:opacity-90"
          >
            Crear primera orden
          </Link>
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <TableWrapper>
              <table className="min-w-full">
                <thead>
                  <tr className={tableHeaderRowClass}>
                    <th className={tableHeaderCellClass}>Cliente</th>
                    <th className={tableHeaderCellClass}>Contenido</th>
                    <th className={tableHeaderCellClass}>Asignado</th>
                    <th className={tableHeaderCellClass}>Estado</th>
                    <th className={tableHeaderCellRightClass}>Total</th>
                    <th className={tableHeaderCellClass}>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => {
                    const tipo = orderContentType(o);
                    return (
                      <tr
                        key={o.id}
                        className={`cursor-pointer ${tableBodyRowClass}`}
                        onClick={() =>
                          router.push(
                            `/dashboard/${tenantSlug}/ordenes/${o.id}`
                          )
                        }
                      >
                        <td className={tableBodyCellClass}>
                          {o.customer_name || o.customer_email || "—"}
                        </td>
                        <td className={tableBodyCellClass}>
                          {tipo === "productos" && (
                            <span className="rounded bg-border px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
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
                        <td className={tableBodyCellClass}>
                          {o.assigned_user ? (
                            <span className="text-muted-foreground">
                              {o.assigned_user.display_name ||
                                o.assigned_user.email?.split("@")[0]}
                            </span>
                          ) : (
                            <span className="text-muted italic">
                              Sin asignar
                            </span>
                          )}
                        </td>
                        <td className={tableBodyCellClass}>
                          <StatusBadge status={o.status} />
                        </td>
                        <td className={tableBodyCellRightClass}>
                          ${Number(o.total).toFixed(2)}
                        </td>
                        <td className={tableBodyCellMutedClass}>
                          {formatOrderDate(o.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableWrapper>
          </div>

          <div className="space-y-3 md:hidden">
            {orders.map((o) => {
              const tipo = orderContentType(o);
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() =>
                    router.push(`/dashboard/${tenantSlug}/ordenes/${o.id}`)
                  }
                  className="w-full min-h-[72px] rounded-xl border border-border bg-surface-raised p-4 text-left active:bg-border-soft/80"
                  aria-label={`Ver orden ${o.customer_name || o.customer_email || o.id.slice(0, 8)}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">
                        {o.customer_name || o.customer_email || "—"}
                      </p>
                      <p className="mt-0.5 text-sm text-muted">
                        {formatOrderDate(o.created_at)}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {tipo === "productos" && (
                          <span className="rounded bg-border px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
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
                          <span className="text-xs text-muted">
                            →{" "}
                            {o.assigned_user.display_name ||
                              o.assigned_user.email?.split("@")[0]}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="shrink-0 text-base font-semibold text-foreground">
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
