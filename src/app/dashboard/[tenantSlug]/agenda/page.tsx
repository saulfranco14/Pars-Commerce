"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  Clock,
} from "lucide-react";

import { PageHeader } from "@/components/admin/PageHeader";
import { MetricsStrip } from "@/components/admin/MetricsStrip";
import { EmptyState } from "@/components/admin/EmptyState";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { Notification } from "@/components/ui/Notification";
import { AcceptingOrdersToggle } from "@/features/orders/components/agenda/AcceptingOrdersToggle";

import { useActiveTenant, usePermission } from "@/stores/useTenantStore";
import { ORDER_PERMISSIONS } from "@/features/orders/constants/orderPermissions";
import {
  countAgenda,
  formatAgendaDateTime,
  formatAgendaTime,
  groupAgenda,
} from "@/features/orders/helpers/agendaBuckets";
import { swrFetcher } from "@/lib/swrFetcher";
import { formatCurrency } from "@/features/qr/helpers/format";

import type { Metric } from "@/components/admin/MetricsStrip";
import type { OrderListItem } from "@/types/orders";

export default function AgendaPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useActiveTenant();
  const can = usePermission();

  const [acceptingOverride, setAcceptingOverride] = useState<boolean | null>(
    null,
  );

  const key = activeTenant
    ? `/api/orders?tenant_id=${encodeURIComponent(activeTenant.id)}&scheduled=1`
    : null;
  const { data, error, isLoading } = useSWR<OrderListItem[]>(key, swrFetcher, {
    fallbackData: [],
  });

  const orders = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const now = useMemo(() => new Date(), []);
  const buckets = useMemo(() => groupAgenda(orders, now), [orders, now]);
  const counts = useMemo(() => countAgenda(orders, now), [orders, now]);

  if (!activeTenant) {
    return (
      <div className="text-sm text-muted-foreground">
        Selecciona un negocio para continuar.
      </div>
    );
  }

  const accepting =
    acceptingOverride ?? activeTenant.accepting_orders !== false;

  const metrics: Metric[] = [
    {
      label: "Atrasados",
      value: counts.atrasados,
      tone: counts.atrasados > 0 ? "red" : "default",
      icon: AlertTriangle,
      hint: "Ya pasó la hora acordada",
    },
    { label: "Hoy", value: counts.hoy, tone: "accent", icon: Clock },
    { label: "Mañana", value: counts.manana, icon: CalendarDays },
    { label: "Después", value: counts.despues, icon: CalendarClock },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda de recolección"
        description="Pedidos del sitio con hora acordada para que el cliente pase por ellos."
        action={
          can(ORDER_PERMISSIONS.scheduleConfig) ? (
            <AcceptingOrdersToggle
              tenantId={activeTenant.id}
              accepting={accepting}
              onChanged={setAcceptingOverride}
            />
          ) : undefined
        }
      />

      {!accepting && (
        <Notification
          tone="warning"
          title="Recepción cerrada"
          message="Tu sitio muestra el catálogo pero no acepta pedidos nuevos. Los carritos de tus clientes siguen guardados."
        />
      )}

      <MetricsStrip metrics={metrics} />

      {error && (
        <Notification
          tone="error"
          message="No se pudo cargar la agenda. Recarga la página."
        />
      )}

      {isLoading ? (
        <LoadingBlock message="Cargando agenda…" />
      ) : buckets.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No hay pedidos agendados"
          description="Cuando un cliente elija una hora para pasar por su pedido, aparecerá aquí ordenado por hora."
        />
      ) : (
        <div className="space-y-6">
          {buckets.map((bucket) => (
            <section key={bucket.key}>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                {bucket.key === "atrasados" && (
                  <AlertTriangle
                    className="h-4 w-4 shrink-0 text-red-600"
                    aria-hidden
                  />
                )}
                {bucket.label}
                <span className="text-xs font-normal text-muted-foreground">
                  {bucket.orders.length}
                </span>
              </h2>

              <ul className="divide-y divide-border-soft overflow-hidden rounded-xl border border-border bg-surface-raised">
                {bucket.orders.map((order) => (
                  <li key={order.id}>
                    <Link
                      href={`/dashboard/${tenantSlug}/ordenes/${order.id}`}
                      className="flex min-h-14 items-center gap-3 px-4 py-3 transition-colors hover:bg-border-soft/40"
                    >
                      {/* Ancho fijo para que las horas aliñen en columna;
                          "Después" trae día y mes, así que necesita más. */}
                      <span
                        className={`shrink-0 text-sm font-bold tabular-nums ${
                          bucket.key === "despues" ? "w-32" : "w-14"
                        } ${
                          bucket.key === "atrasados"
                            ? "text-red-600"
                            : "text-foreground"
                        }`}
                      >
                        {bucket.key === "despues"
                          ? formatAgendaDateTime(order.scheduled_for!)
                          : formatAgendaTime(order.scheduled_for!)}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {order.customer_name || "Sin nombre"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {order.products_count ?? 0} productos ·{" "}
                          {order.id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <StatusBadge status={order.status} />
                        <span className="text-sm font-semibold tabular-nums text-foreground">
                          {formatCurrency(Number(order.total))}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
