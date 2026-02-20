"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { formatOrderDateFull } from "@/lib/formatDate";
import { getPaymentMethodConfig } from "@/lib/formatPaymentMethod";
import { getSourceConfig } from "@/lib/formatSource";
import { useOrder } from "../hooks/useOrder";

export function OrderHeader() {
  const { order, tenantSlug } = useOrder();

  if (!order) return null;

  const isPaid = order.status === "paid" || order.status === "completed";
  const paymentConfig = order.payment_method ? getPaymentMethodConfig(order.payment_method) : null;
  const PaymentIcon = paymentConfig?.icon;

  return (
    <div className="shrink-0 border-b border-border pb-4">
      <Link
        href={`/dashboard/${tenantSlug}/ordenes`}
        className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-lg"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        Volver a órdenes
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Orden {order.id.slice(0, 8)}
        </h1>
        {order.source && (() => {
          const src = getSourceConfig(order.source);
          if (!src) return null;
          const Icon = src.icon;
          return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-border-soft px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              <Icon className={`h-3.5 w-3.5 shrink-0 ${src.iconClass ?? ""}`} aria-hidden />
              {src.label}
            </span>
          );
        })()}
        <StatusBadge status={order.status} cancelledFrom={order.cancelled_from} />
        {order.assigned_user && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-border-soft px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
            {order.assigned_user.display_name ||
              order.assigned_user.email?.split("@")[0]}
          </span>
        )}
        {isPaid && paymentConfig && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-border-soft px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {PaymentIcon && <PaymentIcon className={`h-3.5 w-3.5 shrink-0 ${paymentConfig.iconClass ?? ""}`} aria-hidden />}
            {paymentConfig.label}
          </span>
        )}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground/70 tabular-nums">
        <span>Creada: {formatOrderDateFull(order.created_at)}</span>
        {isPaid && order.paid_at && (
          <span>Pagada: {formatOrderDateFull(order.paid_at)}</span>
        )}
      </div>
    </div>
  );
}
