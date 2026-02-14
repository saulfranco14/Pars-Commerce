"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { formatOrderDateFull } from "@/lib/formatDate";
import { getPaymentMethodConfig } from "@/lib/formatPaymentMethod";
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
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Volver a órdenes
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Orden {order.id.slice(0, 8)}
        </h1>
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
      <p className="mt-1.5 text-xs text-muted-foreground/70 tabular-nums">
        {formatOrderDateFull(order.created_at)}
      </p>
    </div>
  );
}
