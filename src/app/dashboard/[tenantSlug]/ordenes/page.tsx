"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
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
  const router = useRouter();
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

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-border-soft/60 p-4">
        <label className="flex flex-1 min-w-[120px] items-center gap-1.5 text-sm text-muted-foreground sm:flex-none">
          Estado:
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select-custom min-h-[44px] flex-1 rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:min-h-0 sm:flex-none sm:py-1.5"
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
        <label className="flex flex-1 min-w-[120px] items-center gap-1.5 text-sm text-muted-foreground sm:flex-none">
          Desde:
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="min-h-[44px] flex-1 rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:min-h-0 sm:py-1.5"
          />
        </label>
        <label className="flex flex-1 min-w-[120px] items-center gap-1.5 text-sm text-muted-foreground sm:flex-none">
          Hasta:
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="min-h-[44px] flex-1 rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:min-h-0 sm:py-1.5"
          />
        </label>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingBlock
          variant="skeleton"
          message="Cargando órdenes"
          skeletonRows={6}
        />
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface-raised p-8 text-center shadow-sm">
          <p className="text-sm text-muted">
            No hay órdenes. Crea una con &quot;Nueva orden&quot;.
          </p>
          <Link
            href={`/dashboard/${tenantSlug}/ordenes/nueva`}
            className="mt-4 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
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
                  className="w-full rounded-xl border border-border bg-surface-raised p-4 text-left shadow-sm active:bg-border-soft"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">
                        {o.customer_name || o.customer_email || "—"}
                      </p>
                      <p className="text-xs text-muted">
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
                    <span className="shrink-0 text-sm font-semibold text-foreground">
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
