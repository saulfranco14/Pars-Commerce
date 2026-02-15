"use client";

import type { SalesAnalyticsResponse } from "@/app/api/sales-analytics/route";
import { SalesByPaymentMethodChart } from "@/components/ventas/charts/SalesByPaymentMethodChart";
import { SalesBySourceChart } from "@/components/ventas/charts/SalesBySourceChart";
import { SalesByWeekChart } from "@/components/ventas/charts/SalesByWeekChart";
import { SalesObjectiveChart } from "@/components/ventas/charts/SalesObjectiveChart";
import { SalesTrendChart } from "@/components/ventas/charts/SalesTrendChart";
import { CommissionsByPersonChart } from "@/components/ventas/charts/CommissionsByPersonChart";
import { ProductsVsServicesChart } from "@/components/ventas/charts/ProductsVsServicesChart";

interface SummaryData {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  pendingCommission: number;
  paidCommission: number;
}

interface VentasResumenProps {
  summary: SummaryData;
  analytics: SalesAnalyticsResponse | null;
  analyticsLoading: boolean;
  dateFrom: string;
  dateTo: string;
}

export function VentasResumen({
  summary,
  analytics,
  analyticsLoading,
  dateFrom,
  dateTo,
}: VentasResumenProps) {
  const dateFromVal = (dateFrom || analytics?.dateFrom) ?? null;
  const dateToVal = (dateTo || analytics?.dateTo) ?? null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5 lg:gap-4">
        <div className="rounded-xl border border-border bg-surface-raised p-3 sm:p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
            Total vendido
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums text-foreground sm:mt-1.5 sm:text-xl">
            ${summary.totalRevenue.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface-raised p-3 sm:p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
            Costo total
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums text-foreground sm:mt-1.5 sm:text-xl">
            ${summary.totalCost.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface-raised p-3 sm:p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
            Ganancia bruta
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums text-accent sm:mt-1.5 sm:text-xl">
            ${summary.grossProfit.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface-raised p-3 sm:p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
            Comis. pendientes
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums text-amber-700 sm:mt-1.5 sm:text-xl">
            ${summary.pendingCommission.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface-raised p-3 sm:p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
            Comis. pagadas
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums text-foreground sm:mt-1.5 sm:text-xl">
            ${summary.paidCommission.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
        <SalesObjectiveChart
          totalRevenue={analytics?.monthlyTotalRevenue ?? 0}
          totalCost={analytics?.monthlyTotalCost ?? 0}
          grossProfit={analytics?.monthlyGrossProfit ?? 0}
          salesObjective={analytics?.salesObjective ?? null}
          monthlyRent={analytics?.monthlyRent ?? 0}
          loading={analyticsLoading}
        />
        <SalesByWeekChart
          byWeek={analytics?.byWeek ?? []}
          byDay={analytics?.byDay ?? []}
          dateFrom={dateFromVal}
          dateTo={dateToVal}
          loading={analyticsLoading}
        />
        <SalesByPaymentMethodChart
          data={analytics?.byPaymentMethod ?? { efectivo: 0, transferencia: 0, tarjeta: 0, mercadopago: 0, other: 0 }}
          dateFrom={dateFromVal}
          dateTo={dateToVal}
          loading={analyticsLoading}
        />
        <SalesBySourceChart
          data={analytics?.bySource ?? { dashboard: 0, public_store: 0 }}
          dateFrom={dateFromVal}
          dateTo={dateToVal}
          loading={analyticsLoading}
        />
        <SalesTrendChart
          data={analytics?.byDay ?? []}
          dateFrom={dateFromVal}
          dateTo={dateToVal}
          loading={analyticsLoading}
        />
        <CommissionsByPersonChart
          data={analytics?.byPerson ?? []}
          dateFrom={dateFromVal}
          dateTo={dateToVal}
          loading={analyticsLoading}
        />
        <ProductsVsServicesChart
          data={analytics?.productsVsServices ?? { products_revenue: 0, services_revenue: 0, products_count: 0, services_count: 0 }}
          topProducts={analytics?.topProducts ?? []}
          dateFrom={dateFromVal}
          dateTo={dateToVal}
          loading={analyticsLoading}
        />
      </div>
    </div>
  );
}
