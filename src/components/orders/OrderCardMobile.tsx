"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { ChevronDown, User, Package, Wrench } from "lucide-react";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { TicketDownloadActions } from "@/components/orders/TicketDownloadActions";
import { formatOrderDate, formatOrderDateFull } from "@/lib/formatDate";
import { getPaymentMethodConfig } from "@/lib/formatPaymentMethod";
import { getSourceConfig } from "@/lib/formatSource";
import { swrFetcher } from "@/lib/swrFetcher";
import type { OrderListItem } from "@/types/orders";
import type { OrderDetail } from "@/app/dashboard/[tenantSlug]/ordenes/[orderId]/types";
import type { TenantAddress } from "@/types/database";

const STATUS_BORDER: Record<string, string> = {
  draft: "border-l-slate-400",
  assigned: "border-l-blue-500",
  in_progress: "border-l-amber-500",
  completed: "border-l-green-500",
  pending_payment: "border-l-orange-500",
  pending_pickup: "border-l-violet-500",
  paid: "border-l-emerald-500",
  cancelled: "border-l-red-400",
};

const PRICE_COLOR: Record<string, string> = {
  draft: "text-muted-foreground",
  assigned: "text-blue-600",
  in_progress: "text-amber-600",
  completed: "text-emerald-600",
  pending_payment: "text-orange-600",
  pending_pickup: "text-violet-600",
  paid: "text-emerald-600",
  cancelled: "text-muted-foreground/60 line-through decoration-red-400",
};

function accordionLabel(p: number, s: number, expanded: boolean): string {
  if (expanded) return "Ocultar detalle";
  if (p > 0 && s > 0) return `${p} ${p === 1 ? "producto" : "productos"} y ${s} ${s === 1 ? "servicio" : "servicios"}`;
  if (s > 0) return `${s} ${s === 1 ? "servicio" : "servicios"}`;
  return `${p} ${p === 1 ? "producto" : "productos"}`;
}

interface OrderCardMobileProps {
  order: OrderListItem;
  tenantSlug: string;
  businessName: string;
  businessAddress: TenantAddress | null;
}

