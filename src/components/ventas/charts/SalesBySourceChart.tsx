"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { SalesBySource } from "@/app/api/sales-analytics/route";
import { formatSourceLabel } from "@/lib/formatSource";
import { ChartHeader } from "./ChartHeader";

const COLORS = ["hsl(215 16% 47%)", "hsl(173 80% 40%)"];

interface SalesBySourceChartProps {
  data: SalesBySource;
  dateFrom: string | null;
  dateTo: string | null;
  loading?: boolean;
}

export function SalesBySourceChart({
  data,
  dateFrom,
  dateTo,
  loading,
}: SalesBySourceChartProps) {
  const entries = [
    { name: formatSourceLabel("dashboard") || "Dashboard", value: data.dashboard },
    { name: formatSourceLabel("public_store") || "Sitio web", value: data.public_store },
  ].filter((d) => d.value > 0);

  if (loading) {
    return (
      <div className="min-h-[260px] rounded-xl border border-border bg-surface-raised p-3 sm:p-4 flex flex-col justify-center">
        <ChartHeader
          title="Ventas por origen"
          description="Dashboard vs carrito del sitio web."
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface-raised p-3 sm:p-4">
        <ChartHeader
          title="Ventas por origen"
          description="Dashboard vs carrito del sitio web."
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
    <div className="rounded-xl border border-border bg-surface-raised p-3 sm:p-4">
      <ChartHeader
        title="Ventas por origen"
        description="Dashboard vs carrito del sitio web."
        dateFrom={dateFrom}
        dateTo={dateTo}
      />
      <div className="mt-2 h-[200px] w-full min-w-[120px] sm:h-[220px]" style={{ minHeight: 200 }}>
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{ width: 400, height: 200 }}
        >
          <PieChart>
            <Pie
              data={entries}
              cx="50%"
              cy="45%"
              innerRadius="40%"
              outerRadius="65%"
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
            >
              {entries.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => `$${Number(v ?? 0).toFixed(2)}`} />
            <Legend
              layout="horizontal"
              wrapperStyle={{ paddingTop: "8px" }}
              formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
