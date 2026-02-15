"use client";

import { useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { Plus, SlidersHorizontal, X } from "lucide-react";
import { useTenantStore } from "@/stores/useTenantStore";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { OrderCardMobile } from "@/components/orders/OrderCardMobile";
import { TicketDownloadActions } from "@/components/orders/TicketDownloadActions";
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
import { formatPaymentMethod } from "@/lib/formatPaymentMethod";
import { swrFetcher } from "@/lib/swrFetcher";
import type { OrderListItem } from "@/types/orders";

function orderContentType(
  o: OrderListItem,
): "productos" | "servicios" | "mixto" {
  const p = o.products_count ?? 0;
  const s = o.services_count ?? 0;
  if (p > 0 && s > 0) return "mixto";
  if (s > 0) return "servicios";
  return "productos";
}

function buildOrdersKey(
  tenantId: string | undefined,
  status: string,
  dateFrom: string,
  dateTo: string,
): string | null {
  if (!tenantId) return null;
  const search = new URLSearchParams({ tenant_id: tenantId });
  if (status) search.set("status", status);
  if (dateFrom) search.set("date_from", dateFrom);
  if (dateTo) search.set("date_to", dateTo);
  return `/api/orders?${search}`;
}

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "draft", label: "Borrador" },
  { value: "assigned", label: "Asignada" },
  { value: "in_progress", label: "En progreso" },
  { value: "pending_payment", label: "Pago pendiente" },
  { value: "paid", label: "Pagada" },
  { value: "completed", label: "Completada" },
  { value: "cancelled", label: "Cancelada" },
];

export default function OrdenesPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useTenantStore((s) => s.activeTenant)();
  const [statusFilter, setStatusFilter] = useState(
    () => searchParams.get("status") ?? "",
  );
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateFiltersOpen, setDateFiltersOpen] = useState(false);

  const hasDateFilter = Boolean(dateFrom || dateTo);

  const ordersKey = buildOrdersKey(
    activeTenant?.id,
    statusFilter,
    dateFrom,
    dateTo,
  );
  const {
    data: ordersData,
    error: swrError,
    isLoading,
  } = useSWR<OrderListItem[]>(ordersKey, swrFetcher, { fallbackData: [] });
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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden gap-4">
      <div className="shrink-0 space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
            Órdenes / Tickets
          </h1>
          <Link
            href={`/dashboard/${tenantSlug}/ordenes/nueva`}
            className="inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors duration-200 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:w-auto"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden />
            Nueva orden
          </Link>
        </div>

        {/* ── Status tabs ── */}
        <div className="space-y-2">
          <div className="relative">
            <div
              className="pointer-events-none absolute right-0 top-0 z-10 h-full w-10 from-background to-transparent"
              aria-hidden
            />
            <div
              className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-hide"
              role="tablist"
              aria-label="Filtrar por estado"
            >
              {STATUS_TABS.map((tab) => {
                const isActive = statusFilter === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setStatusFilter(tab.value)}
                    className={`inline-flex shrink-0 items-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 ${
                      isActive
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-border-soft hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Date filter row ── */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDateFiltersOpen((o) => !o)}
              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                hasDateFilter
                  ? "bg-accent/15 text-accent hover:bg-accent/20"
                  : "bg-border-soft/60 text-muted-foreground hover:bg-border-soft hover:text-foreground"
              }`}
              aria-expanded={dateFiltersOpen}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {hasDateFilter
                ? `Fechas: ${dateFrom || "—"} a ${dateTo || "—"}`
                : "Filtrar por fecha"}
            </button>
            {hasDateFilter && (
              <button
                type="button"
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                }}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-border-soft/60 text-muted-foreground hover:bg-border-soft hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label="Limpiar fechas"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            )}
          </div>

          {dateFiltersOpen && (
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-raised p-3 sm:flex-row">
              <label className="flex flex-1 flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  Desde
                </span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="input-form min-h-[40px] w-full rounded-lg border px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <label className="flex flex-1 flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  Hasta
                </span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="input-form min-h-[40px] w-full rounded-lg border px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
            </div>
          )}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 alert-error">
            {error}
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden py-3">
        {isLoading ? (
          <LoadingBlock
            variant="skeleton"
            message="Cargando órdenes"
            skeletonRows={6}
          />
        ) : orders.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface-raised p-8 text-center">
            <p className="text-sm text-muted">
              No hay órdenes{statusFilter ? " con este estado" : ""}. Crea una
              con &quot;Nueva orden&quot;.
            </p>
            <Link
              href={`/dashboard/${tenantSlug}/ordenes/nueva`}
              className="mt-4 inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors duration-200 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden />
              Crear primera orden
            </Link>
          </div>
        ) : (
          <>
            <div className="hidden min-h-0 flex-1 flex-col overflow-hidden md:flex">
              <TableWrapper scrollable>
                <table className="min-w-full">
                  <thead>
                    <tr className={tableHeaderRowClass}>
                      <th className={tableHeaderCellClass}>Fecha</th>
                      <th className={tableHeaderCellClass}>Cliente</th>
                      <th className={tableHeaderCellClass}>Contenido</th>
                      <th className={tableHeaderCellClass}>Asignado</th>
                      <th className={tableHeaderCellClass}>Estado</th>
                      <th className={tableHeaderCellClass}>Pago</th>
                      <th className={tableHeaderCellClass}>Ticket</th>
                      <th className={tableHeaderCellRightClass}>Total</th>
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
                              `/dashboard/${tenantSlug}/ordenes/${o.id}`,
                            )
                          }
                        >
                          <td className={tableBodyCellMutedClass}>
                            {formatOrderDate(o.created_at)}
                          </td>
                          <td className={tableBodyCellClass}>
                            {o.customer_name || o.customer_email ? (
                              <span className="font-medium text-foreground">
                                {o.customer_name || o.customer_email}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded bg-muted/30 px-2 py-0.5 text-xs italic text-muted-foreground">
                                Sin datos de cliente
                              </span>
                            )}
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
                            <StatusBadge
                              status={o.status}
                              cancelledFrom={o.cancelled_from}
                            />
                          </td>
                          <td className={tableBodyCellMutedClass}>
                            {(o.status === "paid" ||
                              o.status === "completed") &&
                            o.payment_method ? (
                              formatPaymentMethod(o.payment_method)
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td
                            className={tableBodyCellClass}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {(o.status === "paid" ||
                              o.status === "completed") && (
                              <TicketDownloadActions
                                orderId={o.id}
                                businessName={activeTenant?.name ?? "Negocio"}
                                businessAddress={activeTenant?.address ?? null}
                                variant="compact"
                              />
                            )}
                          </td>
                          <td className={tableBodyCellRightClass}>
                            ${Number(o.total).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </TableWrapper>
            </div>

            <div className="flex-1 overflow-y-auto md:hidden">
              <div className="space-y-3">
                {orders.map((o) => (
                  <OrderCardMobile
                    key={o.id}
                    order={o}
                    tenantSlug={tenantSlug}
                    businessName={activeTenant?.name ?? "Negocio"}
                    businessAddress={activeTenant?.address ?? null}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
