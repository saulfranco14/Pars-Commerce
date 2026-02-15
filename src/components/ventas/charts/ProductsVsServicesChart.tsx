"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartHeader } from "./ChartHeader";
import type {
  ProductsVsServices,
  TopProductItem,
} from "@/app/api/sales-analytics/route";

interface ProductsVsServicesChartProps {
  data: ProductsVsServices;
  topProducts: TopProductItem[];
  dateFrom: string | null;
  dateTo: string | null;
  loading?: boolean;
}

function formatProductName(name: string): string {
  return name.length > 18 ? name.slice(0, 16) + "…" : name;
}

export function ProductsVsServicesChart({
  data,
  topProducts,
  dateFrom,
  dateTo,
  loading,
}: ProductsVsServicesChartProps) {
  const hasServices = data.services_revenue > 0 || data.services_count > 0;
  const hasProducts = data.products_revenue > 0 || data.products_count > 0;
  const showTopProducts = !hasServices && hasProducts && topProducts.length > 0;

  const productServiceData = [
    {
      name: "Productos",
      revenue: data.products_revenue,
      count: data.products_count,
    },
    {
      name: "Servicios",
      revenue: data.services_revenue,
      count: data.services_count,
    },
  ];

  const topProductsData = topProducts.map((p) => ({
    name: formatProductName(p.name),
    fullName: p.name,
    revenue: p.total,
    quantity: p.quantity,
  }));

  const title = showTopProducts
    ? "Productos más vendidos"
    : "Productos vs servicios";
  const description = showTopProducts
    ? "Productos con mayor facturación en el período."
    : "Comparativa de ventas entre productos y servicios.";

  if (loading) {
    return (
      <div className="min-h-[260px] rounded-xl border border-border bg-surface-raised p-3 sm:p-4 flex flex-col justify-center">
        <ChartHeader
          title={title}
          description={description}
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (showTopProducts) {
    if (topProductsData.length === 0) {
      return (
        <div className="rounded-xl border border-border bg-surface-raised p-3 sm:p-4">
          <ChartHeader
            title={title}
            description={description}
            dateFrom={dateFrom}
            dateTo={dateTo}
          />
          <div className="mt-4 h-[180px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Sin datos en el período</p>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-border bg-surface-raised p-3 sm:p-4 overflow-hidden">
        <ChartHeader
          title={title}
          description={description}
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
        <div className="h-[200px] w-full min-w-[120px] sm:h-[220px] min-h-[180px]">
          <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 400, height: 200 }}>
            <BarChart
              data={topProductsData}
              layout="vertical"
              margin={{ top: 4, right: 4, left: 0, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border-soft" />
              <XAxis
                type="number"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `$${v >= 1000 ? (v / 1000) + "k" : v}`}
                width={40}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 10 }}
                width={90}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const d = payload[0].payload as {
                    fullName: string;
                    revenue: number;
                    quantity: number;
                  };
                  return (
                    <div className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm shadow-sm">
                      <p className="font-medium text-foreground">{d.fullName}</p>
                      <p className="text-muted-foreground">
                        Ventas: ${d.revenue.toFixed(2)}
                      </p>
                      <p className="text-muted-foreground">
                        Unidades: {d.quantity}
                      </p>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="revenue"
                fill="hsl(142 71% 45%)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  const total = data.products_revenue + data.services_revenue;
  if (total <= 0) {
    return (
      <div className="rounded-xl border border-border bg-surface-raised p-3 sm:p-4">
        <ChartHeader
          title={title}
          description={description}
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
        <div className="mt-4 h-[180px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Sin datos en el período</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface-raised p-3 sm:p-4 overflow-hidden">
      <ChartHeader
        title={title}
        description={description}
        dateFrom={dateFrom}
        dateTo={dateTo}
      />
      <div className="h-[200px] w-full min-w-[120px] sm:h-[220px] min-h-[180px]">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 400, height: 200 }}>
          <BarChart
            data={productServiceData}
            margin={{ top: 8, right: 4, left: -8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border-soft" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis
              tick={{ fontSize: 10 }}
              tickFormatter={(v) => `$${v >= 1000 ? (v / 1000) + "k" : v}`}
              width={40}
            />
            <Tooltip
              formatter={(v, name) => [`$${Number(v ?? 0).toFixed(2)}`, name]}
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const d = payload[0].payload as {
                  name: string;
                  revenue: number;
                  count: number;
                };
                return (
                  <div className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm shadow-sm">
                    <p className="font-medium text-foreground">{d.name}</p>
                    <p className="text-muted-foreground">
                      Ventas: ${d.revenue.toFixed(2)}
                    </p>
                    <p className="text-muted-foreground">Unidades: {d.count}</p>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="revenue"
              name="Ventas"
              fill="hsl(142 71% 45%)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
