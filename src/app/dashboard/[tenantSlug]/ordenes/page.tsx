"use client";

import { useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { Link2, Plus, Scissors, SlidersHorizontal } from "lucide-react";
import { FAB } from "@/components/ui/FAB";
import { OrdersFilterSheet } from "@/components/orders/OrdersFilterSheet";
import { OrderFormSheet } from "@/features/orders/components/OrderFormSheet";
import { useActiveTenant, usePermission } from "@/stores/useTenantStore";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { OrderCardMobile } from "@/components/orders/OrderCardMobile";
import { TicketDownloadActions } from "@/components/orders/TicketDownloadActions";
import { FilterTabs } from "@/components/ui/FilterTabs";
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
import { formatOrderDate, formatOrderDateFull } from "@/lib/formatDate";
import { mergeTicketSettings } from "@/types/ticketSettings";
import type { TicketSettings } from "@/types/ticketSettings";
import { getTodayStr, clampDate } from "@/lib/dateValidation";
import { formatPaymentMethod } from "@/lib/formatPaymentMethod";
import { getSourceConfig } from "@/lib/formatSource";
import { swrFetcher } from "@/lib/swrFetcher";
import type { OrderListItem } from "@/types/orders";
import { SCOPE_TABS } from "@/features/orders/constants/scopeTabs";
import { ORDER_PERMISSIONS } from "@/features/orders/constants/orderPermissions";
import { buildOrdersKey } from "@/features/orders/helpers/buildOrdersKey";
import { ORDERS_LIST_REFRESH_MS } from "@/features/orders/constants/refresh";
import { PickupBadge } from "@/features/orders/components/order/PickupBadge";
import { OrderSearchField } from "@/features/orders/components/order/OrderSearchField";
import { orderContentType } from "@/features/orders/helpers/orderContentType";
import { FulfillmentBadge } from "@/features/orders/components/order/FulfillmentBadge";

import type { OrdersScope } from "@/features/orders/interfaces/ordersQuery";

export default function OrdenesPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useActiveTenant();
  const can = usePermission();
  const canViewAll = can(ORDER_PERMISSIONS.viewAll);
  const [statusFilter, setStatusFilter] = useState(
    () => searchParams.get("status") ?? "",
  );
  const [fulfillmentFilter, setFulfillmentFilter] = useState(
    () => searchParams.get("fulfillment") ?? "",
  );
  const [chosenScope, setChosenScope] = useState<OrdersScope | null>(null);
  const scope: OrdersScope = chosenScope ?? (canViewAll ? "all" : "mine");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");

  const hasDateFilter = Boolean(dateFrom || dateTo);

  const cutoffsKey =
    activeTenant?.id != null
      ? `/api/sales-cutoffs?tenant_id=${encodeURIComponent(activeTenant.id)}`
      : null;
  const { data: cutoffsData } = useSWR<{ period_end: string }[]>(
    cutoffsKey,
    swrFetcher,
    { fallbackData: [] },
  );
  const lastCutoffEnd =
    Array.isArray(cutoffsData) && cutoffsData.length > 0
      ? cutoffsData[0].period_end.slice(0, 10)
      : null;

  function setQuickDate(range: "hoy" | "ayer" | "7dias") {
    const today = new Date();
    const todayStr = getTodayStr();
    if (range === "hoy") {
      setDateFrom(todayStr);
      setDateTo(todayStr);
    } else if (range === "ayer") {
      const ayer = new Date(today);
      ayer.setDate(ayer.getDate() - 1);
      const ayerStr = clampDate(ayer.toISOString().slice(0, 10));
      setDateFrom(ayerStr);
      setDateTo(ayerStr);
    } else {
      const desde = new Date(today);
      desde.setDate(desde.getDate() - 6);
      setDateFrom(clampDate(desde.toISOString().slice(0, 10)));
      setDateTo(todayStr);
    }
  }

  const ordersKey = buildOrdersKey({
    tenantId: activeTenant?.id,
    status: statusFilter,
    fulfillment: fulfillmentFilter,
    dateFrom,
    dateTo,
    scope,
    search,
  });
  const {
    data: ordersData,
    error: swrError,
    isLoading,
  } = useSWR<OrderListItem[]>(ordersKey, swrFetcher, {
    fallbackData: [],
    // Los pedidos de la pantalla de autoservicio entran solos: sin esto la cola
    // se queda congelada hasta que alguien recarga.
    refreshInterval: ORDERS_LIST_REFRESH_MS,
  });
  const orders = Array.isArray(ordersData) ? ordersData : [];
  const error = swrError ? "No se pudieron cargar las órdenes" : null;

  if (!activeTenant) {
    return (
      <div className="text-sm text-muted-foreground">
        Selecciona un negocio para continuar.
      </div>
    );
  }

  const ticketOptions = mergeTicketSettings(
    (activeTenant.settings as Record<string, unknown>)?.ticket as
      | TicketSettings
      | undefined,
  );
  const logoUrl = activeTenant.logo_url ?? null;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden gap-2">
      <div className="shrink-0 space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center justify-between gap-2">
            <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
              Órdenes / Tickets
            </h1>
            <button
              type="button"
              onClick={() => setFilterSheetOpen(true)}
              className={`inline-flex min-h-(--touch-target,44px) min-w-(--touch-target,44px) items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                hasDateFilter || statusFilter || fulfillmentFilter
                  ? "bg-accent/15 text-accent hover:bg-accent/20"
                  : "bg-border-soft/60 text-muted-foreground hover:bg-border-soft hover:text-foreground"
              }`}
              aria-label="Filtrar órdenes"
            >
              <SlidersHorizontal className="h-5 w-5 shrink-0" aria-hidden />
              <span className="hidden md:inline">Filtrar</span>
            </button>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="hidden min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors duration-200 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:w-auto md:inline-flex"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden />
            Nueva orden
          </button>
        </div>

        <OrdersFilterSheet
          isOpen={filterSheetOpen}
          onClose={() => setFilterSheetOpen(false)}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          status={statusFilter}
          fulfillment={fulfillmentFilter}
          onStatusChange={setStatusFilter}
          onFulfillmentChange={setFulfillmentFilter}
          onQuickDate={setQuickDate}
          onApply={() => setFilterSheetOpen(false)}
        />

        <OrderSearchField onSearch={setSearch} />

        {canViewAll && (
          <FilterTabs
            tabs={SCOPE_TABS}
            activeValue={scope}
            onTabChange={(v) => setChosenScope(v as OrdersScope)}
            ariaLabel="Filtrar por quién atiende"
          />
        )}

        {/* Banner: viendo desde último corte */}
        {lastCutoffEnd && dateFrom === lastCutoffEnd && (
          <div className="flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3">
            <Scissors className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                Viendo desde el último corte
              </p>
              <p className="text-xs text-muted-foreground">
                Órdenes desde el{" "}
                {new Date(lastCutoffEnd).toLocaleDateString("es-MX", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
                . Las anteriores ya fueron incluidas en ese corte.
              </p>
            </div>
          </div>
        )}

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
            {search.trim() ? (
              <p className="text-sm text-muted">
                Ningún pedido coincide con{" "}
                <span className="font-mono font-semibold text-foreground">
                  {search.trim()}
                </span>
                . Revisa el número con el cliente o quita los otros filtros.
              </p>
            ) : (
              <>
                <p className="text-sm text-muted">
                  {hasDateFilter &&
                  dateFrom === dateTo &&
                  dateFrom === getTodayStr()
                    ? "No hay órdenes para hoy."
                    : `No hay órdenes${fulfillmentFilter ? " en esta etapa de preparación o entrega" : statusFilter ? " con este estado" : ""}${hasDateFilter ? " en las fechas seleccionadas" : ""}.`}{" "}
                  Crea una con &quot;Nueva orden&quot;.
                </p>
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="mt-4 inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors duration-200 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                >
                  <Plus className="h-4 w-4 shrink-0" aria-hidden />
                  Crear primera orden
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="hidden min-h-0 flex-1 flex-col overflow-hidden md:flex">
              <TableWrapper scrollable>
                <table className="min-w-full">
                  <thead>
                    <tr className={tableHeaderRowClass}>
                      <th className={tableHeaderCellClass}>Pedido</th>
                      <th className={tableHeaderCellClass}>Cliente</th>
                      <th className={tableHeaderCellClass}>Contenido</th>
                      <th className={tableHeaderCellClass}>Origen</th>
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
                            <div className="flex flex-col items-start gap-1">
                              <span className="font-mono text-xs font-bold tracking-wider text-foreground">
                                {o.order_number ??
                                  o.id.slice(0, 8).toUpperCase()}
                              </span>
                              {formatOrderDate(o.created_at)}
                              <PickupBadge
                                scheduledFor={o.scheduled_for}
                                status={o.status}
                              />
                            </div>
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
                            {(o.addenda_count ?? 0) > 0 && (
                              <span
                                className="ml-1 inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800"
                                title="Este pedido tiene complementos: el cobro está repartido"
                              >
                                <Link2
                                  className="h-3 w-3 shrink-0"
                                  aria-hidden
                                />
                                +{o.addenda_count}
                              </span>
                            )}
                          </td>
                          <td className={tableBodyCellClass}>
                            {o.source ? (
                              (() => {
                                const src = getSourceConfig(o.source);
                                if (!src)
                                  return (
                                    <span className="text-muted-foreground">
                                      —
                                    </span>
                                  );
                                const Icon = src.icon;
                                return (
                                  <span className="inline-flex items-center gap-1 rounded bg-border px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                                    <Icon
                                      className={`h-3 w-3 shrink-0 ${src.iconClass ?? ""}`}
                                      aria-hidden
                                    />
                                    {src.label}
                                  </span>
                                );
                              })()
                            ) : (
                              <span className="text-muted-foreground">—</span>
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
                            <div className="flex w-fit flex-col items-start gap-1">
                              <StatusBadge
                                status={o.status}
                                cancelledFrom={o.cancelled_from}
                              />
                              <FulfillmentBadge
                                source={o.source}
                                orderStatus={o.status}
                                fulfillmentStatus={o.fulfillment_status}
                                fulfillmentMethod={o.fulfillment_method}
                                eventTypes={o.delivery_event_types}
                              />
                              {(o.status === "paid" ||
                                o.status === "completed") &&
                                o.paid_at && (
                                  <span className="text-[11px] tabular-nums text-muted-foreground/70">
                                    {formatOrderDateFull(o.paid_at)}
                                  </span>
                                )}
                            </div>
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
                              o.status === "completed" ||
                              o.status === "pending_pickup") && (
                              <TicketDownloadActions
                                orderId={o.id}
                                businessName={activeTenant?.name ?? "Negocio"}
                                businessAddress={activeTenant?.address ?? null}
                                ticketOptions={ticketOptions}
                                logoUrl={logoUrl}
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
                    ticketOptions={ticketOptions}
                    logoUrl={logoUrl}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <FAB onClick={() => setCreateOpen(true)} aria-label="Nueva orden">
        <Plus className="h-6 w-6 shrink-0" aria-hidden />
      </FAB>

      {activeTenant && (
        <OrderFormSheet
          isOpen={createOpen}
          onClose={() => setCreateOpen(false)}
          tenantId={activeTenant.id}
          tenantSlug={tenantSlug}
        />
      )}
    </div>
  );
}
