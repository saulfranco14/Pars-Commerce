"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { formatOrderDate } from "@/lib/formatDate";
import { useOrder } from "../hooks/useOrder";

export function OrderHeader() {
  const { order, tenantSlug } = useOrder();

  if (!order) return null;

  return (
    <div className="shrink-0 border-b border-border pb-4">
      <Link
        href={`/dashboard/${tenantSlug}/ordenes`}
        className="text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        ← Volver a órdenes
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
          Orden {order.id.slice(0, 8)}
        </h1>
        <StatusBadge status={order.status} cancelledFrom={order.cancelled_from} />
        {order.assigned_user && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-border-soft px-3 py-1 text-sm text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            {order.assigned_user.display_name ||
              order.assigned_user.email?.split("@")[0]}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-muted">
        Creada: {formatOrderDate(order.created_at)}
      </p>
    </div>
  );
}