export function OrderCardMobile({
  order,
  tenantSlug,
  businessName,
  businessAddress,
}: OrderCardMobileProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const isPaid = order.status === "paid" || order.status === "completed";
  const isCancelled = order.status === "cancelled";

  const orderDetailKey = expanded
    ? `/api/orders?order_id=${encodeURIComponent(order.id)}`
    : null;
  const { data: orderDetail, isLoading: itemsLoading } = useSWR<OrderDetail | null>(
    orderDetailKey,
    swrFetcher
  );
  const items = orderDetail?.items ?? [];

  const productsCount = order.products_count ?? 0;
  const servicesCount = order.services_count ?? 0;
  const totalItems = productsCount + servicesCount;

  const contentPill =
    productsCount > 0 && servicesCount > 0
      ? "Productos y servicios"
      : servicesCount > 0
      ? "Servicios"
      : productsCount > 0
      ? "Productos"
      : null;

  const customerLabel = order.customer_name || order.customer_email || null;
  const customerInitial = customerLabel?.charAt(0).toUpperCase() ?? null;
  const paymentConfig =
    isPaid && order.payment_method
      ? getPaymentMethodConfig(order.payment_method)
      : null;
  const PaymentIcon = paymentConfig?.icon;
  const assignedName =
    order.assigned_user?.display_name ?? order.assigned_user?.email?.split("@")[0];

  const borderColor = STATUS_BORDER[order.status] ?? "border-l-slate-400";
  const priceColor = PRICE_COLOR[order.status] ?? "text-foreground";

  const handleCardClick = () => {
    router.push(`/dashboard/${tenantSlug}/ordenes/${order.id}`);
  };

  const handleAccordionToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => !prev);
  };

  return (
    <article
      className={`relative w-full overflow-hidden rounded-2xl border border-border border-l-[3px] ${borderColor} bg-surface-raised shadow-sm transition-all duration-200 hover:shadow-md`}
      aria-label={`Orden ${order.id.slice(0, 8)} — ${customerLabel ?? "sin cliente"} — ${formatOrderDate(order.created_at)}`}
    >
      {/* ── Main clickable area ── */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleCardClick();
          }
        }}
        className="cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
      >
        <div className="flex flex-col gap-3 px-4 pt-4 pb-3">

          {/* Row 1 — Amount + Status */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              {order.total != null ? (
                <span className={`text-[28px] font-bold tabular-nums leading-none tracking-tight ${priceColor}`}>
                  ${Number(order.total).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              ) : (
                <span className="text-[28px] font-bold leading-none tracking-tight text-muted-foreground">
                  —
                </span>
              )}
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-0.5">
                {paymentConfig && PaymentIcon && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <PaymentIcon className={`h-3 w-3 shrink-0 ${paymentConfig.iconClass ?? ""}`} aria-hidden />
                    {paymentConfig.label}
                  </span>
                )}
                {order.source && paymentConfig && (
                  <span className="text-muted-foreground/50">·</span>
                )}
                {order.source && (() => {
                  const src = getSourceConfig(order.source);
                  if (!src) return null;
                  const Icon = src.icon;
                  return (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                      <Icon className={`h-3 w-3 shrink-0 ${src.iconClass ?? ""}`} aria-hidden />
                      {src.label}
                    </span>
                  );
                })()}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 pt-0.5">
              <StatusBadge status={order.status} cancelledFrom={order.cancelled_from} />
              <span className="text-[10px] font-mono tabular-nums text-muted-foreground/60">
                #{order.id.slice(0, 8)}
              </span>
            </div>
          </div>

          {/* Row 2 — Customer + date */}
          <div className="flex items-start justify-between gap-3">
            {/* Customer */}
            <div className="flex min-w-0 items-center gap-2">
              {customerInitial ? (
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold uppercase ${isCancelled ? "bg-border-soft/50 text-muted-foreground/40" : "bg-border-soft text-muted-foreground"}`}>
                  {customerInitial}
                </span>
              ) : (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-border-soft/60">
                  <User className="h-3.5 w-3.5 text-muted-foreground/50" aria-hidden />
                </span>
              )}
              <div className="min-w-0 flex-1">
                {/* Name + content pill inline */}
                <div className="flex min-w-0 items-center gap-1.5">
                  {customerLabel ? (
                    <p className={`truncate text-sm font-medium leading-tight ${isCancelled ? "text-muted-foreground/50" : "text-foreground"}`}>
                      {customerLabel}
                    </p>
                  ) : (
                    <p className="text-sm italic leading-tight text-muted-foreground/60">
                      Sin cliente
                    </p>
                  )}
                  {contentPill && (
                    <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/70 ring-1 ring-border/60">
                      {contentPill}
                    </span>
                  )}
                </div>
                {assignedName && (
                  <p className="truncate text-[11px] leading-tight text-muted-foreground/60 mt-0.5">
                    {assignedName}
                  </p>
                )}
              </div>
            </div>

            {/* Dates — creation and payment */}
            <div className="flex shrink-0 flex-col items-end gap-0.5 pt-0.5 text-xs tabular-nums text-muted-foreground/70">
              <time dateTime={order.created_at} title={formatOrderDateFull(order.created_at)}>
                Creada: {formatOrderDate(order.created_at)}
              </time>
              {isPaid && order.paid_at && (
                <time dateTime={order.paid_at} title={formatOrderDateFull(order.paid_at)}>
                  Pagada: {formatOrderDate(order.paid_at)}
                </time>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Accordion toggle ── */}
      {totalItems > 0 && (
        <button
          type="button"
          onClick={handleAccordionToggle}
          className="flex w-full items-center justify-between gap-2 border-t border-border/40 bg-background/20 px-4 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-border-soft/30 hover:text-foreground active:bg-border-soft/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
          aria-expanded={expanded}
          aria-controls={`order-${order.id}-items`}
          id={`order-${order.id}-items-trigger`}
        >
          <span className="flex items-center gap-1.5">
            {productsCount > 0 && (
              <Package className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" aria-hidden />
            )}
            {servicesCount > 0 && (
              <Wrench className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" aria-hidden />
            )}
            {accordionLabel(productsCount, servicesCount, expanded)}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 transition-transform duration-200 ease-out ${expanded ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
      )}

      {/* ── Accordion panel ── */}
      <div
        id={`order-${order.id}-items`}
        role="region"
        aria-labelledby={`order-${order.id}-items-trigger`}
        className={`overflow-hidden border-t border-border/40 bg-background/30 transition-[max-height,opacity] duration-300 ease-out ${
          expanded ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="space-y-2 p-3">
          {itemsLoading ? (
            <div className="flex items-center justify-center gap-2 py-5 text-xs text-muted-foreground">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-muted-foreground" />
              Cargando…
            </div>
          ) : items.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Sin productos registrados</p>
          ) : (
            items.map((item) => (
              <a
                key={item.id}
                href={
                  item.product?.id
                    ? item.product.type === "service"
                      ? `/dashboard/${tenantSlug}/servicios/${item.product.id}`
                      : `/dashboard/${tenantSlug}/productos/${item.product.id}`
                    : "#"
                }
                onClick={(e) => {
                  if (!item.product?.id) e.preventDefault();
                  e.stopPropagation();
                }}
                className="flex items-center gap-3 rounded-xl border border-border/30 bg-surface p-3 transition-colors hover:bg-border-soft/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-border-soft">
                  {item.product?.image_url ? (
                    <img
                      src={item.product.image_url}
                      alt={item.product?.name ?? ""}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xs font-bold uppercase text-muted-foreground">
                      {item.product?.name?.charAt(0) ?? "—"}
                    </span>
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground leading-tight">
                    {item.product?.name ?? "—"}
                  </p>
                  <p className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
                    {item.quantity} × ${Number(item.unit_price).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">
                  ${Number(item.subtotal).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              </a>
            ))
          )}
        </div>
      </div>

      {/* ── Receipt footer ── */}
      {(isPaid || order.status === "pending_pickup") && (
        <div
          className="flex min-h-[52px] items-center justify-between gap-3 border-t border-border/40 bg-background/20 pl-4 pr-3 py-2"
          onClick={(e) => e.stopPropagation()}
          role="group"
        >
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Comprobante
          </span>
          <TicketDownloadActions
            orderId={order.id}
            businessName={businessName}
            businessAddress={businessAddress}
            variant="compact"
          />
        </div>
      )}
    </article>
  );
}
