"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { ProductsVsServices } from "@/app/api/sales-analytics/route";

interface ProductsVsServicesChartProps {
  data: ProductsVsServices;
  loading?: boolean;
}

export function ProductsVsServicesChart({ data, loading }: ProductsVsServicesChartProps) {
  const total = data.products_revenue + data.services_revenue;
  if (loading) {
    return (
      <div className="h-[220px] rounded-xl border border-border bg-surface-raised p-4 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (total <= 0) {
    return (
      <div className="rounded-xl border border-border bg-surface-raised p-3 sm:p-4">
        <h3 className="text-sm font-medium text-foreground">Productos vs servicios</h3>
        <div className="mt-4 h-[180px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Sin datos en el período</p>
        </div>
      </div>
    );
  }

  const chartData = [
    { name: "Productos", revenue: data.products_revenue, count: data.products_count },
    { name: "Servicios", revenue: data.services_revenue, count: data.services_count },
  ];

  return (
    <div className="rounded-xl border border-border bg-surface-raised p-4">
      <h3 className="text-sm font-medium text-foreground">Productos vs servicios</h3>
      <div className="mt-2 h-[200px] w-full sm:h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border-soft" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
            <Tooltip
              formatter={(v: number, name: string) => [`$${v.toFixed(2)}`, name]}
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const d = payload[0].payload as { name: string; revenue: number; count: number };
                return (
                  <div className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm shadow-sm">
                    <p className="font-medium text-foreground">{d.name}</p>
                    <p className="text-muted-foreground">Ventas: ${d.revenue.toFixed(2)}</p>
                    <p className="text-muted-foreground">Unidades: {d.count}</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="revenue" name="Ventas" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
